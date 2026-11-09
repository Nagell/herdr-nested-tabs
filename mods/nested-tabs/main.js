// Workspace spaces: stable colored avatars, worktrees under their checkout,
// grouped by machine when more than one is known. After a space's name, the repo
// its first terminal is in now, only where unusual: branch, ahead/behind. Agent state lives in the agents list, not here. Click to
// switch, right-click for its menu, drag to reorder.
// Each space lists its tabs under it, before its worktrees; the triangle folds them.
// A Claude Code agent's model, effort, context and sub-agents come from its own
// session files (claude-info.py, subagents.sh: from Over9k, MIT, LICENSE-over9k).

import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { spaces, machines, panes, agents, run, openOverlay, exec, hc, theme, shared, setShared, watchFolder, window, layout, readTextFile, appHome, nextCommand } from "herdr";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The sidebar's rail goes by its width, not a flag: dragging its edge narrows it too.
const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

// Where a space is now: its first terminal's live folder, else where it was made.
// `ps`: panes(), read once by the caller (each read copies every pane).
function place(s, ps) {
  const tabs = new Set((s.tabs ?? []).map((c) => c.id));
  return ps.find((p) => tabs.has(p.tab) && p.cwd)?.cwd || s.folder;
}
const rowHeight = ({ tree }) => (tree ? 28 : 30);
// Left offsets inside a row, so a child's icon sits under its parent's avatar.
const CHEVRON = 18;
const LEAD_GAP = 5;
const TREE_INDENT = CHEVRON + LEAD_GAP;
const ROW_PAD = 8;
const where = (s, ps) => JSON.stringify([s.machine ?? null, place(s, ps)]);
const base = (path) => path.replace(/\/+$/, "").split("/").pop();
// Changes made outside Herdr (an editor's save, a commit in another app): looked
// for this often, in repos the list shows, while the window is in front.
const FALLBACK = 60000;

// What a stored color name looks like on an avatar (the same in every mod
// that draws space avatars): one strong color per hue, light and dark alike.
const MARK = { ansi6: "#22a99a", ansi3: "#e3814f", ansi4: "#5b8def", ansi5: "#8b7cf6", ansi2: "#3fae6a", ansi1: "#d9649a" };

