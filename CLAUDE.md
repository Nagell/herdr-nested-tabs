# herdr-nested-tabs

- Herdr layout `layouts/nested-tabs.json` with mods `mods/nested-tabs/` and `mods/tabs-bar/`.
- Listed on herdr.dev/layouts via the `herdr-layout` repo topic.
- Format spec: `~/.config/herdr-app/AGENTS.md`, section "Layouts and mods other people made".

## Keep docs in sync

- `RECIPE.md` is the brief agents rebuild the layout from, and the gallery shows it. Describe only what the files do.
- Any change under `layouts/` or `mods/` that someone could see or rely on updates `RECIPE.md` in the same commit:
  - What you see / How it behaves: exact values.
  - Built from: new `herdr` functions, commands, overlays, art, programs.
  - Watch out / Done when: new pitfalls, and a check per new behavior.
- Update the README feature list and roadmap with it.
- Look changed → retake `preview.png` (below).

## Updating to a newer Herdr

- Our mods are copies of Herdr's built-in ones: `nested-tabs` ← `spaces`, `tabs-bar` ← `tabs`, and the layout ← `main`. The base version is in `cloned_from`. Herdr never updates copies.
- Newest release: `gh api repos/herdrdev/herdr-app/tags -q '.[0].name'`. Installed: `herdr-app --version`.
- What changed upstream (`OLD` = our base, `NEW` = newest):
  - `gh api repos/herdrdev/herdr-app/compare/vOLD...vNEW -q '.files[].filename' | grep -E 'defaults/(mods/(spaces|tabs)/|layouts/main|AGENTS.md)'`
  - Per file: `gh api "repos/herdrdev/herdr-app/compare/vOLD...vNEW" -q '.files[] | select(.filename=="defaults/mods/spaces/main.js") | .patch'`
- Apply those upstream changes to our copies and keep our own changes (tab rows, folding, `+`, hover, agent details and sub-agents; in `tabs-bar` no `+`, tab chips only behind the off-by-default `chips` prop, and the Timeline button). Asset paths stay `mods/tabs-bar/...`.
- `mods/nested-tabs/claude-info.py` and `subagents.sh` are Over9k's (MIT, `LICENSE-over9k`); take newer versions from herunan/herdr-over9k and keep our two fixes unless upstream has them: `claude-info.py` reads requests whose `querySource` starts with `repl_main_thread` (an output style appends to it); `subagents.sh` tags each signal stop (`s`) or message (`m`, including `senderTaskId`), and a sub-agent quiet after a message or a turn ended (the `ended` field) is done, or idle (an 11th output field) when its meta says `in_process_teammate`.
- Layout: our copy should equal the new `main.json` except `spaces` → `nested-tabs` and `tabs` → `tabs-bar`.
- `defaults/AGENTS.md` changed → check for renamed or removed `herdr` APIs and commands.
- Remove workarounds for bugs fixed upstream (search the code for "until", "patch", issue numbers).
- `herdr-app check` both mods, then try it in Herdr against "Done when" in `RECIPE.md`.
- Bump `cloned_from` in the layout and both `mod.json` files, and the version in `RECIPE.md` and `README.md`. Update the recipe where behavior changed.

## Retaking preview.png

- Format: 1400×672 PNG, the window's top-left corner at 1.8× scale.
- Demo spaces only, never a real window (private names, processes).
- Install this repo's layout and mods, switch to `nested-tabs`, and set `"zoom"` in `settings.json` so the window renders at 1.8×.
- `~/herdr-demo`: git repo `shop` (5 commits on main) and a `checkout-redesign` worktree (1 commit).
- Spaces (`herdr-app do space.new` / `tab.new`), moved to the top:
  - shop: api and fix login running `claude`, history running `git log --oneline --graph --all`, selected.
  - checkout-redesign: redesign running `claude`, dev server.
  - docs: notes. monitor: btop.
- `herdr-app shot full.png`, then `ffmpeg -i full.png -vf crop=1400:672:0:0 preview.png`.
- Afterwards: restore the zoom and layout, close the demo spaces.
