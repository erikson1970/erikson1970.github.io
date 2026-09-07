# Project Status

## Status summary

**Phase:** data transcription complete enough for visualization prototyping; a validated build pipeline (`tools/build_data.py`) now converts the workbook into the `data/*.json` the site actually loads. A minimal `Links` table now exists for a small Mediterranean/Europe subset, and a first Sankey/alluvial prototype renders it (Phase 3). A first D3 timeline view (Phase 4) now sits above it, and selection is now synchronized across every panel (Phase 5). A semantic-zoom time scale is a captured requirement (`docs/timescaleRequirement.md`, Phase 5.5) not yet implemented.

The project currently has a usable first-pass dataset derived from the ChartOrigin *Timeline of World History* poster.

`data/*.json` is generated, not authored, and must never be hand-edited — see `data/README.md`/`tools/README.md`. Re-run `python3 tools/build_data.py` after any workbook edit; it fails (writes nothing) on structural problems and warns on content-quality gaps (see `docs/DATA_MODEL.md` §8).

A first interactive prototype now exists (`index.html` + `js/`): load the generated JSON, list all `Boxes` sorted chronologically with color swatches, click one to see an inspector panel, filter by `region_group`. This satisfies "Build first interactive prototype" below; a first Phase 4 timeline view now exists too (see below), though it still lacks population-based width and the poster's own lane geometry.

A Phase 3 alluvial prototype (`js/sankey.js`, Plotly loaded from CDN) sits above the box list: a small hand-authored 7-row `Links` subset (Roman → Western Roman/Byzantine, Frankish → West/East Francia, West Francia → Kingdom of France, East Francia → Holy Roman Empire, Byzantine → Ottoman) renders as a Sankey diagram with nodes ordered chronologically by `start_year` (`arrangement: "fixed"`, no auto-layout reordering). Clicking a node or link updates the same inspector panel as the box list. Ribbon width is currently equal-weighted, not population-based (see ISSUE-003).

A Phase 4 timeline prototype (`js/timeline.js`, D3 loaded from CDN) sits above the alluvial diagram: one horizontal bar per box currently in view (region + year-range filtered), ordered chronologically, colored by `color_hex`, with diamond markers overlaying SEAIs. "From year"/"To year" number inputs drive the year-range filter (`state.yearStart`/`yearEnd`); a checkbox toggles the SEAI overlay (`state.showSeais`). Clicking a bar selects the same shared `selectedBoxId` as the box list, which remains the sole keyboard-accessible way to make that selection — the timeline SVG itself has no independent hidden fallback list, since (unlike the Sankey links) every box it draws is already reachable through the box list. The six boxes with no legible start date on the source poster (ISSUE-005) are drawn with a dashed left edge running to the current view's left boundary, not a fabricated date. Bar width is still literal poster start/end year, not population-based (`state.widthMode` exists in `js/state.js` but has no UI control yet — deferred, since `Population` is still 0% filled, ISSUE-003).

Phase 5 synchronizes selection across every panel: the box list, alluvial list, Sankey diagram, and timeline all stay consistent no matter where a box or link is selected. The Sankey diagram and timeline don't have a `selectedLinkId`/`selectedBoxId` field of their own — a selected box gets an outline (Sankey node border, timeline bar stroke), and a selected link's two endpoint boxes get an outline (Sankey `link.color`, timeline `.link-endpoint`), all applied via `js/app.js` re-deriving the highlight on every store change, not by the Sankey/timeline modules knowing about each other. A semantic-zoom time scale for the timeline's x-axis (`docs/timescaleRequirement.md`, Phase 5.5) is a captured requirement, not yet implemented — the timeline (and Sankey) x-position is still plain linear.

Canonical poster/source page:

- https://chartorigin.com/product/timeline-of-world-history/

## Completed

### Historical boxes

The poster has been transcribed into a `Boxes` table.

Current count: **198 boxes**

Current fields include:

- `box_id`
- `box_name`
- `url`
- `start_year`
- `end_year`
- `start_label`
- `end_label`
- `color_name`
- `color_hex`
- `span`
- `span_count`
- `span_start`
- `span_end`
- `region_group`
- `notes`
- `confidence`

