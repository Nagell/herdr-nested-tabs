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
- After rebasing onto a newer Herdr `spaces`/`tabs`: bump `cloned_from` in the layout and both `mod.json` files, and "0.1.13" in `RECIPE.md` and `README.md`.

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
