# js/

Plain modular JavaScript for the static site. No framework, no bundler, no
build step — loaded directly as ES modules from `index.html`.

Current modules (Phase 2):

- `data.js` — fetches `data/*.json` and builds lookup indices. Knows nothing
  about rendering or state.
- `state.js` — `createStore()`, a minimal pub-sub state container. Knows
  nothing about data loading or rendering.
- `app.js` — wiring: loads data, creates the store, renders the box
  list/inspector/region-filter UI into `index.html`, and handles
  click-to-select.

Planned (later phases, see `docs/IMPLEMENTATION_PLAN.md`): `timeline.js`
(Phase 4, SVG/D3 timeline), a Sankey/alluvial module (Phase 3, likely Plotly
for the first prototype per `docs/VISUALIZATION.md`).
