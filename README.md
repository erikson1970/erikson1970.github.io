# erikson1970.github.io

Personal site and project host for [erikson1970](https://github.com/erikson1970), served via GitHub Pages.

## Structure

```text
/
├── index.html         landing page (this repo's root)
├── css/                landing-page styles only
└── projects/
    └── world-history/  World History Explorer — see projects/world-history/README.md
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