### SEAIs

Significant events / architectural items are stored separately.

Current count: **83 SEAIs**

- 30 numbered civilization milestones;
- 53 labeled historical landmarks / architectural items.

### Wikipedia URL placeholders

Both `Boxes` and `SEAIs` include a URL field.

The intentionally bogus/TODO placeholder is:

```text
https://en.wikipedia.org/wiki/Time_management#Implementation_of_goals
```

Do not interpret that URL as meaningful data.

### Population scaffold

A separate `Population` table exists.

Current count: **390 seeded rows**

Rows were seeded at known box start/end boundaries.

Population values were deliberately **not invented**.

The table is designed to hold historical knot points with estimate, low/high range, basis, method, source, confidence, and status.

### Added missing regional groupings

A `Regions` table currently includes five intermediate regional groupings not covered well by the source poster:

1. Northern Europe / Scandinavia
2. Eastern Europe / Slavic world
3. Southeast Asia
4. Arabia and the Levant
5. Sub-Saharan Africa

These currently function as modern-country grouping metadata, not yet as full historical timelines.

Current region-country rows: **89**

## Important known limitations

### 1. The original poster is selective

It is not a complete world history.

Major omissions include, among others:

- Scandinavia / Nordics;
- Eastern Europe / Slavic histories;
- Korea;
- Southeast Asia;
- Arabia and the Levant;
- Central Asia;
- most of Sub-Saharan Africa;
- much of North Africa west of Egypt;
- Brazil;
- Andes;
- Central America / Caribbean;
- Oceania beyond Australia;
- Low Countries;
- Switzerland.

The five requested regions above are the first extension step.

### 2. Some dates are approximate

The poster itself contains approximate dates, very thin transition boxes, step-shaped multi-country boxes, and some labels that are difficult to read at image resolution.

The dataset preserves uncertainty in `notes` and `confidence`.

### 3. `span` is not a proper geometry model yet

Current `span` is a semicolon-delimited list of modern countries.

That is useful for filtering, but insufficient for historical geography.

A large entity such as the Roman Empire or Ottoman Empire occupies different modern-country lanes over different time intervals.

A proposed `BoxSegments` table should normalize this.

### 4. Population is not filled

The `Population` table is a scaffold only.

The next population work should prioritize historically significant entities and major breakpoints rather than attempting annual estimates.

### 5. Historical succession is modeled only for a small subset

A `Links` table now exists (`docs/DATA_MODEL.md` §5: source box, target box, transition year, relationship type, confidence, source URL, notes), but it covers only 7 hand-authored rows in the Mediterranean/Europe cluster — the China cluster and the rest of the dataset still have no succession data. Most of the tables still know **what existed and when**, but not **what became what**.

### 6. Architectural item dates may differ from the poster

Some SEAIs did not have explicit years printed on the poster.

Representative historical years were supplied for plotting and documented in notes.

These should be reviewed before treating them as authoritative.

## Recommended next data work

Priority order:

1. ~~Add `Links`.~~ Done for a small Mediterranean/Europe subset — see Milestone 4 (Phase 3 alluvial prototype) above. The China cluster from `docs/IMPLEMENTATION_PLAN.md` Phase 3 and the rest of the dataset remain unlinked.
2. Add `BoxSegments`.
3. Populate a small, representative subset of `Population`.
4. Add real Wikipedia URLs gradually.
5. ~~Build first interactive prototype.~~ Done — see Milestone 2 above.
6. Let visualization needs drive further data refinement.

## Recommended first population subset

Do not fill everything at once.

Start with:

- Roman Empire;
- Byzantine Empire;
- Western Roman Empire;
- Persian Empire;
- Ottoman Empire;
- major Chinese dynasties;
- Maurya / Gupta / Mughal;
- major Egyptian periods;
- Frankish / French sequence;
- Holy Roman Empire / German sequence.

This is enough to test equal-width vs. population vs. logarithmic-width rendering.

## Source discipline

Treat the source poster as authoritative for box labels, poster colors, visual alignment, poster dates, and which SEAIs appear.

External research should be clearly distinguished when used for population, exact historical dates, territorial interpretation, succession links, Wikipedia URLs, or expansion beyond the original poster.
