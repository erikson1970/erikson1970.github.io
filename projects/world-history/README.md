# World History Explorer

## Purpose

This project turns the ChartOrigin **Timeline of World History** poster into a richer, interactive, static web visualization that can be hosted on GitHub Pages.

Canonical visual source:

- https://chartorigin.com/product/timeline-of-world-history/

Lives at `projects/world-history/` within:

- https://github.com/erikson1970/erikson1970.github.io

served at `erikson1970.github.io/projects/world-history/`. (Historical note:
this project originally occupied the whole repository; see the root
`README.md`/`AGENTS.md` for the Milestone 3 restructure that moved it here
alongside a personal landing page and room for future projects.)

## Core idea

The original poster presents historical polities/civilizations as colored boxes arranged vertically through time and horizontally by modern-country alignment.

The project should preserve that basic model, but make it interactive and extensible:

- zoom and pan through time;
- filter by region/country;
- click a historical box to inspect details;
- show significant events / architecture items (SEAIs);
- vary visual width using population, `log10(population)`, or other transforms;
- experiment with Sankey/alluvial-style succession flows;
- eventually support additional regions missing from the original poster.

The project should remain **fully static in production**. No server-side application or database is required.

## Data authority

The Excel workbook is intended to remain the human-editable source of truth.

Current logical tables:

1. `Boxes`
2. `SEAIs`
3. `Population`
4. `Regions`

Proposed next tables:

5. `Links`
6. `BoxSegments`

The browser should consume generated JSON, not parse Excel directly.

Recommended pipeline:

```text
Excel workbook
    ↓
Python validation/build script
    ↓
JSON files
    ↓
Static HTML/CSS/JavaScript
    ↓
GitHub Pages
```

## Recommended site structure

```text
/
├── index.html
├── css/
│   └── history.css
├── js/
│   ├── app.js
│   ├── timeline.js
│   ├── sankey.js
│   └── data.js
├── data/
│   ├── boxes.json
│   ├── seais.json
│   ├── population.json
│   ├── regions.json
│   ├── links.json
│   └── box-segments.json
├── source/
│   └── *.xlsx
├── tools/
│   ├── build_data.py
│   └── validate_data.py
└── docs/
    ├── STATUS.md
    ├── DATA_MODEL.md
    ├── VISUALIZATION.md
    └── IMPLEMENTATION_PLAN.md
```

A simpler initial implementation is fine. The important architectural choice is that the site remains static and the generated data remains separate from rendering code.

## Technology direction

### Prototype

Use Plotly first for a quick interactive Sankey/alluvial experiment.

Why:

- fast iteration;
- good hover behavior;
- easy static HTML export;
- Python preprocessing is convenient;
- useful for learning what the data wants to do.

### Likely final renderer

Use D3 for the primary visualization if Plotly becomes restrictive.

D3 is likely better for:

- exact historical placement along the time axis;
- custom time-varying widths;
- linked interactions across multiple views;
- custom SEAIs and annotations;
- unusual alluvial / timeline hybrid geometry.

Apache ECharts is also a reasonable intermediate option and may be preferable to Plotly for dashboard-like interaction.

## Initial user experience

A useful first public page would have three synchronized areas:

1. **Main flow view** — Sankey/alluvial representation of historical succession.
2. **Timeline view** — original-poster-inspired chronological boxes.
3. **Inspector panel** — selected box details, dates, population, uncertainty, SEAIs, region, Wikipedia link.

Suggested controls:

- region filter;
- date range;
- width basis: equal / population / `log10(population)` / square root population;
- show/hide SEAIs;
- show/hide uncertainty;
- show/hide modern-country labels.

## Important modeling principle

A Sankey diagram implies flow, but historical population is not literally conserved from one polity to another.

The intended meaning should be explicit:

> Ribbon width represents the estimated scale of the historical entity at that point in time, not a literal transfer of people.

The preferred terminology is therefore **alluvial history view** or **civilizational flow view**, even if implemented using a Sankey library.

## Current project status

The initial source chart has been transcribed into spreadsheet form.

Current known counts:

- 198 historical boxes;
- 83 SEAIs;
  - 30 numbered “Milestones of Civilization”;
  - 53 labeled landmark / architectural items;
- 390 seeded population boundary rows;
- 89 country rows across five added regional groupings.

See `docs/STATUS.md` for details and known limitations.

## Guiding principle

The goal is not to create a definitive universal history ontology on the first pass.

Start with a clean, inspectable, extensible model that supports visualization experiments. Add historical precision incrementally, with sources and uncertainty preserved rather than hidden.
