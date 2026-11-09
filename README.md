<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Apache-2.0][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT HEADER -->
<br />
<div align="center">
  <h3 align="center">Herdr Nested Tabs</h3>

  <p align="center">
    Herdr layout with every space's tabs listed in the sidebar
    <br />
    <br />
    <a href="https://github.com/Nagell/herdr-nested-tabs/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/Nagell/herdr-nested-tabs/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

![Sidebar with tabs under each space][product-screenshot]

Herdr shows the tabs of the selected space only, in a bar above the terminals.
With a handful of spaces and a few agents in each, I kept switching spaces just
to see what was running where, so this layout moves the tabs into the Spaces
sidebar, under the space they belong to.

- Each space lists its tabs. The triangle folds or unfolds them, and so does a
  double-click anywhere else on the space's row. With one tab the triangle is
  dimmed.
- The active space's row has a `+`, drawn like the tab's ×, that opens the
  new-tab menu for it. Hovering any space or tab row shows its `+` or ×.
- Statuses line up in one column at the sidebar's left edge, whatever the
  depth: a spinner while an agent works, a dot when it is blocked or done. A
  folded space or tab shows the most urgent of what it hides: blocked, then
  working, then done.
- A tab row shows the program icon, its name, and × on the selected tab.
- Click selects (in any space), double-click renames, right-click opens the tab
  menu, middle click closes, drag reorders within the space. A tab with no
  terminal (a file opened from Files or Changes) shows a file icon.
- Worktree spaces stay nested under their repo's space, as in Herdr, and list
  their own tabs under them.
- Claude Code and Codex agents show their details after the name: model,
  effort, context used and how long since they last replied, e.g.
  `Opus 5.5 · H · 19% · 4m` or `GPT-5.6 Terra · max · 21% · 7d`.
  When the sidebar is narrow the effort shortens to its capitals, then the model
  goes, then the name is cut; the context and the time always stay.
- A tab with several terminals starts folded: it keeps its own name and shows
  its agent's details if it has one agent, or overlapping icons and "2 agents"
  if it has more. Its arrow lists the terminals under it, their icons under
  the tab's.
- Sub-agents are counted in a chip after the agent, running then idle
  (`3 · 11`; idle: a workflow teammate waiting for messages). A click lists
  them under a bracket line from the agent's icon, running ones with a spinner
  and idle ones dimmed with a hollow circle; it stays closed until you open it.
- **Compact** (details on the name's line) or **Detailed** (details under the
  name): the switch in the Spaces header, or a key bound to `nested-tabs.details`
  (`keys.json` suggests `cmd-shift-i`).
- The top bar keeps Files, Changes and the per-space panel memory; the tab
  chips and its `+` are gone. With `"props": {"chips": true}` on the layout's
  `tabs` block the chips come back, for tabs in both places.
- With Over9k's Timeline (`over9k-prompts`) in the side panel as a block with
  id `prompts`, the top bar gets a **Timeline** button.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![Herdr][Herdr]][Herdr-url]
- [![JavaScript][JavaScript]][JavaScript-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

- [Herdr app](https://herdr.dev) (built against its shipped `spaces` and `tabs` mods, version 0.1.13)

### Installation

1. Clone the repository

   ```sh
   git clone https://github.com/Nagell/herdr-nested-tabs.git
   ```

2. Copy the mods and the layout into Herdr's folder

   ```sh
   cp -R herdr-nested-tabs/mods/nested-tabs herdr-nested-tabs/mods/tabs-bar ~/.config/herdr-app/mods/
   cp herdr-nested-tabs/layouts/nested-tabs.json ~/.config/herdr-app/layouts/
   ```

   Optional: merge `keys.json` into `~/.config/herdr-app/keys.json` for the
   Compact/Detailed key.

3. Check both mods

   ```sh
   herdr-app check ~/.config/herdr-app/mods/nested-tabs
   herdr-app check ~/.config/herdr-app/mods/tabs-bar
   ```

4. Switch to the layout

   ```sh
   herdr-app do layout.switch '{"name":"nested-tabs"}'
   ```

`ctrl-shift-l` switches back to your previous layout. Herdr never overwrites
these files, they are clones and not its shipped mods.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [x] List tabs under each space
- [x] Fold and unfold a space's tabs (triangle or double-click)
- [x] Tab status (working, blocked, done) in the sidebar
- [x] Top bar without tab chips (chips as an option)
- [x] Agent details and sub-agents in the sidebar, compact or detailed
- [x] Timeline button when the panel holds Over9k's Timeline
- [x] Retake `preview.png` with the agent details
- [ ] Merge the changes from newer Herdr releases of `spaces` and `tabs`
- [x] `RECIPE.md` and the `herdr-layout` topic for [herdr.dev/layouts](https://herdr.dev/layouts)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the Apache License 2.0. See `LICENSE` for more information.

`mods/nested-tabs` and `mods/tabs-bar` are modified copies of the `spaces` and
`tabs` mods shipped with [Herdr](https://github.com/herdrdev/herdr-app)
(Apache-2.0). `nested-tabs` adds the tab rows, folding and folded status;
`tabs-bar` removes the tab chips.

`mods/nested-tabs/claude-info.py` and `mods/nested-tabs/subagents.sh` come
from [Over9k](https://github.com/herunan/herdr-over9k) (MIT, see
`mods/nested-tabs/LICENSE-over9k`), with two changes: the effort of agents
using an output style, and teammates (workflow and team agents) counted as
idle once their turn is over. `mods/nested-tabs/codex-info.py` is this
repository's own.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Dawid Nitka - [Linkedin][linkedin-url]

Project Link: [https://github.com/Nagell/herdr-nested-tabs](https://github.com/Nagell/herdr-nested-tabs)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

- [Herdr](https://herdr.dev)
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[license-shield]: https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge
[license-url]: ./LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/dawidnitka
[product-screenshot]: preview.png
[Herdr]: https://img.shields.io/badge/Herdr-1c1d21?style=for-the-badge
[Herdr-url]: https://herdr.dev
[JavaScript]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://developer.mozilla.org/docs/Web/JavaScript
