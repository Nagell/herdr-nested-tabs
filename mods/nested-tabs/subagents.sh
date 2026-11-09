#!/bin/sh
# Claude Code's subagents for a transcript ($1), from <transcript>/subagents/:
# one line each, tab-separated: id, last write (seconds), description, type,
# model, when it started (seconds), its context (the last request's input
# tokens), effort, context window, 1 once it's done, and 1 while it's idle (a
# teammate waiting for mail).
# Done: the parent was told so (a "finished", killed or failed notice for its
# task id; one waiting on work of its own isn't, though it writes nothing
# meanwhile), it was stopped (TaskStop: its notice only comes at the parent's
# next turn), it handed its report back (a message from it), or it never
# replied (two minutes on: a leftover, not one that runs). A signal only counts
# if the subagent has written nothing since: one told to carry on (SendMessage)
# runs again, with the old "finished" still in the parent's transcript. The parent's
# transcript (big) is read once for all of them; the answer is kept until it or
# a subagent's file changes, or for a minute at most.
# The parent's transcript only grows, and can reach hundreds of MB: its done
# signals are kept (a .state file, with the bytes read so far), and each run
# reads only what was added since; one that got shorter or starts differently
# was written anew, and is read from the top. What a subagent's own file says
# is kept too (a .seen file), until that file changes.
dir="${1%.jsonl}/subagents"; [ -d "$dir" ] || exit 0
now=$(date +%s)
cachedir="${XDG_CACHE_HOME:-$HOME/.cache}/over9k"; mkdir -p "$cachedir"
cache="$cachedir/subagents-$(printf '%s' "$1" | cksum | cut -d ' ' -f 1)"
stamp() { stat -c '%Y %s' "$1" 2>/dev/null || stat -f '%m %z' "$1" 2>/dev/null; }
# Bump v when this script changes, so cached answers (and states) from the old one go.
v=9
newest=$(ls -t "$dir"/*.jsonl 2>/dev/null | head -n 1)
key="v$v $(stamp "$1") $(stamp "$newest") $((now / 60))"
if [ -f "$cache" ] && [ "$(head -n 1 "$cache")" = "$key" ]; then tail -n +2 "$cache"; exit 0; fi

# Each done signal in the parent's transcript, as "id seconds": from the bytes
# added since the state's offset, whole lines only (one being written waits for
# the next run), after those found before.
state="$cache.state" chunk="$cache.$$.chunk"
if [ -f "$1" ]; then
  start=$(head -c 4096 "$1" | cksum | cut -d ' ' -f 1)
  sv= off=0 was=
  [ -f "$state" ] && read -r sv off was < "$state"
  case "$off" in ''|*[!0-9]*) off=0 sv= ;; esac
  size=$(wc -c < "$1" | tr -d ' ')
  if [ "$sv" != "v$v" ] || [ "$was" != "$start" ] || [ "$off" -gt "$size" ]; then off=0; : > "$cache.$$.old"
  else tail -n +2 "$state" > "$cache.$$.old"; fi
  tail -c +$((off + 1)) "$1" > "$chunk"
  n=$(wc -c < "$chunk" | tr -d ' ')
  if [ "$n" -gt 0 ] && [ "$(tail -c 1 "$chunk" | od -An -tx1 | tr -d ' \n')" != 0a ]; then
    n=$((n - $(tail -n 1 "$chunk" | wc -c | tr -d ' ')))
    head -c "$n" "$chunk" > "$chunk.w" && mv -f "$chunk.w" "$chunk"
  fi
  { echo "v$v $((off + n)) $start"
    cat "$cache.$$.old"
    # A teammate's message names it by name, not id; its senderTaskId is the id.
    grep -E '<task-id>|Successfully stopped task: |agent-message from=|"senderTaskId"' "$chunk" 2>/dev/null | jq -Rr '
    (try (fromjson | .timestamp // empty | sub("\\.[0-9]+Z$"; "Z") | fromdate) catch empty) as $t
    | ( (scan("<task-id>[a-z0-9]*</task-id>.{0,600}") | select(test("finished</summary>|<status>(killed|failed|stopped)</status>")) | capture("^<task-id>(?<i>[a-z0-9]*)").i | [., "s"]),
        (scan("Successfully stopped task: [a-z0-9]*") | split(" ")[3] | [., "s"]),
        (scan("agent-message from=\\\\\"[a-z0-9]*") | sub(".*\""; "") | [., "m"]),
        (scan("\"senderTaskId\":\"[a-z0-9-]*\"") | split("\"")[3] | [., "m"]) )
    | "\(.[0]) \($t) \(.[1])"' 2>/dev/null
  } > "$state.$$" && mv -f "$state.$$" "$state"
  rm -f "$chunk" "$cache.$$.old"
  signals=$(tail -n +2 "$state" | sort -k1,1 -k2,2n)
fi

# What each subagent's file says, kept with its stamp (a .seen file, a line
# each, |-separated: id, stamp, model, start, tokens, effort, window, last
# record, and 1 if it ever replied), so only ones that wrote since are read again.
seen="$cache.seen"; [ -f "$seen" ] || : > "$seen"
# Per subagent, once: "id <last stop signal> <last message from it>" (- for none).
marks="$cache.$$.marks"
printf '%s\n' "${signals:-}" | awk 'NF == 3 { ids[$1] = 1; if ($3 == "s") s[$1] = $2; else m[$1] = $2 }
  END { for (i in ids) print i, (i in s ? s[i] : "-"), (i in m ? m[i] : "-") }' > "$marks"
for m in "$dir"/*.meta.json; do
  [ -f "$m" ] || continue
  j="${m%.meta.json}.jsonl"
  [ -f "$j" ] || continue
  at=$(stat -c %Y "$j" 2>/dev/null || stat -f %m "$j" 2>/dev/null || echo 0)
  id=$(basename "$j" .jsonl)
  st="v$v-$(stamp "$j" | tr ' ' _)"
  row=$(grep "^$id|$st|" "$seen" | tail -n 1)
  if [ -z "$row" ]; then
    model=$(grep -o '"model":"[^"<|]*"' "$j" 2>/dev/null | tail -n 1 | cut -d '"' -f 4)
    start=$(head -n 1 "$j" | jq -r '.timestamp // empty | sub("\\.[0-9]+Z$"; "Z") | fromdate' 2>/dev/null)
    tokens=$(grep '"type":"assistant"' "$j" 2>/dev/null | tail -n 1 | jq -r '.message.usage | ((.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0))' 2>/dev/null)
    # Its effort (each reply records it) and context window: 1M when its requests
    # asked for that (the context-1m beta), else 200k.
    effort=$(grep -o '"effort":"[a-z]*"' "$j" 2>/dev/null | tail -n 1 | cut -d '"' -f 4)
    if grep -q 'context-1m' "$j" 2>/dev/null; then window=1000000; else window=200000; fi
    # Its last record, not its file's time: a session started again rewrites those.
    last=$(tail -n 20 "$j" | jq -r '.timestamp // empty | sub("\\.[0-9]+Z$"; "Z") | fromdate' 2>/dev/null | tail -n 1)
    replied=0; grep -q '"type":"assistant"' "$j" 2>/dev/null && replied=1
    # Its turn ended: the last message is its reply with no tool call in it.
    ended=$(tail -n 20 "$j" | jq -sr '[.[] | select(.type == "assistant" or .type == "user")] | last
      | if .type == "assistant" and ([.message.content | arrays | .[] | select(.type == "tool_use")] | length) == 0 then 1 else 0 end' 2>/dev/null)
    row="$id|$st|$model|$start|$tokens|$effort|$window|$last|$replied|${ended:-0}"
    { grep -v "^$id|" "$seen"; echo "$row"; } > "$seen.$$" && mv -f "$seen.$$" "$seen"
  fi
  IFS='|' read -r _ _ model start tokens effort window last replied ended <<EOF
$row
EOF
  said='' told=''
  IFS=' ' read -r _ said told <<EOF
$(grep "^${id#agent-} " "$marks")
EOF
  [ "$said" = - ] && said=''
  [ "$told" = - ] && told=''
  done=0 idle=0
  [ -n "$said" ] && [ "${last:-0}" -le $((said + 5)) ] && done=1
  # Newer Claude Codes mark it in its meta file too (and unmark it on a resume).
  grep -q '"finished":true' "$m" 2>/dev/null && done=1
  # Never replied two minutes on: not one that runs (a session started again can
  # write back an old one's files with nothing in them).
  [ "$done" = 0 ] && [ $((now - at)) -gt 120 ] && [ "$replied" = 0 ] && done=1
  # Its report handed back, or its turn over for two minutes. A teammate (a
  # workflow's or team's agent) isn't gone then: it waits for mail, idle.
  quiet=0
  [ -n "$told" ] && [ "${last:-0}" -le $((told + 5)) ] && quiet=1
  [ "$ended" = 1 ] && [ $((now - ${last:-now})) -gt 120 ] && quiet=1
  if [ "$done" = 0 ] && [ "$quiet" = 1 ]; then
    if grep -q '"taskKind":"in_process_teammate"' "$m" 2>/dev/null; then idle=1; else done=1; fi
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$id" "$at" "$(jq -r '[.description // "", .agentType // ""] | @tsv' "$m" 2>/dev/null)" "$model" "$start" "$tokens" "$effort" "$window" "$done" "$idle"
done > "$cache.$$"
rm -f "$marks"
# Its own file, put in place whole: two runs at once (a slow one outlasting the
# sidebar's wait) wrote over each other's, losing rows.
{ echo "$key"; cat "$cache.$$"; } > "$cache.$$.all" && mv -f "$cache.$$.all" "$cache"; rm -f "$cache.$$"
tail -n +2 "$cache"
