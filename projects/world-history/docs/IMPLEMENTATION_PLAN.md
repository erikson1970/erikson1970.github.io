# Implementation Plan

## Objective

Build a graphically rich, interactive, static world-history explorer and deploy it through GitHub Pages.

No production server is required.

The existing contents of `erikson1970.github.io` may be replaced.

# Phase 0 — Repository reset

- inspect current repository;
- preserve anything worth keeping only if desired;
- replace test content with a clean project structure;
- add a source-data directory for spreadsheets;
- add project documentation.

Suggested tree:

```text
/
├── index.html
├── css/
├── js/
├── data/
├── source/
├── tools/
└── docs/
```

# Phase 1 — Data build pipeline

## Goal

Convert Excel workbook tables to validated JSON.

Suggested tool: Python.

Recommended libraries:

- `openpyxl` or `pandas`;
- built-in `json`;
- optional `pydantic`.

Suggested script:

```text
tools/build_data.py
```

Inputs:

```text
source/*.xlsx
```

Outputs:

```text
data/boxes.json
data/seais.json
data/population.json
data/regions.json
```

Later:

```text
data/links.json
data/box-segments.json
```

Fail the build on duplicate IDs, broken foreign keys, malformed years, invalid numeric population, inconsistent low/high bounds, and invalid relation types.

Warn on TODO Wikipedia URLs, missing population, low-confidence records, and suspicious dates.

# Phase 2 — Minimal static application

Suggested shared state:

```javascript
{
  selectedBoxId: null,
  selectedSeaiId: null,
  regionFilter: "all",
  countryFilter: "all",
  yearStart: -3000,
  yearEnd: 2026,
  widthMode: "equal",
  showSeais: true
}
```

Separate data loading, state management, and rendering.

# Phase 3 — Plotly alluvial prototype

Use a small subset first.

Good candidates:

### Mediterranean / Europe

- Roman Empire;
- Western Roman Empire;
- Byzantine Empire;
- Frankish Kingdom;
- West Francia;
- Kingdom of France;
- East Francia;
- Holy Roman Empire;
- Ottoman Empire.

### China

- Zhou;
- Qin;
- Han;
- Age of Division;
- Sui;
- Tang;
- Five Dynasties;
- Song;
- Yuan;
- Ming;
- Qing.

Create a minimal `Links` table for the chosen subset.

Acceptance criteria:

- nodes ordered chronologically;
- links clickable;
- selected node updates inspector;
- page remains static.

# Phase 4 — Timeline view

Render source-poster-inspired boxes from `Boxes`.

Likely renderer: SVG + D3.

Initial version may use current `span` approximately and defer exact `BoxSegments`.

Acceptance criteria:

- boxes appear at correct dates;
- colors match source data;
- click selection works;
- date zoom/filter works;
- SEAIs can be overlaid.

# Phase 5 — Shared interaction

Synchronize Sankey, timeline, and inspector.

Selecting one entity anywhere should update every panel.

Possible future deep link:

```text
?box=BYZANTINE&year=537
```

# Phase 5.5 — Semantic zoom time scale

Full spec: `docs/timescaleRequirement.md` (added 2026-09-07).

Replace the timeline's plain linear year→x mapping with a nonlinear
"semantic zoom" scale that gives recent history progressively more
horizontal room as the visible span widens, and relaxes toward linear as
the view narrows:

```text
p = 1 / (1 + (M / 3000) * 2^s)
x = 1 - (a / M)^p
```

where `M` is the visible year span, `a` is an event's age relative to the
right edge of the viewport, and `s` is a user-adjustable scale parameter.

Implement as a reusable module (`semanticTimeScale({ tMin, tMax, scaler })`
returning `yearToX`/`xToYear`/`exponent`), not baked into `timeline.js`
directly — every time-based visual element in a view (box start/end,
SEAIs, event markers, succession transitions, Sankey/alluvial node
placement, population knot points, tick locations) must share the same
transform; no mixing linear and semantic placement within one view.

User control: a single slider, range `[-2, 2]`, default `0` ("Ancient
detail ↔ Recent detail"); the raw exponent stays internal, not exposed in
the UI.

Should land before Phase 6 (population knot points must sit on the same
scale) and revisits Phase 3's Sankey x-positioning and Phase 4's timeline
x-positioning, both currently linear.

Acceptance criteria (see `docs/timescaleRequirement.md` for full
derivations):

- `yearToX(tMin) == 0`, `yearToX(tMax) == 1`;
- monotonic for any `t1 < t2`, any valid `M`/`s`;
- round-trips (`xToYear(yearToX(t)) ≈ t`);
- depends only on `[tMin, tMax, s]` — never on SEAI/box/population
  filtering or density;
- ticks generated in calendar time, then transformed (not evenly spaced
  screen ticks reverse-mapped);
- updates interactively (slider drag, zoom) without a full page reload.

# Phase 6 — Population experiment

Populate only enough data to test width encodings.

Target roughly 10–20 important boxes with a few knot points each.

Support:

- equal;
- raw population;
- `log10(population)`;
- square root.

Questions:

- Is raw population usable?
- Does `log10` compress too much?
- Is square root a better compromise?
- Is a minimum visual width needed?

# Phase 7 — BoxSegments

Normalize complex multi-country boxes.

Start with:

- Roman Empire;
- Persian Empire;
- Byzantine Empire;
- Arab Caliphate;
- Ottoman Empire;
- First French Empire.

# Phase 8 — Expand omitted regions

Current intermediate groups:

- Northern Europe / Scandinavia;
- Eastern Europe / Slavic world;
- Southeast Asia;
- Arabia and the Levant;
- Sub-Saharan Africa.

Recommended development order:

1. Northern Europe / Scandinavia
2. Eastern Europe / Slavic world
3. Arabia and Levant
4. Southeast Asia
5. Sub-Saharan Africa

This is only a development sequence, not a statement of historical importance.

# Phase 9 — Static deployment

Production should require only:

```text
HTML
CSS
JavaScript
JSON
```

No Python executes in production.

Python is build/preprocessing only.

# Development principles

1. Build visualization before perfecting the ontology.
2. Stable IDs matter.
3. Preserve uncertainty.
4. Separate source data from generated data.
5. Keep browser stateless initially.
6. Prefer inspectable code over framework complexity.

# Suggested first coding session

1. Reset repo into clean project structure.
2. Copy spreadsheet(s) into `source/`.
3. Implement `build_data.py`.
4. Generate JSON.
5. Render a simple list/count sanity-check page.
6. Add a small hand-authored `links.json`.
7. Render first Plotly Sankey.
8. Add click-to-inspector behavior.
9. Commit.

At that point the project will have crossed the important boundary from “dataset” to “interactive application.”