const isClaude = (a) => a.app === "claude-code" || a.program?.key === "claude";
// Claude Code puts a status glyph before the conversation's name in its title.
const agentTitle = (a) => (a.title ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
let PY;
const python = (args) => (PY ??= exec("python3", ["-c", "1"]).then((r) => (r?.code === 0 ? "python3" : "python"), () => "python"))
  .then((py) => exec(py, args));

// An effort shortened to its words' capitals (high → H, xhigh → XH); "max" stays
// whole so it doesn't read as medium's M.
function effortShort(e) {
  if (!e) return null;
  if (e === "max") return "MAX";
  return e.split(/[\s_-]+/).flatMap((w) => (/^x[a-z]{3,}$/.test(w) ? ["x", w.slice(1)] : [w]))
    .filter(Boolean).map((w) => w[0].toUpperCase()).join("");
}

// How long since the agent last replied: "4m", "3h", "2d".
function ago(i) {
  if (!i?.lastAt) return null;
  const m = Math.max(0, Math.round((Date.now() / 1000 - i.lastAt) / 60));
  return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
}

// gpui-kit can't measure text, so whether details fit is judged by characters.
const DETAIL_CH = 6.2;
const NAME_CH = 7.2;
const NAME_MIN = 9;

// A space speaks up only when something in it needs you.
export function glyph(status) {
  return status === "blocked" || status === "done" ? "●" : "·";
}

export function tone(t, status) {
  return t[status] ?? t.unknown;
}

export default class Spaces extends View {
  init(_props, cx) {
    this.git = {}; // where() -> { name, branch, ahead, behind, repo, linked }, null: not a repo
    this.checked = {}; // where() -> when it was last looked at
    this.unsure = new Set(); // where()s git couldn't answer for (a machine away)
    this.pending = new Set(); // where()s to look at next
    this.busy = {}; // pane -> an agent working or a program in front of its shell
    this.ready = {}; // machine -> its layout was readable at the last look
    this.at = {}; // space -> its where() at the last look
    this.watching = new Set(); // local repos' git folders
    // Spaces made while this runs wait (at most a moment) for their git, so a
    // worktree appears under its repo instead of jumping there.
    this.shown = new Set(spaces().map((s) => s.id));
    this.born = {};
    this.pressed = null;
    this.over = null;
    this.tabPressed = null;
    this.tabOver = null;
    this.hovered = null; // row under the pointer ("space-<id>" / "tab-<id>"): shows its + or ×
    this.tabsFolded = new Set(JSON.parse(localStorage.getItem("tabs.folded") ?? "[]"));
    this.machines = [];
    this.reconnecting = JSON.parse(localStorage.getItem("machines.reconnecting") ?? "{}");
    for (const state of Object.values(this.reconnecting)) state.busy = false;
    this.folded = new Set(JSON.parse(localStorage.getItem("machines.folded") ?? "[]"));
    this.refreshMachines(cx);
    cx.timer.every(15000, cx => this.refreshMachines(cx));
    this.info = {}; // agent address -> { model, effort, context, lastAt, transcript }
    this.subs = {}; // agent address -> its running sub-agents
    this.subsOpen = new Set(JSON.parse(localStorage.getItem("agents.subsOpen") ?? "[]"));
    this.detailed = localStorage.getItem("agents.detailed") === "1";
    this.loadInfo(cx);
    cx.timer.every(5000, (cx) => this.loadInfo(cx));
    cx.timer.every(60000, (cx) => cx.notify()); // the "4m"s move on
    cx.spawn(async (cx) => {
      for (;;) {
        if ((await nextCommand()) === "details") this.setDetailed(!this.detailed);
        cx.notify();
      }
    });
    // `git status` walks the whole tree, on another machine a process there:
    // only when its answer could have changed (see `due`).
    cx.timer.every(250, (cx) => this.checkNew(cx));
  }

  checkNew(cx) {
    const now = Date.now();
    const sp = spaces();
    for (const s of sp) if (!this.shown.has(s.id)) this.born[s.id] ??= now;
    const due = this.due(now, sp, panes());
    if (due.size) this.refreshGit(due, cx);
    if (sp.some((s) => !this.shown.has(s.id)) || this.orderingDue(now)) cx.notify();
  }

  // Places whose git could have changed: new ones (a new space, a cd), where a
  // command or an agent's turn just ended (a checkout, a commit, edits), those on
  // a machine that is back, and repos in view whose fallback is due.
  due(now, sp, ps) {
    // Moved there: what it knew of that place may be old.
    const at = {};
    for (const s of sp) at[s.id] = where(s, ps);
    const keys = new Set(Object.values(at).filter((k) => JSON.parse(k)[1]));
    const due = new Set([...keys].filter((k) => !(k in this.git)));
    for (const [id, k] of Object.entries(at)) if (this.at[id] && this.at[id] !== k && keys.has(k)) due.add(k);
    this.at = at;
    const spaceOf = {};
    for (const s of sp) for (const t of s.tabs ?? []) spaceOf[t.id] = s;
    const busy = {};
    for (const p of ps) {
      if (!p.terminal || !spaceOf[p.tab]) continue;
      busy[p.pane] = p.status === "working" || !(p.program?.shell || p.program?.agent);
      if (this.busy[p.pane] && !busy[p.pane]) this.sameRepo(at[spaceOf[p.tab].id], keys).forEach((k) => due.add(k));
    }
    this.busy = busy;
    for (const m of machines()) {
      const ready = m.layout === "ready";
      if (ready && this.ready[m.name] === false) for (const k of keys) if (JSON.parse(k)[0] === m.name) due.add(k);
      this.ready[m.name] = ready;
    }
    if (window().active) {
      for (const k of keys) {
        const asks = this.git[k] || this.unsure.has(k);
        if (asks && !this.folded.has(JSON.parse(k)[0]) && now - (this.checked[k] ?? 0) > FALLBACK) due.add(k);
      }
    }
    return due;
  }

  // `key` and the other places in its repo (a commit there moves their ahead/behind).
  sameRepo(key, keys) {
    const repo = this.git[key]?.repo;
    return [key, ...(repo ? [...keys].filter((k) => this.git[k]?.repo === repo) : [])];
  }

  refreshMachines(cx) {
    cx.spawn(async cx => {
      try { const r = await hc(["machine", "ls", "--json"]); if (r.code === 0) this.machines = (JSON.parse(r.stdout).machines ?? []).filter((m) => !m.temporary); } catch {}
      cx.notify();
    });
  }

  rebuilt(machine) {
    return machine?.state === "unreachable" && /^a different core answers there \("[^"]+"\)$/.test(machine.why ?? "");
  }

  reconnect(machine, cx) {
    const name = machine.name;
    if (this.reconnecting[name]?.busy) return;
    const state = this.reconnecting[name] ??= { machine, removed: false };
    state.busy = true;
    state.error = null;
    localStorage.setItem("machines.reconnecting", JSON.stringify(this.reconnecting));
    cx.notify();
    cx.spawn(async cx => {
      try {
        const ask = async args => {
          const r = await hc([...args, "--json"]);
          if (r.code !== 0) {
            let error;
            try { error = JSON.parse(r.stdout || r.stderr).error?.message; } catch {}
            throw new Error(error || r.stderr || r.stdout || "Couldn't connect.");
          }
        };
        if (!state.removed) {
          await ask(["machine", "rm", name]);
          state.removed = true;
          localStorage.setItem("machines.reconnecting", JSON.stringify(this.reconnecting));
        }
        const args = ["machine", "add"];
        if (machine.via) args.push("--via", machine.target);
        else args.push(machine.target);
        args.push("--name", name);
        if (machine.session) args.push("--session", machine.session);
        if (machine.temporary) args.push("--temp");
        await ask(args);
        this.folded.delete(name);
        localStorage.setItem("machines.folded", JSON.stringify([...this.folded]));
        delete this.reconnecting[name];
      } catch (e) {
        state.error = String(e.message ?? e);
        state.busy = false;
      }
      localStorage.setItem("machines.reconnecting", JSON.stringify(this.reconnecting));
      this.refreshMachines(cx);
      cx.notify();
    });
  }

  // One look at a time, each place once however often it was asked for meanwhile.
  refreshGit(keys, cx) {
    for (const k of keys) this.pending.add(k);
    if (this.refreshing) return;
    this.refreshing = true;
    cx.spawn(async (cx) => {
      while (this.pending.size) {
        const keys = [...this.pending];
        this.pending.clear();
        for (const key of keys) await this.check(key, cx);
      }
      const used = new Set(Object.values(this.git).filter(Boolean).map((g) => JSON.parse(g.repo)).filter(([on]) => !on).map(([, repo]) => repo));
      for (const repo of this.watching) if (!used.has(repo)) this.watching.delete(repo);
      this.refreshing = false;
      cx.notify();
    });
  }

  // One place's git: branch, ahead/behind, its repo.
  async check(key, cx) {
    const [on, cwd] = JSON.parse(key);
    this.checked[key] = Date.now();
    this.unsure.delete(key);
    try {
      // No optional locks: a status that touched the index would wake the watch again.
      // Writes nothing under .git (index lock, fsmonitor cookie): watch() would wake on it.
      const r = await exec("git", ["--no-optional-locks", "-c", "core.fsmonitor=false", "status", "--porcelain=v2", "--branch"], { cwd, on });
      if (r.code !== 0) {
        // Only git's own "no" is remembered as no repo; anything else is asked again.
        if (!/not a git repository/i.test(r.stderr)) this.unsure.add(key);
        this.git[key] = null;
        return;
      }
      // The repo's own .git folder names it; a worktree's top differs from it.
      const top = await exec("git", ["rev-parse", "--show-toplevel"], { cwd, on });
      const common = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd, on });
      const repo = common.stdout.trim();
      const name = repo.endsWith("/.git") ? base(repo.slice(0, -5)) : base(repo).replace(/\.git$/, "");
      const info = { name, branch: null, ahead: 0, behind: 0, repo: JSON.stringify([on, repo]), linked: repo !== `${top.stdout.trim()}/.git` };
      for (const line of r.stdout.split("\n")) {
        if (line.startsWith("# branch.head ")) info.branch = line.slice(14);
        else if (line.startsWith("# branch.ab ")) {
          const [a, b] = line.slice(12).split(" ");
          info.ahead = Math.abs(parseInt(a, 10)) || 0;
          info.behind = Math.abs(parseInt(b, 10)) || 0;
        }
      }
      this.git[key] = info;
      if (!on) this.watch(repo, cx);
    } catch {
      // Couldn't ask (the machine is away): keep what it showed, look again later.
      this.git[key] ??= null;
      this.unsure.add(key);
    }
  }

  watch(repo, cx) {
    if (this.watching.has(repo)) return;
    this.watching.add(repo);
    cx.spawn(async (cx) => {
      try {
        while (this.watching.has(repo)) {
          await watchFolder(repo);
          const mine = JSON.stringify([null, repo]);
          if (this.watching.has(repo)) this.refreshGit(Object.keys(this.git).filter((k) => this.git[k]?.repo === mine), cx);
        }
      } catch { this.watching.delete(repo); }
    });
  }

  menu(w) {
    // A popup is as tall as its items; height is only the most.
    openOverlay({ mod: "menu", kind: "popup", width: 200, height: 260, props: { tab: "space", target: { id: w.id } } });
  }

  orderingDue(now) {
    return this.ordering && now - this.ordering.at >= 1000
      && this.ordering.machines.every(name => machines().some(m => m.name === name && m.layout === "ready"));
  }

  // Spaces in order, each worktree space moved under its main checkout's.
  ordered() {
    const sp = spaces(), ps = panes();
    const ready = (w) => this.shown.has(w.id) || where(w, ps) in this.git || Date.now() - (this.born[w.id] ??= Date.now()) > 1500;
    for (const w of sp) if (!this.shown.has(w.id) && ready(w)) this.shown.add(w.id);
    const list = sp.map((w, i) => ({ w, i, g: this.git[where(w, ps)] ?? null }));
    const mains = new Set(list.filter((r) => r.g && !r.g.linked).map((r) => r.g.repo));
    const nested = (r) => r.g?.linked && mains.has(r.g.repo);
    const out = [];
    const placed = new Set(); // repos whose worktrees are listed (under the first of its spaces)
    for (const r of list) {
      if (nested(r)) continue;
      out.push({ ...r, tree: null });
      if (!r.g || r.g.linked || placed.has(r.g.repo)) continue;
      placed.add(r.g.repo);
      const kids = list.filter((k) => nested(k) && k.g.repo === r.g.repo);
      kids.forEach((k, n) => out.push({ ...k, tree: n === kids.length - 1 ? "└─" : "├─" }));
    }
    // Simulate the batch so later indexes include earlier moves. An attempted
    // write can lose a sync conflict: allow the echo to settle before retrying.
    const order = sp.map(w => w.id);
    const target = out.map(r => r.w.id);
    const key = JSON.stringify([order, target, machines()]);
    if (order.every((id, i) => id === target[i])) {
      this.ordering = null;
    } else if (this.ordering?.key !== key || this.orderingDue(Date.now())) {
      const moved = new Set();
      this.ordering = { key, at: Date.now(), machines: [] };
      for (let i = 0; i < out.length; i++) {
        const from = order.indexOf(out[i].w.id);
        if (from === i) continue;
        run("space.move", { id: out[i].w.id, index: i + 1 });
        moved.add(out[i].w.machine ?? null);
        order.splice(i, 0, order.splice(from, 1)[0]);
      }
      this.ordering.machines = [...moved];
    }
    return out.filter(r => this.shown.has(r.w.id));
  }

  // The rows, under a header per machine once one isn't this computer.
  grouped(t, collapsed) {
    const rows = this.ordered();
    const ps = panes();
    const byPane = new Map(agents().map((a) => [a.pane, a]));
    const draw = (r) => (collapsed ? [this.compact(r, t)] : [this.row(r, t), ...this.tabRows(r, t, ps, byPane)]);
    const remote = [...new Set([...rows.map(r => r.w.machine).filter(Boolean), ...this.machines.map(m => m.name), ...Object.keys(this.reconnecting)])].sort();
    const loading = m => {
      const layout = machines().find(k => k.name === m)?.layout;
      return layout === "loading" || (!layout && this.machines.some(k => k.name === m && k.state === "connected"))
        || spaces().some(s => (s.machine ?? null) === m && !this.shown.has(s.id));
    };
    const loadingRow = m => div().id(`machine-loading-${m ?? "local"}`).h(28).flex_none().px(8).text_size(12).text_color(t.dim).child(collapsed ? "…" : "Loading…");
    if (!remote.length) return loading(null) && !rows.length ? [loadingRow(null)] : rows.flatMap(draw);
    const machineNames = [null, ...remote];
    return machineNames.flatMap((m) => {
      const mine = rows.filter((r) => (r.w.machine ?? null) === m);
      const repair = this.reconnecting[m];
      const machine = this.machines.find(k => k.name === m) ?? repair?.machine;
      const connected = !m || machine?.state === "connected";
      const rebuilt = this.rebuilt(machine) || !!repair;
      const folded = this.folded.has(m);
      const head = h_flex().id(`machine-${m ?? "local"}`).h(26).flex_none().px(collapsed ? 2 : 8).gap(7).items_center().text_size(11).text_color(t.dim)
        .cursor_pointer().hover(s => s.bg(t.hover))
        .on_click((_e, cx) => {
          folded ? this.folded.delete(m) : this.folded.add(m);
          localStorage.setItem("machines.folded", JSON.stringify([...this.folded]));
          cx.notify();
        })
        .child(svg(`mods/workspace-chrome/${m ? "server" : "monitor"}.svg`).size(13).flex_none())
        .when(!collapsed, el => el.child(div().flex_1().truncate().child(m ?? "This computer"))
          .when(!connected && !rebuilt, el => el.child(div().flex_none().child((machine?.state ?? "asleep").replace(/_/g, " "))))
          .when(rebuilt, el => el.child(h_flex().flex_none().gap(3).items_center()
            .child(div().max_w(140).truncate().child(repair?.error || "rebuilt ·"))
            .child(div().id(`machine-connect-${m}`).text_color(repair?.error ? t.blocked : t.muted)
              .hover(s => s.text_color(t.foreground))
              .tooltip(repair?.error || "This machine was rebuilt or replaced. Click to connect to the new one.")
              .on_click((_e, cx) => { cx.stop_propagation(); this.reconnect(machine, cx); })
              .child(repair?.busy ? "Connecting…" : "Connect"))))
          .when(connected, el => el.child(div().id(`machine-add-${m ?? "local"}`).flex_none().px(4).rounded(4).hover(s => s.bg(t.hover).text_color(t.foreground))
            .on_click((_e, cx) => { cx.stop_propagation(); run("space.new", { machine: m ?? "" }); }).child("+")))
          .child(div().size(6).rounded(3).flex_none().bg(connected ? t.ansi2 : t.dim))
          .child(svg(`mods/workspace-chrome/chevron-${folded ? "right" : "down"}.svg`).size(11).flex_none()));
      const empty = h_flex().id(`machine-new-${m ?? "local"}`).h(28).flex_none().px(8).gap(7).items_center().rounded(7)
        .text_size(12).text_color(t.dim).hover(s => s.bg(t.hover).text_color(t.foreground))
        .on_click(() => run("space.new", { machine: m ?? "" }))
        .child(svg("mods/workspace-chrome/plus.svg").size(12)).when(!collapsed, el => el.child("New space there"));
      if (!collapsed && rebuilt) return [head];
      return [head, ...(folded ? [] : mine.length ? mine.flatMap(draw) : [loading(m) ? loadingRow(m) : empty])];
    });
  }

  // Only what's unusual, after the name: "herdr \u00b7 spike \u21912 \u21931". The repo or
  // branch goes when the name already says it (a worktree is named after its branch),
  // and master/main go: nearly every space is on one.
  gitTail(g, tree, name, t) {
    const raw = g.branch ?? "detached";
    const same = (a) => a.toLowerCase() === name.toLowerCase();
    const branch = same(raw) || raw === "master" || raw === "main" ? "" : raw;
    const repo = tree || same(g.name) ? "" : g.name;
    const where = [repo, branch].filter(Boolean).join(" \u00b7 ");
    return h_flex()
      .flex_1()
      .min_w(0)
      .gap(5)
      .justify_end()
      .items_center()
      .text_size(11.5)
      .text_color(t.dim)
      .when(Boolean(where), (el) => el.child(div().min_w(0).truncate().child(where)))
      .when(g.ahead > 0, (el) => el.child(div().flex_none().text_color(t.ansi2).child(`\u2191${g.ahead}`)))
      .when(g.behind > 0, (el) => el.child(div().flex_none().text_color(t.ansi1).child(`\u2193${g.behind}`)));
  }

  // Each local Claude Code agent's details, and its sub-agents, from Claude Code's
  // own files. One look at a time; a stuck one is given up after a minute.
  loadInfo(cx) {
    if (this.infoBusy && Date.now() - this.infoBusy < 60000) return;
    this.infoBusy = Date.now();
    cx.spawn(async (cx) => {
      const info = {}, subs = {};
      try {
        const claude = agents().filter((a) => !a.address.includes("/") && isClaude(a));
        if (claude.length) {
          const dir = `${appHome()}/mods/nested-tabs`;
          this.ciScript ??= await readTextFile(`${dir}/claude-info.py`).catch(() => null);
          this.subScript ??= await readTextFile(`${dir}/subagents.sh`).catch(() => null);
          const r = this.ciScript ? await python(["-c", this.ciScript]).catch(() => null) : null;
          let all = {};
          try { all = JSON.parse(r?.stdout || "{}"); } catch {}
          for (const a of claude) {
            const i = all[a.address];
            if (!i) continue;
            info[a.address] = i;
            if (!this.subScript || !i.transcript) continue;
            const s = await exec("sh", ["-c", this.subScript, "sh", i.transcript]).catch(() => null);
            const running = (s?.stdout ?? "").split("\n").filter(Boolean).map((l) => {
              const [id, at, desc, type, model, , , effort, , done] = l.split("\t");
              return { id, at: +at, desc, type, model, effort: effort || null, done: done === "1" };
            }).filter((x) => !x.done).sort((x, y) => y.at - x.at);
            if (running.length) subs[a.address] = running;
          }
        }
      } finally {
        this.infoBusy = null;
      }
      const next = JSON.stringify([info, subs]);
      if (next !== this.infoKey) {
        this.infoKey = next;
        this.info = info;
        this.subs = subs;
        cx.notify();
      }
    });
  }

  setDetailed(on) {
    this.detailed = on;
    localStorage.setItem("agents.detailed", on ? "1" : "0");
  }

  // What follows an agent's name. Out of room, it gives way in this order: effort
  // shortens to its capitals, the model goes, then the name truncates; the context
  // and the time since its last reply always stay. `room`: px for name and details.
  fit(a, i, room, nameLen) {
    const pct = i.context == null ? null : Math.round(i.context);
    const when = a.status === "working" ? null : ago(i);
    let model = i.model, effort = i.effort;
    const width = () => [model, effort, pct == null ? null : `${pct}%`, when].filter(Boolean).join(" · ").length * DETAIL_CH;
    const name = Math.min(nameLen, NAME_MIN) * NAME_CH;
    if (name + width() > room) effort = effortShort(i.effort);
    if (name + width() > room) model = null;
    return { model, effort, pct, when };
  }

  // "Opus 5.5 · H · 19% · 4m": context green, yellow from 50%, red from 80%.
  detailLine(d, t) {
    const parts = [
      d.model && div().child(d.model),
      d.effort && div().child(d.effort),
      d.pct != null && div().text_color(d.pct >= 80 ? t.ansi1 : d.pct >= 50 ? t.ansi3 : t.ansi2).child(`${d.pct}%`),
      d.when && div().child(d.when),
    ].filter(Boolean);
    const dotted = parts.flatMap((p, n) => (n ? [div().child("·"), p] : [p]));
    return h_flex().flex_none().gap(4).items_center().text_size(11).text_color(t.dim).children(dotted);
  }

  // How many sub-agents an agent has running; a click shows or hides them.
  subsChip(addr, t) {
    const open = this.subsOpen.has(addr);
    return h_flex().id(`subs-${addr}`).h(16).px(4).gap(3).flex_none().items_center().rounded(4)
      .bg(t.raised).text_size(10.5).text_color(t.foreground).hover((s) => s.bg(t.hover))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => {
        cx.stop_propagation();
        if (open) this.subsOpen.delete(addr);
        else this.subsOpen.add(addr);
        localStorage.setItem("agents.subsOpen", JSON.stringify([...this.subsOpen]));
        cx.notify();
      })
      .child(String(this.subs[addr].length))
      .child(svg(`mods/workspace-chrome/chevron-${open ? "down" : "right"}.svg`).size(8));
  }

  // An agent's name and details: on one line (compact), or the details under the
  // name (detailed). `room` is what the row leaves for both.
  nameAndDetails(name, a, room, t) {
    const i = a && this.info[a.address];
    if (!i) return div().flex_1().min_w(0).truncate().child(name);
    if (this.detailed) {
      return v_flex().flex_1().min_w(0)
        .child(div().truncate().line_height("15px").child(name))
        .child(this.detailLine(this.fit(a, i, room, 0), t).line_height("13px"));
    }
    return h_flex().flex_1().min_w(0).gap(6).items_center()
      .child(div().min_w(0).truncate().child(name))
      .child(this.detailLine(this.fit(a, i, room, [...name].length), t));
  }

  // The px a row leaves for its name and details: the list's width less its
  // indent, icon, gaps and what sits at its end.
  room(indent, ends) {
    const sidebar = find(layout(), "sidebar")?.size?.px ?? 268;
    return sidebar - 16 - indent - ROW_PAD - CHEVRON - 7 * 3 - ends;
  }

  // An agent's running sub-agents, under it while its chip is open.
  subRows(addr, indent, t) {
    if (!this.subsOpen.has(addr)) return [];
    return (this.subs[addr] ?? []).map((s) => h_flex().id(`sub-${addr}-${s.id}`).h(22).flex_none().pl(indent).pr(ROW_PAD).gap(7).items_center()
      .text_size(12).text_color(t.muted)
      .child(h_flex().size(CHEVRON).flex_none().items_center().justify_center()
        .child(svg("mods/workspace-chrome/spinner.svg").size(10).text_color(t.dim).spin(1800)))
      .child(div().flex_1().min_w(0).truncate().child(s.desc || s.type || "sub-agent"))
      .when(Boolean(s.type), (el) => el.child(div().flex_none().text_size(11).text_color(t.dim).child(s.type))));
  }

  // A tab with several terminals lists each under it: an agent with its details,
  // or a plain terminal. A click focuses that pane.
  paneRows(w, c, list, indent, byPane, t) {
    return list.flatMap((p) => {
      const a = byPane.get(p.pane);
      const on = w.active && c.active && p.focused;
      const name = a ? agentTitle(a) || a.program?.name || "Agent" : p.program?.name ?? (p.title || "Terminal");
      const prog = (a ?? p).program;
      const mark = a ? this.status(a.status, t) : null;
      const chip = a && this.subs[a.address]?.length ? this.subsChip(a.address, t) : null;
      const room = this.room(indent, (mark ? 19 : 0) + (chip ? 36 : 0));
      const row = h_flex().id(`pane-${p.pane}`).h(this.detailed && a && this.info[a.address] ? 36 : 26).flex_none().pl(indent).pr(ROW_PAD).gap(7).items_center().rounded(7)
        .text_size(12.5).text_color(on ? t.foreground : t.muted)
        .when(on, (el) => el.bg(t.hover))
        .hover((s) => s.bg(t.hover))
        .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
        .on_click((_e, cx) => {
          if (!w.active) run("space.select", { id: w.id });
          if (!c.active) run("tab.select", { id: c.id });
          run("pane.focus", { pane: p.pane });
          cx.notify();
        })
        .child(h_flex().size(CHEVRON).flex_none().items_center().justify_center()
          .when(Boolean(prog?.icon), (el) => el.child(prog.tint ? svg(prog.icon).size(14).text_color(t.muted) : image(prog.icon).size(14))))
        .child(this.nameAndDetails(name, a, room, t))
        .when(Boolean(mark), (el) => el.child(mark))
        .when(Boolean(chip), (el) => el.child(chip));
      return [row, ...(a ? this.subRows(a.address, indent + TREE_INDENT, t) : [])];
    });
  }

  tabsOpen(w) {
    return !this.tabsFolded.has(w.id);
  }

  toggleTabs(w) {
    if (this.tabsFolded.has(w.id)) this.tabsFolded.delete(w.id);
    else this.tabsFolded.add(w.id);
    const ids = new Set(spaces().map((s) => s.id));
    localStorage.setItem("tabs.folded", JSON.stringify([...this.tabsFolded].filter((id) => ids.has(id))));
  }

  chevron(w, t) {
    const open = this.tabsOpen(w);
    // One tab or none: little to fold, so the arrow steps back.
    const few = (w.tabs?.length ?? 0) <= 1;
    return div().id(`fold-${w.id}`).size(CHEVRON).flex_none().flex().items_center().justify_center().rounded(3)
      .text_color(few ? t.dim : t.muted).hover((s) => s.text_color(t.foreground))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => { cx.stop_propagation(); this.toggleTabs(w); cx.notify(); })
      // Lucide draws the arrow in the middle half of its box: 16 shows about 8 px.
      .child(svg(`mods/workspace-chrome/chevron-${open ? "down" : "right"}.svg`).size(16));
  }

  // New tab, on the active or hovered space's row: drawn like a tab row's ×, at
  // the same right edge. Opens the menu the top bar's + used (it adds to the
  // active space, so another space is selected first).
  addTab(w, t) {
    return div().id(`add-${w.id}`).flex_none().text_color(t.dim).hover((s) => s.text_color(t.foreground))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => {
        cx.stop_propagation();
        if (!w.active) run("space.select", { id: w.id });
        openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 });
      })
      .child(svg("mods/workspace-chrome/plus.svg").size(12));
  }

  // Remember which row the pointer is on, so it can show its + or ×.
  hover(key) {
    return (on, cx) => {
      if (on) this.hovered = key;
      else if (this.hovered === key) this.hovered = null;
      cx.notify();
    };
  }

  // Working: spinner. Blocked or done: a dot in its color. Idle: nothing.
  status(status, t) {
    if (status === "working") return svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900);
    if (status === "blocked" || status === "done") return div().size(6).rounded(3).flex_none().bg(t[status]);
    return null;
  }

  // A space's tabs, as the top tab bar drew them: program icon, name, status, close on the shown one.
  // A tab with one terminal carries its agent's details on its own row; one with
  // several lists them under it (paneRows).
  tabRows({ w, tree }, t, ps, byPane) {
    if (!this.tabsOpen(w)) return [];
    const indent = ROW_PAD + TREE_INDENT + (tree ? TREE_INDENT : 0);
    // Tabs move only within their space, so a drag shows feedback only there.
    const dragged = (w.tabs ?? []).find((x) => x.id === this.tabPressed);
    return (w.tabs ?? []).flatMap((c) => {
      const program = ps.find((p) => p.tab === c.id && p.program?.agent)?.program ?? ps.find((p) => p.tab === c.id)?.program;
      const name = /^tb\d+$/.test(c.name) ? program?.name ?? "Terminal" : c.name;
      const on = w.active && c.active;
      const mark = this.status(c.status, t);
      const target = dragged && this.tabOver === c.id && dragged.id !== c.id;
      const list = ps.filter((p) => p.tab === c.id && p.terminal);
      const a = list.length === 1 ? byPane.get(list[0].pane) : null;
      const chip = a && this.subs[a.address]?.length ? this.subsChip(a.address, t) : null;
      const closing = on || this.hovered === `tab-${c.id}`;
      const room = this.room(indent, (mark ? 19 : 0) + (chip ? 36 : 0) + (closing ? 19 : 0));
      const tall = this.detailed && a && this.info[a.address];
      const row = h_flex().relative().id(`tab-${c.id}`).h(tall ? 36 : 26).flex_none().pl(indent).pr(ROW_PAD).gap(7).items_center().rounded(7)
        .text_size(12.5).text_color(on ? t.foreground : t.muted)
        .when(on, (el) => el.bg(t.selected))
        .when(!on, (el) => el.hover((s) => s.bg(t.hover)))
        .when(dragged?.id === c.id && this.tabOver !== c.id, (el) => el.opacity(0.5))
        .when(target, (el) => el.child(
          div().absolute().left(0).right(0).h(2).bg(t.accent)
            .when(dragged.index < c.index, (line) => line.bottom(0))
            .when(dragged.index > c.index, (line) => line.top(0)),
        ))
        .on_mouse_down("left", (e, cx) => {
          cx.stop_propagation();
          this.tabPressed = c.id;
          this.tabOver = c.id;
          if (e.click_count === 2) run("tab.rename", { id: c.id });
        })
        .on_mouse_move((_e, cx) => {
          const over = (w.tabs ?? []).some((x) => x.id === this.tabPressed) ? c.id : null;
          if (this.tabPressed !== null && this.tabOver !== over) {
            this.tabOver = over;
            cx.notify();
          }
        })
        .on_mouse_up("left", (_e, cx) => {
          const from = this.tabPressed;
          this.tabPressed = null;
          this.tabOver = null;
          if (from && from !== c.id && w.tabs.some((x) => x.id === from)) run("tab.move", { id: from, index: c.index });
          else if (from === c.id) {
            if (!w.active) run("space.select", { id: w.id });
            run("tab.select", { id: c.id });
          }
          cx.notify();
        })
        .on_hover(this.hover(`tab-${c.id}`))
        .on_mouse_down("right", (_e, cx) => {
          cx.stop_propagation();
          openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: w.id } } });
        })
        .child(h_flex().size(CHEVRON).flex_none().items_center().justify_center()
          .when(Boolean(program?.icon), (el) => el.child(program.tint ? svg(program.icon).size(14).text_color(t.muted) : image(program.icon).size(14))))
        .child(this.nameAndDetails(c.zoomed ? `${name} Z` : name, a, room, t))
        .when(Boolean(mark), (el) => el.child(mark))
        .when(Boolean(chip), (el) => el.child(chip))
        .when(closing, (el) => el.child(div().id(`close-${c.id}`).flex_none().text_color(t.dim).hover((s) => s.text_color(t.foreground))
          .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
          .on_click((_e, cx) => { cx.stop_propagation(); run("tab.close", { id: c.id }); })
          .child(svg("mods/pane/close.svg").size(12))));
      if (list.length > 1) return [row, ...this.paneRows(w, c, list, indent + TREE_INDENT, byPane, t)];
      return [row, ...(a ? this.subRows(a.address, indent + TREE_INDENT, t) : [])];
    });
  }

  row({ w, i, g, tree }, t) {
    const open = this.tabsOpen(w);
    // With its tabs listed, the shown tab carries the highlight instead of the space.
    const on = w.active && !(open && w.tabs?.length);
    const mark = open ? null : this.status(w.status, t);
    const fromIndex = this.pressed === null ? -1 : spaces().findIndex(s => s.id === this.pressed);
    const colors = shared("space.colors") ?? {};
    const color = colors[w.id] ?? "ansi6";
    const fill = color.startsWith("#") ? color : (MARK[color] ?? t[color]);
    return v_flex()
      .relative()
      .id(`space-${w.id}`)
      .px(ROW_PAD)
      .h(rowHeight({ tree }))
      .flex_none()
      .justify_center()
      .rounded(8)
      .when(on, (el) => el.bg(t.selected))
      .when(!on, (el) => el.hover((s) => s.bg(t.hover)))
      .when(this.pressed === w.id && this.over !== w.id, (el) => el.opacity(0.5))
      .when(this.pressed !== null && this.over === w.id && this.pressed !== w.id, (el) => el.child(
        div().absolute().left(0).right(0).h(2).bg(t.accent)
          .when(fromIndex < i, line => line.bottom(0))
          .when(fromIndex > i, line => line.top(0)),
      ))
      .on_mouse_down("left", (e, cx) => {
        this.pressed = w.id;
        this.over = w.id;
        if (e.click_count === 2) { this.toggleTabs(w); cx.notify(); }
      })
      .on_mouse_move((_e, cx) => {
        const source = spaces().find(s => s.id === this.pressed);
        const over = source && (source.machine ?? null) === (w.machine ?? null) ? w.id : null;
        if (this.pressed !== null && this.over !== over) {
          this.over = over;
          cx.notify();
        }
      })
      .on_mouse_up("left", (_e, cx) => {
        const from = this.pressed;
        const over = this.over;
        this.pressed = null;
        this.over = null;
        if (from !== null && over === w.id && from !== w.id) {
          const index = spaces().findIndex(s => s.id === w.id);
          if (index !== -1) run("space.move", { id: from, index: index + 1 });
        } else if (from === w.id) run("space.select", { id: w.id });
        cx.notify();
      })
      .on_hover(this.hover(`space-${w.id}`))
      .on_mouse_down("right", () => this.menu(w))
      .child(
        h_flex()
          .gap(9)
          .items_center()
          .child(h_flex().flex_none().gap(LEAD_GAP).items_center()
            .when(Boolean(tree), el => el.pl(TREE_INDENT))
            .child(this.chevron(w, t))
            .when(Boolean(tree), el => el.child(svg("mods/workspace-chrome/branch.svg").size(13).text_color(t.dim)))
            .when(!tree, el => el.child(h_flex().size(18).flex_none().rounded(5).bg(fill).items_center().justify_center().text_size(10.5).font_bold().text_color("#ffffff").child([...w.name][0]?.toUpperCase() ?? "?"))))
          .child(div().flex_shrink(0).max_w(150).truncate().text_color(t.foreground).child(w.name))
          .child(g ? this.gitTail(g, tree, w.name, t) : div().flex_1())
          .when(Boolean(mark), el => el.child(mark))
          .when(w.active || this.hovered === `space-${w.id}`, el => el.child(this.addTab(w, t))),
      );
  }

  compact({ w, i }, t) {
    return h_flex()
      .id(`space-${w.id}`)
      .h(26)
      .flex_none()
      .justify_center()
      .gap(4)
      .when(w.active, (el) => el.bg(t.raised))
      .hover((s) => s.bg(t.hover))
      .on_click(() => run("space.select", { id: w.id }))
      .child(div().text_color(w.active ? t.foreground : t.muted).child(String(i + 1)))
      .child(div().text_color(tone(t, w.status)).child(glyph(w.status)));
  }

  render() {
    const t = theme();
    const collapsed = narrow();
    const palette = ["ansi6", "ansi3", "ansi4", "ansi5", "ansi2", "ansi1"];
    const sp = spaces();
    const ids = new Set(sp.map(p => p.id));
    const kept = Object.fromEntries(Object.entries(shared("space.colors") ?? {}).filter(([id]) => ids.has(id)));
    let changed = Object.keys(kept).length !== Object.keys(shared("space.colors") ?? {}).length;
    for (const p of sp) {
      if (kept[p.id] || p.name === "~") continue;
      const uses = c => Object.values(kept).filter(v => v === c).length;
      kept[p.id] = palette.reduce((best, c) => uses(c) < uses(best) ? c : best);
      changed = true;
    }
    if (changed) setShared("space.colors", kept);
    return v_flex().size_full().min_h(0).bg(t.chrome).text_size(13)
      .child(h_flex().h(31).pl(16).pr(10).items_center().justify_between().text_size(11.5).text_color(t.dim)
        .when(!collapsed, el => el.child(div().flex_1().child("Spaces"))
          // Agent rows: details on the name's line, or under it.
          .child(div().id("agents-detailed").h(22).px(6).mr(2).flex_none().flex().items_center().rounded(5)
            .text_color(this.detailed ? t.foreground : t.dim).when(this.detailed, s => s.bg(t.selected))
            .hover(s => s.bg(t.hover).text_color(t.foreground))
            .on_click((_e, cx) => { this.setDetailed(!this.detailed); cx.notify(); })
            .child(this.detailed ? "Detailed" : "Compact")))
        .child(div().id("space-new").size(26).flex_none().flex().items_center().justify_center().rounded(6).hover(s => s.bg(t.hover).text_color(t.foreground))
          .on_click(() => run("space.new")).child(svg("mods/workspace-chrome/plus.svg").size(14))))
      .child(v_flex().flex_1().min_h(0).px(8).pb(14).overflow_y_scrollbar().mode("always")
        .on_mouse_up("left", (_e, cx) => { this.pressed = null; this.tabPressed = null; this.tabOver = null; cx.notify(); })
        .children(this.grouped(t, collapsed)));
  }
}
