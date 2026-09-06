# Project Status

## Status summary

**Phase:** data transcription complete enough for visualization prototyping; a validated build pipeline (`tools/build_data.py`) now converts the workbook into the `data/*.json` the site actually loads.

The project currently has a usable first-pass dataset derived from the ChartOrigin *Timeline of World History* poster.

`data/*.json` is generated, not authored, and must never be hand-edited — see `data/README.md`/`tools/README.md`. Re-run `python3 tools/build_data.py` after any workbook edit; it fails (writes nothing) on structural problems and warns on content-quality gaps (see `docs/DATA_MODEL.md` §8).

A first interactive prototype now exists (`index.html` + `js/`): load the generated JSON, list all `Boxes` sorted chronologically with color swatches, click one to see an inspector panel, filter by `region_group`. This satisfies "Build first interactive prototype" below; it is a sanity-check slice, not yet the Sankey/alluvial or timeline views (Phases 3–4).

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

### 5. Historical succession is not modeled yet

A Sankey/alluvial visualization needs explicit relationships.

The current tables know **what existed and when**, but not reliably **what became what**.

A proposed `Links` table should store source box, target box, transition year, relationship type, confidence, and optional weight method.

### 6. Architectural item dates may differ from the poster

Some SEAIs did not have explicit years printed on the poster.

Representative historical years were supplied for plotting and documented in notes.

These should be reviewed before treating them as authoritative.

## Recommended next data work

Priority order:

1. Add `Links`.
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
