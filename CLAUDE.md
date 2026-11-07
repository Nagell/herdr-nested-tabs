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

When rebasing the mods on a newer Herdr release of `spaces`/`tabs`, bump the
`cloned_from` version in the layout and both `mod.json` files, and the
"0.1.13" mentions in `RECIPE.md` and `README.md`.
