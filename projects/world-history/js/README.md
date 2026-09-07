# js/

Plain modular JavaScript for the static site. No framework, no bundler, no
build step — loaded directly as ES modules from `index.html`.

Current modules (Phase 2–5.5):

- `data.js` — fetches `data/*.json` (including `links.json`) and builds
  lookup indices. Knows nothing about rendering or state.
- `state.js` — `createStore()`, a minimal pub-sub state container. Knows
  nothing about data loading or rendering.
- `timescale.js` — Phase 5.5 semantic-zoom time scale
  (`docs/timescaleRequirement.md`). `semanticTimeScale({tMin, tMax, scaler})`
  returns pure `yearToX`/`xToYear`/`exponent` functions for the nonlinear
  mapping `x = 1 - (a/M)^p` — no D3/DOM/Plotly dependency, so it's the one
  scale every time-based element on the page (timeline bars/SEAIs/ticks,
  Sankey node x-position) is required to share rather than each computing
  its own linear normalization. `timeTicks(tMin, tMax)` picks candidate tick
  years in calendar time first, for the caller to run through that same
  scale. Has a committed test, `timescale.test.mjs` — run with `node
  js/timescale.test.mjs`.
- `sankey.js` — Phase 3 alluvial prototype. `buildSankeyFigure()` is a pure
  data transform from `Links`/`Boxes` to a Plotly Sankey figure (nodes
  ordered chronologically, `arrangement: "fixed"`); `renderSankey()` calls
  `Plotly.newPlot`, wires `plotly_click` to node/link selection callbacks,
  and resolves to `{ boxIds }`. Loaded from `cdn.plot.ly` in `index.html`,
  not bundled. `applySankeySelection()` (Phase 5) re-colors the
  already-rendered trace via `Plotly.restyle` to reflect a selection made
  anywhere on the page, without re-running `Plotly.newPlot` (which would
  double-register the click handler); the actual selection→style
  computation is split out into `computeSankeyHighlight()`, a pure function
  with no Plotly/DOM dependency. Node x-position (Phase 5.5) comes from
  `computeSankeyNodeX()` — the shared `timescale.js` scale over the app's
  `state.yearStart`/`yearEnd`/`timeScale`, not a per-subset min/max — and
  `applySankeyTimeScale()` re-applies it via `Plotly.restyle` (kept separate
  from `applySankeySelection()`, one extra restyle call rather than merging
  position into the selection-highlight path) whenever that state changes.
  `buildSankeyFigure()`, `computeSankeyHighlight()`, and
  `computeSankeyNodeX()` all have a committed test, `sankey.test.mjs` — run
  with `node js/sankey.test.mjs`.
- `timeline.js` — Phase 4 timeline prototype. `buildTimelineLayout()` is a
  pure data transform from `Boxes`/SEAIs plus the shared filter state
  (region, year range, SEAI toggle, time-scale slider) to a row list, SEAI
  marker list, and axis tick list, one row per box in view, ordered
  chronologically, with every x-position computed via the shared
  `timescale.js` scale (Phase 5.5); `renderTimeline()` draws it as an SVG
  with D3 (bars + diamond SEAI markers + a hand-built BCE/CE year axis) and
  wires bar clicks to box selection. Loaded from `cdnjs.cloudflare.com` in
  `index.html`, not bundled. Box width is still literal start/end year, not
  population-based (see `ISSUES.md` ISSUE-003). `buildTimelineLayout()` has
  a committed test, `timeline.test.mjs` — run with `node
  js/timeline.test.mjs` (the project root's `package.json` sets `"type":
  "module"` so Node can load these files directly). `renderTimeline()` also
  accepts `state.linkHighlightBoxIds` (Phase 5) to outline a selected link's
  two endpoint boxes.
- `app.js` — wiring: loads data, creates the store, renders the box
  list/inspector/region-filter UI, the alluvial diagram, and the timeline
  into `index.html`; handles click-to-select for boxes and links; wires the
  year-range inputs and the Phase 5.5 time-scale slider (`input` event, so
  it updates continuously while dragging) into the shared store; and
  (Phase 5) keeps every panel's selection display in sync on every store
  change — the box list's `.selected` class, the alluvial list's
  `.selected`/`aria-pressed`, the timeline's outline (including link
  endpoints), and the Sankey diagram's node/link outline via
  `applySankeySelection()` plus (Phase 5.5) node position via
  `applySankeyTimeScale()`.

Planned (later phases, see `docs/IMPLEMENTATION_PLAN.md`): a larger `Links`
subset covering the China cluster and beyond (see `ISSUES.md` ISSUE-004);
population-based box/ribbon width (Phase 6, ISSUE-003).
