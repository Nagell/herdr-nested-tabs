# Nested Tabs

Herdr's default window with the tabs moved out of the top bar and into the
Spaces sidebar. Each space lists its own tabs right under it, so you can see
what every space is running, and which agent needs you, without switching
spaces. Claude Code and Codex agents show their model, effort, context and
time since their last reply; Claude Code agents also how many sub-agents they
run. New tabs come from a `+`
on the space's row. The top bar keeps Files and Changes, hides its tab chips
(a prop or key brings them back) and loses its `+`.

![Nested Tabs](preview.png)

## What you see

Everything outside the sidebar list and the top bar is the same as Herdr's
`main` layout (0.1.13), with the theme's own colors. There's no title bar.

**Left: the sidebar**, 268px wide, `chrome` background, from top to bottom:

1. **Brand strip**, 46px (shipped `workspace-chrome`). You can drag the
   window by it.
2. **Spaces list** (this layout's `nested-tabs` mod) and **Agents list**
   (shipped `agents`). The two split the height equally, each at least 90px.
   - Header, 31px: "Spaces" in 11.5px `dim`, then on the right a 22px
     **Compact**/**Detailed** switch (`dim`; `foreground` on `selected` while
     Detailed) and a 26px `+` button that makes a new space.
   - **Status column**: every space, tab and terminal row starts with 4px of padding, then a 10px
     column holding its status mark (at 85% opacity), then a 6px gap, so all
     marks line up whatever the row's depth. Everything after it sits 12px
     further right than in Herdr's `spaces` mod.
   - **Space row**, 30px (28px for a worktree), 8px radius. After the status
     column: an 18px fold arrow (a Lucide chevron drawn at 16px, `muted`; `dim` when the
     space has one tab or none), then an 18px
     rounded-square avatar with the space's first letter in bold white
     10.5px. The avatar colors come from a fixed six-color palette (`#22a99a`,
     `#e3814f`, `#5b8def`, `#8b7cf6`, `#3fae6a`, `#d9649a`) and are stored in
     the shared `space.colors`. Next comes the name (13px `foreground`, at
     most 150px wide, truncated), then on the right only what is unusual about
     its git state, in 11.5px `dim`: the repo name when it differs from the
     space name, and the branch unless it is `main`/`master` or matches the
     name. After that, `↑n` in `ansi2` and `↓n` in `ansi1`, and last, on the
     active space's row and on a hovered one,
     a `+` drawn like a tab row's ×: a 12px plus icon in `dim`, `foreground` on hover, at the
     same right edge.
   - **Worktree rows** sit under their repo's space, indented by 23px, with
     a branch icon in place of the avatar.
   - **Tab rows**, 26px each, 7px radius, 12.5px text, sit under their space
     and above its worktrees. After the status column they start with an 18px
     arrow column under the space's avatar (23px indent, plus 23px more under
     a worktree), empty unless the tab has several terminals, then 5px on, the
     program icon (14px; tinted icons in `muted`) and the tab name. A folded
     tab with two agents or more shows two 12px icons overlapping (the second
     6px right and down) and "N agents" in 11px `dim` after the name. A tab
     with no terminal and no program icon (a file opened from Files or
     Changes) shows the shipped `mods/files/file.svg` in `muted`.
     A tab nobody named (`tb<n>`) shows its
     program's name instead, or "Terminal", and a zoomed tab gets " Z" after
     its name. The selected tab in the active space is drawn in
     `foreground` on `selected` with a 12px × close. Other tabs are `muted`
     and show the × only while hovered.
   - **Agent details**, in 11px `dim` after the name, joined by `·`: model,
     effort, context used (`ansi2` under 50%, `ansi3` from 50%, `ansi1` from
     80%) and the time since its last reply (`4m`, `3h`, `2d`; not while it
     works). Only for Claude Code and Codex agents on this computer (Codex:
     `GPT-5.6 Terra`, its reasoning effort, the last turn's tokens of the
     window, the time its last turn finished). A tab with one
     terminal shows them on its own row, and so does a folded tab with several
     terminals and one agent among them (no sub-agent chip there). An opened
     tab lists each terminal under it as a 26px row with the same columns as
     the tab's, so its icon sits under the tab's: an agent with its title (the conversation's name) and details, or a plain
     terminal with its program's name. The active tab's focused terminal is
     drawn in `foreground` on `hover`, the others in `muted`. Detailed makes
     agent rows with details 44px (5px top padding) with
     everything top-aligned: status, arrow, icon, name (18px line), chip and ×
     on the first line, then 3px lower all details unshortened (14px line).
     An agent with no details yet (before its first reply) keeps a 26px row.
   - **Sub-agent chip** after an agent with sub-agents running or idle: 16px,
     4px radius, `raised`, the running count in 10.5px `foreground`, then
     `· n` idle in `dim` when there are idle ones, and an 8px chevron. Open,
     each sub-agent gets a 22px row under the agent. A 1px `border` line runs
     down from under the agent's icon and turns right (9px) at the last row,
     bracketing them; 4px after the bracket, running ones get a dim 10px spinner
     and their description in
     12px `muted`; idle ones a 7px hollow circle (1px `dim` border) and their
     description in `dim`. Their type follows in 11px `dim`. Only the newest 8
     idle ones are listed, then "… n more idle".
   - With more than one machine connected, the rows are grouped under a 26px
     header per machine ("This computer", then each remote one), each with a
     `+`, a green or dim connection dot and its own fold arrow.
3. **Footer**, 69px (shipped `workspace-chrome` with `footer: true`).

**Right: the work area**:

1. **Top bar**, 42px, `chrome` with a 1px `border` line underneath (this
   layout's `tabs-bar` mod). By default it has no tab chips: just empty space you can drag
   the window by, then on the right a **Files** and a **Changes** button (26px tall, a 14px icon and a 12px
   label, `selected` while their panel is open), a **Timeline** button the same
   way when the side panel holds a block with id `prompts` and
   `shared("sidebar.options").timeline` isn't `false`, and on
   Windows/Linux, the minimize, maximize and close buttons. With
   `"props": {"chips": true}` on the `tabs` block, the shipped bar's tab chips
   (29px, icon, name, status, × on the selected one) fill the left side again.
   The mod command `tabs-bar.chips` (bound in `keys.json` to `cmd-shift-t` and
   `alt-shift-t`)
   turns them on or off; that choice survives restarts (`localStorage`
   `chips`) and wins over the prop once made.
2. **Terminals** of the active tab, 8px padding and gap. Panes have a 10px
   radius, a 1px `border` (`accent` when focused) and a 30px header
   (shipped `pane`).
3. **Side panel**, 368px (280–900), hidden until Files, Changes or Timeline opens it.
4. **Status bar**, 28px (shipped `workspace-status`).

## How it behaves

Agent status in the status column. A tab's is the most urgent of its
agents' (blocked, then working, then done); a folded space's the most urgent
of its tabs'. An open space or opened tab shows none, since the rows under it
show their own.

| Status  | Mark                                                   |
| ------- | ------------------------------------------------------ |
| working | 10px spinner in `working`, one turn every 900ms        |
| blocked | 5px dot in `blocked`                                   |
| done    | 5px dot in `done`                                      |
| idle    | nothing                                                |

- **Folding:** the arrow folds or unfolds a space's tabs, and so does a
  double-click anywhere else on the space's row. Folds survive restarts (they
  are kept in the mod's `localStorage` as `tabs.folded`).
- **Tab folding:** a tab with several terminals starts folded; its arrow lists
  them. Opened tabs survive restarts (`localStorage` `tabs.opened`).
- **New tab:** the `+` opens Herdr's new-tab menu (terminal, agents, new
  space, worktrees). It shows on the active space's row and on whichever
  space row is hovered; on another space it selects that space first, since
  the menu adds the tab to the active space. The row underneath doesn't
  react to the click.
- **Hover:** hovering a tab row shows its ×, hovering a space row its `+`.
  They appear at the right end, so the row's name truncates a little earlier
  while hovered.
- **Highlight:** when a space is open and has tabs, its selected tab gets the
  highlight and the space row doesn't. A folded or tab-less active space
  highlights its own row.
- **Tab rows:** a click selects the tab, and switches to its space first if
  needed. A double-click renames it, a right-click opens Herdr's tab menu, and
  × or a middle click closes it. Dragging moves the tab within its space only: the dragged row
  fades to 50% and a 2px `accent` line marks where it will land (above it
  when moving up, below it when moving down).
- **Space rows:** a click selects the space, a right-click opens the space
  menu, and dragging reorders spaces, but only among spaces on the same
  machine, with the same fade and line.
- **Top bar:** scrolling the wheel over it moves to the previous or next tab.
  The side panel is remembered per space, so switching spaces brings back
  that space's Files, Changes or closed state.
- **Git labels** update when a command or an agent turn ends in the space,
  when its terminal changes folder, when a local repo's `.git` changes, and
  every 60s while the window is in front.
- **Narrow sidebar** (under 160px): each space becomes a compact row with its
  number and `·`, or a `●` when it is blocked or done, and the tab rows are hidden.
- **Agent details** are read every 5s and the times move on every minute. When
  a line runs out of room (judged from the sidebar's width at about 6.2px per
  detail character and 7.2px per name character, keeping 9 name characters),
  the effort shortens to its words' capitals (`high` → `H`, `xhigh` → `XH`;
  `max` stays `MAX` and Codex's `minimal` becomes `MIN`), then the model goes, then the name truncates. Context
  and time never go.
- **Sub-agents** stay folded until the chip is clicked; open chips survive
  restarts (`localStorage` `agents.subsOpen`).
- **Compact/Detailed**: the header switch, or the mod command
  `nested-tabs.details` (bound in `keys.json` to `cmd-shift-i` and
  `alt-shift-i`), toggles it;
  the choice survives restarts (`localStorage` `agents.detailed`).
- **Agent rows** under a tab: a click switches to that space and tab and
  focuses the pane.
- **Timeline button:** opens the panel on the Timeline. Anything else that
  turns the panel to it (switching agents does) is undone at once, back to
  what was showing; only for 2s after a click on the Timeline button is a
  switch to it kept.

## Built from

- **Layout** `layouts/nested-tabs.json`: a copy of Herdr's `main` 0.1.13
  (`cloned_from` says so) with two blocks swapped. `sidebar-lists` →
  `spaces` shows the `nested-tabs` mod instead of `spaces`, and `work` → `tabs`
  shows `tabs-bar` instead of `tabs`. Node tree: `root` row → `sidebar`
  column (`brand`, `sidebar-lists` column of `spaces` + `agents`,
  `sidebar-footer`) and `work` column (`tabs`, `work-body` row of `main`
  + `panel` stack of `files`/`changes`, `status`). `tabs-bar` takes one
  optional prop, `chips`; `nested-tabs` takes none.
- **`mods/nested-tabs/`**: a clone of the shipped `spaces` mod (0.1.13) with
  `tabRows()`, `chevron()`, `status()` and the folding added. It reads
  `spaces()` (each space's `tabs`, with `id`, `name`, `index`, `active`,
  `status`, `zoomed`), `panes()` (program icon and name per tab, git
  folder), `machines()`, `layout()` (sidebar width), `theme()`,
  `shared("space.colors")`. Commands: `space.select`, `space.move`,
  `space.new`, `tab.select`, `tab.move`, `tab.rename`, `tab.close`. Overlays:
  the shipped `menu` mod with `tab: "space"` or `tab: "tab"`, and the
  shipped `new-menu` (popup, 250 × 512) from a space's `+`. Hover is
  `on_hover` on each row, remembering the one row under the pointer. Agent
  rows add `agents()` (by pane: title, status, app), `readTextFile` and
  `appHome()` (to load its scripts), `nextCommand()` (`details`) and the
  command `pane.focus`. Its scripts come from Over9k (MIT, `LICENSE-over9k`)
  with these changes:
  - `claude-info.py`: an output style's requests count for the effort; a
    session file whose `procStart` differs from its process's start time (a
    crashed session, its pid reused) is skipped; a request with a `context-1m*`
    beta counts against 1M; a cache it can't write doesn't stop its output.
  - `subagents.sh`: a teammate's message counts by its `senderTaskId`; a
    sub-agent whose last reply ended its turn (`stop_reason` `end_turn`) two
    minutes ago is done; a teammate (`"taskKind":"in_process_teammate"`) that
    sent a message or whose turn is over is idle instead of done (an 11th
    field); without `jq` it prints nothing.

  `claude-info.py` (run with `python3 -c`, or `python` without `python3`; prints a JSON
  object keyed by Herdr terminal: `model`, `effort`, `context`, `lastAt`,
  `transcript`, …) and `subagents.sh` (run with `sh -c` on a transcript, one
  tab-separated line per sub-agent: id, last write, description, type, model,
  start, tokens, effort, window, done, idle).
- **`mods/tabs-bar/`**: a clone of the shipped `tabs` mod (0.1.13) with
  the chips (back with `props().chips`) and the `+` removed, keeping the panel
  buttons, the per-space panel memory (`localStorage` `panels`) and the window
  buttons. The Timeline button reads `shared("sidebar.options").timeline`
  (Over9k's switch for it). Commands: `layout.show`/`layout.hide`/`layout.select`
  for the panel, `tab.prev`/`tab.next`, `nextCommand()` (`chips`), and for chips `tab.select`, `tab.move`,
  `tab.rename`, `tab.close` and the shipped `menu`, `window.minimize`/`maximize`/`close`. Art:
  `win-min.svg`, `win-max.svg`, `win-restore.svg`, `win-close.svg`, and
  `mods/over9k-prompts/timeline.svg` from Over9k when the Timeline is there.
- **`keys.json`**: `global` `cmd-shift-i` and `alt-shift-i` →
  `nested-tabs.details`, `cmd-shift-t` and `alt-shift-t` → `tabs-bar.chips`.
- **Shipped art it borrows:** `mods/workspace-chrome/` `chevron-down`,
  `chevron-right`, `spinner`, `branch`, `plus`, `server`, `monitor`;
  `mods/pane/close.svg`; `mods/files/file.svg`; `mods/changes/changes.svg`.
- **Programs:** `git status --porcelain=v2 --branch` and `git rev-parse` in
  each space's folder, through `exec` (on the space's machine), plus
  `hc machine ls/rm/add` to list and reconnect machines. Both come from the
  shipped `spaces` mod. For agent details, every 5s: `python3` running
  `claude-info.py` (reads `~/.claude/sessions/*.json`, the end of each
  conversation under `~/.claude/projects/`, and each Claude process's
  `HC_TERMINAL_ID` from `/proc/<pid>/environ` on Linux, `ps -wwE` on macOS;
  writes `~/.cache/over9k/agents/<terminal>.json`)
  and `sh` running `subagents.sh` per agent (reads the transcript's
  `subagents/` folder with `jq`, `awk`, `stat` and `perl` where there is one;
  caches in `~/.cache/over9k/`). For Codex agents,
  `hc get <terminal> --json` for the terminal's process pid (its shell), then `python3` running
  `codex-info.py` with `<terminal>:<pid>` arguments (finds the
  `~/.codex/sessions/**/rollout-*.jsonl` that a process under that pid holds
  open, through `ps` and `lsof`, or `/proc` on Linux, and reads its last
  `turn_context`, `token_count` and `task_complete`). Nothing reaches the
  network beyond Herdr's own machine connections.

## Watch out

- **Clones, not patches.** The mods are copies of the 0.1.13 `spaces` and
  `tabs` mods. Newer Herdr releases don't reach them. If the shipped ones
  changed, rebuild from the new versions and add the tab rows again, rather
  than copying these files.
- **Avatar colors are shared.** `space.colors` is the same shared key the
  shipped `spaces` mod writes, so switching layouts keeps the colors.
- **Tab drags must stay inside a space.** `tab.move` takes an index within
  the tab's own space. A drop on another space's tab is ignored, and so is
  the hover line over it.
- **`new-menu` only knows the active space.** It takes no space argument,
  so a `+` on another space runs `space.select` before opening it.
- **No group hover in gpui-kit.** `hover()` styles only the element itself,
  so revealing a child on a row's hover takes `on_hover` and a re-render.
- **Stop propagation** on the fold arrow, the `+`, the tab rows and ×: otherwise the
  press reaches the space row underneath and starts a space drag or a
  double-click fold.
- **Reset the drag on the list too.** The list's own mouse-up clears both
  the space and the tab drag, otherwise releasing between rows leaves a row
  stuck at 50%.
- **Watches files outside its folder:** `watchFolder` on each local repo's
  git directory, and `git` runs in every space's folder.
- **Narrow rail hides tabs.** Under 160px only the compact space rows show.
- **No palette entry.** Herdr's command palette lists only its own commands,
  so the Compact/Detailed toggle is a header switch and a key.
- **Widths are estimates.** gpui-kit can't measure text, so the shortening
  order is decided by characters; a very wide name can still truncate early.
- **Details are Claude Code's and Codex's, local only.** Other agents (Pi)
  and agents on other machines show name and status only. Codex has no
  sub-agent chip. `~/.cache/over9k/` is
  shared with Over9k if it's installed; the sub-agent caches carry the
  script's version, so each script rebuilds its own after the other ran.
- **Agent details need `python3` and `jq`.** Without `python3` agents show
  name and status only; without `jq` no sub-agents are listed.
- **`cmd-` keys are macOS keys.** On Linux and Windows `cmd` is Super/Win,
  which the window manager often takes, so each key is bound twice, with
  `alt-` as well.
- **Timeline is Over9k's.** The button needs the `over9k-prompts` mod
  installed and a `prompts` block in the layout's panel; without them the bar
  shows Files and Changes only.

## Done when

- `herdr-app check` passes for `mods/nested-tabs` and `mods/tabs-bar`, and
  `layout.switch {"name":"nested-tabs"}` shows the window above.
- Every space lists its tabs under it, and closing a tab removes its row.
- The active space's row shows a `+`, lined up with the selected tab's ×.
  Hovering another space shows its `+`; clicking it switches there and the
  new tab appears under that space. The top bar has no `+`.
- Hovering an unselected tab shows its ×, and clicking it closes that tab.
- A space with one tab shows a dimmer arrow than one with several.
- Clicking a tab in another space switches to that space and tab.
- The arrow and a double-click on the space row both fold and unfold, and the
  fold is still there after restarting Herdr.
- An agent working in a tab shows a spinner in the status column at the left
  edge. When it finishes or asks for input, a dot appears there. Folding the
  space moves that mark onto the space row, in the same column.
- Dragging a tab onto another tab in the same space reorders them, and the
  top bar shows no tab chips.
- A worktree space appears under its repo's space, with its own tabs under it.
- Opening Files in one space and switching to another that had it closed
  closes the panel, and switching back opens Files again.
- A Claude Code agent's row shows `model · effort · %` and, once it stops,
  the time since its last reply; narrowing the sidebar first shortens the
  effort to its capitals, then drops the model, while `%` and time stay.
- A tab with two terminals starts folded under its own name, with its agent's
  details if one of them is an agent, or overlapping icons and "2 agents" if
  both are; its arrow lists both under it, their icons under the tab's, and
  clicking one focuses it.
- An agent with sub-agents shows a count chip, running then idle; clicking it
  lists them (idle ones dimmed with a hollow circle) and clicking again hides
  them.
- An open sub-agent list sits inside a 1px bracket line running down from the
  agent's icon; past 8 idle ones it ends in "… n more idle".
- A sub-agent that finished its turn drops off the list two minutes later, but
  one writing a long tool call stays listed.
- A Codex agent's row shows its model (`GPT-5.6 Terra`), effort, `%` and the
  time since its last turn.
- The header switch, `herdr-app do nested-tabs.details` and `alt-shift-i`
  all flip between one-line and two-line agent rows, and the choice survives
  a restart. Detailed agent rows are 44px with name and details top-aligned;
  an agent that hasn't replied yet keeps a 26px row.
- A middle click on a tab row closes that tab.
- A file opened from Files shows as a tab with the file icon.
- After a Claude Code session crashes and its pid goes to another program,
  no other agent shows that session's details.
- With `"props": {"chips": true}` on the `tabs` block the top bar shows tab
  chips; without it, none. `herdr-app do tabs-bar.chips` flips that either
  way (so does `alt-shift-t`), and the choice survives a restart.
- In a layout whose panel has a `prompts` block with `over9k-prompts`, the
  top bar shows Timeline, and switching agents doesn't open it by itself.
