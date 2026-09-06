# js/

Plain modular JavaScript for the static site. No framework, no bundler, no
build step — loaded directly as ES modules from `index.html`.

Current modules (Phase 2–3):

- `data.js` — fetches `data/*.json` (including `links.json`) and builds
  lookup indices. Knows nothing about rendering or state.
- `state.js` — `createStore()`, a minimal pub-sub state container. Knows
  nothing about data loading or rendering.
- `sankey.js` — Phase 3 alluvial prototype. `buildSankeyFigure()` is a pure
  data transform from `Links`/`Boxes` to a Plotly Sankey figure (nodes
  ordered chronologically by `start_year`, `arrangement: "fixed"`);
  `renderSankey()` calls `Plotly.newPlot` and wires `plotly_click` to
  node/link selection callbacks. Loaded from `cdn.plot.ly` in `index.html`,
  not bundled.
- `app.js` — wiring: loads data, creates the store, renders the box
  list/inspector/region-filter UI and the alluvial diagram into
  `index.html`, and handles click-to-select for both boxes and links.

Planned (later phases, see `docs/IMPLEMENTATION_PLAN.md`): `timeline.js`
(Phase 4, SVG/D3 timeline); a larger `Links` subset covering the China
cluster and beyond (see `ISSUES.md` ISSUE-004).
