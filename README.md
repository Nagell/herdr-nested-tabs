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
  double-click anywhere else on the space's row.
- A tab row looks like a tab in the top bar: program icon, name, a spinner while
  an agent works, a dot when it is blocked or done, and × on the selected tab.
- Click selects (in any space), double-click renames, right-click opens the tab
  menu, drag reorders within the space.
- A folded space shows its most urgent agent status on its own row.
- Worktree spaces stay nested under their repo's space, as in Herdr, and list
  their own tabs under them.
- The top bar keeps `+`, Files, Changes and the per-space panel memory, only the
  tab chips are gone.

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
- [x] Top bar without tab chips
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
