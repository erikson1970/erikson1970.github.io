# js/

Plain modular JavaScript for the static site. No framework, no bundler, no
build step — loaded directly as ES modules from `index.html`.

Current modules (Phase 2–4):

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
- `timeline.js` — Phase 4 timeline prototype. `buildTimelineLayout()` is a
  pure data transform from `Boxes`/SEAIs plus the shared filter state
  (region, year range, SEAI toggle) to a row list and SEAI marker list, one
  row per box in view, ordered chronologically; `renderTimeline()` draws it
  as an SVG with D3 (bars + diamond SEAI markers + a year axis) and wires
  bar clicks to box selection. Loaded from `cdnjs.cloudflare.com` in
  `index.html`, not bundled. Box width is still literal start/end year, not
  population-based (see `ISSUES.md` ISSUE-003).
- `app.js` — wiring: loads data, creates the store, renders the box
  list/inspector/region-filter UI, the alluvial diagram, and the timeline
  into `index.html`, and handles click-to-select for boxes and links.

Planned (later phases, see `docs/IMPLEMENTATION_PLAN.md`): Phase 5
synchronizes Sankey/timeline/inspector selection more fully; a larger
`Links` subset covering the China cluster and beyond (see `ISSUES.md`
ISSUE-004).
