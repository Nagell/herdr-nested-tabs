# herdr-nested-tabs

A Herdr layout (`layouts/nested-tabs.json`) with two mods
(`mods/nested-tabs/`, `mods/tabs-bar/`), listed on herdr.dev/layouts via the
`herdr-layout` repo topic. The format is defined in
`~/.config/herdr-app/AGENTS.md`, section "Layouts and mods other people made".

## Keep RECIPE.md and preview.png in sync

`RECIPE.md` is the brief another agent rebuilds this layout from, and the
gallery shows it. It must describe only what the files really do.

Any change under `layouts/` or `mods/` that someone could see or rely on
(sizes, colors, rows, statuses, clicks, keys, commands, programs run, shipped
mods or art borrowed) must update `RECIPE.md` in the same commit:

- What you see / How it behaves: visible changes, exact values.
- Built from: new `herdr` functions, commands, overlays, art, programs.
- Watch out / Done when: new pitfalls, and a check for each new behavior.

Retake `preview.png` when the look changes. Update the README feature list and
roadmap with it.

## Retaking preview.png

Keep the format: 1400×672 PNG, the window's top-left corner at 1.8× scale.
Show the published layout with demo spaces only, never a real window
(private names, processes).

1. Install this repo's layout and mods, `layout.switch` to `nested-tabs`, and
   set `"zoom"` in `settings.json` so the window renders at 1.8×.
2. In `~/herdr-demo`, create the git repo `shop` (5 commits on main) and a
   `checkout-redesign` worktree (1 commit).
3. With `herdr-app do space.new` / `tab.new`, create: shop (api and fix login
   running `claude`, history running `git log --oneline --graph --all`),
   checkout-redesign (redesign running `claude`, dev server), docs (notes),
   monitor (btop). Move them to the top and select shop → history.
4. Run `herdr-app shot full.png`, then
   `ffmpeg -i full.png -vf crop=1400:672:0:0 preview.png`.
5. Restore the zoom and layout, and close the demo spaces.

When rebasing the mods on a newer Herdr release of `spaces`/`tabs`, bump the
`cloned_from` version in the layout and both `mod.json` files, and the
"0.1.13" mentions in `RECIPE.md` and `README.md`.
