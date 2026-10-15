# erikson1970.github.io

Personal site and project host for [erikson1970](https://github.com/erikson1970), served via GitHub Pages.

## Structure

```text
/
├── index.html         landing page (this repo's root)
├── css/                landing-page styles only
└── projects/
    ├── world-history/  World History Explorer — see projects/world-history/README.md
    ├── representing-3d-shapes/  Epicycles vs wires vs mesh — see projects/representing-3d-shapes/README.md
    ├── plant_models/   Interactive thermal plant models — see projects/plant_models/README.md
    └── HVAC-stuff/     Home heating & cooling analyses — see projects/HVAC-stuff/README.md
```

The root is a small, static landing page — no framework, no backend, no
build step. Each project lives in its own `projects/<name>/` directory as a
self-contained static site, reachable at
`erikson1970.github.io/projects/<name>/`, and is free to have its own
`css/`, `js/`, `data/`, `docs/`, etc.

`ISSUES.md` and `TRACEABILITY.md` at the root track defects/deferred work
and requirement closure across the whole repo — one continuous history, not
split per project. See `AGENTS.md` for the full development workflow
(branching, milestone council reviews, issue/traceability tracking).

## Projects

- **[World History Explorer](projects/world-history/)** — an interactive,
  static visualization of world history built from the ChartOrigin
  *Timeline of World History* poster. See
  `projects/world-history/README.md` for details.
- **[Representing 3D shapes: Epicycles vs wires vs mesh](projects/representing-3d-shapes/)** —
  five aircraft described as 3D Fourier wireframes, compressed meshes and
  OpenSCAD scripts, compared at the same accuracy. See
  `projects/representing-3d-shapes/README.md` for details.
- **[Plant models](projects/plant_models/)** — interactive, browser-only
  thermal plant models, from a counterflow heat exchanger and a storage-tank
  loop to a pressurized-water reactor plant with its steam and electric
  plants, and an RBMK-1000 model of the 1986 Chernobyl excursion. Each
  model is a sub-page. See `projects/plant_models/README.md`.
- **[HVAC stuff](projects/HVAC-stuff/)** — home heating and cooling
  analyses, starting with a ground-source heat pump model for a
  Wellesley, MA home with a 20-year cost comparison. See
  `projects/HVAC-stuff/README.md`.
