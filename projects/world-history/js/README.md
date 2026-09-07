# js/

Plain modular JavaScript for the static site. No framework, no bundler, no
build step — loaded directly as ES modules from `index.html`.

Current modules (Phase 2–5):

- `data.js` — fetches `data/*.json` (including `links.json`) and builds
  lookup indices. Knows nothing about rendering or state.
- `state.js` — `createStore()`, a minimal pub-sub state container. Knows
  nothing about data loading or rendering.
- `sankey.js` — Phase 3 alluvial prototype. `buildSankeyFigure()` is a pure
  data transform from `Links`/`Boxes` to a Plotly Sankey figure (nodes
  ordered chronologically by `start_year`, `arrangement: "fixed"`);
  `renderSankey()` calls `Plotly.newPlot`, wires `plotly_click` to
  node/link selection callbacks, and resolves to `{ boxIds }`. Loaded from
  `cdn.plot.ly` in `index.html`, not bundled. `applySankeySelection()`
  (Phase 5) re-colors the already-rendered trace via `Plotly.restyle` to
  reflect a selection made anywhere on the page, without re-running
  `Plotly.newPlot` (which would double-register the click handler).
- `timeline.js` — Phase 4 timeline prototype. `buildTimelineLayout()` is a
  pure data transform from `Boxes`/SEAIs plus the shared filter state
  (region, year range, SEAI toggle) to a row list and SEAI marker list, one
  row per box in view, ordered chronologically; `renderTimeline()` draws it
  as an SVG with D3 (bars + diamond SEAI markers + a year axis) and wires
  bar clicks to box selection. Loaded from `cdnjs.cloudflare.com` in
  `index.html`, not bundled. Box width is still literal start/end year, not
  population-based (see `ISSUES.md` ISSUE-003), and x-position is still
  plain linear, not yet the semantic-zoom scale in `docs/timescaleRequirement.md`
  (Phase 5.5). `buildTimelineLayout()` has a committed test,
  `timeline.test.mjs` — run with `node js/timeline.test.mjs` (the project
  root's `package.json` sets `"type": "module"` so Node can load these
  files directly). `renderTimeline()` also accepts `state.linkHighlightBoxIds`
  (Phase 5) to outline a selected link's two endpoint boxes.
- `app.js` — wiring: loads data, creates the store, renders the box
  list/inspector/region-filter UI, the alluvial diagram, and the timeline
  into `index.html`; handles click-to-select for boxes and links; and
  (Phase 5) keeps every panel's selection display in sync on every store
  change — the box list's `.selected` class, the alluvial list's
  `.selected`/`aria-pressed`, the timeline's outline (including link
  endpoints), and the Sankey diagram's node/link outline via
  `applySankeySelection()`.

Planned (later phases, see `docs/IMPLEMENTATION_PLAN.md`): Phase 5.5's
semantic-zoom time scale (`docs/timescaleRequirement.md`), shared across
the timeline and Sankey x-positioning; a larger `Links` subset covering the
China cluster and beyond (see `ISSUES.md` ISSUE-004).
