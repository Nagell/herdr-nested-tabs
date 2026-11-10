#!/usr/bin/env python3
# What the sidebar shows under each Codex agent, read from Codex's own session
# file (~/.codex/sessions/.../rollout-*.jsonl), which its process keeps open.
# Arguments: "<terminal>:<pid>" for each Codex agent, the pid being the
# terminal's own program (its shell). Prints one JSON object keyed by terminal:
# model, effort (the last turn's), context (% of the window the last turn used)
# and lastAt (when it last finished a turn). Python 3, standard library.
import glob, json, os, re, subprocess, sys
from datetime import datetime

TAIL = 4 * 1024 * 1024  # enough of the end for the last turn's records


def descendants(root):
    try:
        out = subprocess.run(["ps", "-axo", "pid=,ppid="], capture_output=True, text=True, timeout=3).stdout
    except Exception:
        return []
    parent = {}
    for line in out.splitlines():
        parts = line.split()
        if len(parts) == 2:
            parent[parts[0]] = parts[1]
    mine = []
    for pid in parent:
        q = pid
        while q and q != root and q in parent:
            q = parent[q]
        if q == root:
            mine.append(pid)
    return mine


def open_rollouts(pids):
    # Linux: the processes' open files; macOS: lsof.
    found = set()
    if os.path.isdir("/proc"):
        for pid in pids:
            for fd in glob.glob(f"/proc/{pid}/fd/*"):
                try:
                    path = os.readlink(fd)
                except OSError:
                    continue
                if re.search(r"/rollout-[^/]*\.jsonl$", path):
                    found.add(path)
        return found
    if not pids:
        return found
    try:
        out = subprocess.run(["lsof", "-Fn", "-p", ",".join(pids)], capture_output=True, text=True, timeout=5).stdout
    except Exception:
        return found
    for line in out.splitlines():
        if line.startswith("n") and re.search(r"/rollout-[^/]*\.jsonl$", line):
            found.add(line[1:])
    return found


def seconds(ts):
    try:
        return int(datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp())
    except Exception:
        return None


def model_name(mid):
    # "gpt-5.6-terra" -> "GPT-5.6 Terra"
    if not mid:
        return None
    m = re.match(r"gpt-([\d.]+)(?:-(.+))?$", mid)
    if not m:
        return mid
    return f"GPT-{m.group(1)}" + (f" {m.group(2).replace('-', ' ').title()}" if m.group(2) else "")


def records(path, whole=False):
    with open(path, "rb") as f:
        f.seek(0, 2)
        size = f.tell()
        start = 0 if whole else max(0, size - TAIL)
        f.seek(start)
        lines = f.read().split(b"\n")
    if start:
        lines = lines[1:]
    for raw in reversed(lines):
        if raw.strip():
            try:
                yield json.loads(raw)
            except Exception:
                continue


def read(path):
    info = {"model": None, "effort": None, "context": None, "lastAt": None}
    turn = usage = done = None
    for whole in (False, True):
        for j in records(path, whole):
            p = j.get("payload") or {}
            kind = j.get("type")
            if turn is None and kind == "turn_context":
                turn = p
            elif kind == "event_msg" and isinstance(p, dict):
                if usage is None and p.get("type") == "token_count" and p.get("info"):
                    usage = p["info"]
                elif done is None and p.get("type") == "task_complete":
                    done = j.get("timestamp")
            if turn is not None and usage is not None and done is not None:
                break
        # Only a turn context older than the tail sends it back for the whole file.
        if turn is not None:
            break
    if turn:
        info["model"] = model_name(turn.get("model"))
        effort = turn.get("effort") or ((turn.get("collaboration_mode") or {}).get("settings") or {}).get("reasoning_effort")
        info["effort"] = effort if isinstance(effort, str) else None
    if usage:
        last = usage.get("last_token_usage") or {}
        window = usage.get("model_context_window")
        used = last.get("total_tokens")
        if window and used is not None:
            info["context"] = round(used * 100 / window)
    info["lastAt"] = seconds(done) if done else None
    return info


def main():
    out = {}
    for arg in sys.argv[1:]:
        terminal, _, pid = arg.partition(":")
        if not pid.isdigit():
            continue
        files = open_rollouts(descendants(pid))
        if not files:
            continue
        # Several can be open (a sub-agent has its own): the one written to last is
        # taken for its session. One that can't be read leaves only this agent blank.
        try:
            path = max(files, key=lambda f: os.path.getmtime(f) if os.path.exists(f) else 0)
            out[terminal] = read(path)
        except Exception:
            continue
    print(json.dumps(out))


main()
