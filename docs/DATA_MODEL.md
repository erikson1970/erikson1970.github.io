# Data Model

## Design goals

The model should support poster-style chronology, filtering by modern-country alignment, alluvial/Sankey succession, population-dependent widths, SEAIs, uncertainty, and future geographic refinement.

The Excel workbook remains the editable source of truth.

# 1. Boxes

A **Box** represents one labeled historical entity or era from the source poster.

Examples:

- Roman Empire
- Byzantine Empire
- Han Dynasty
- Kingdom of France
- Colonial America

Primary key: `box_id`

Important fields:

| Field | Meaning |
|---|---|
| `box_id` | Stable machine-readable identifier |
| `box_name` | Display name |
| `url` | Wikipedia URL or TODO placeholder |
| `start_year` | Numeric plotting year; BCE negative |
| `end_year` | Numeric plotting year |
| `start_label` | Human-readable source-style label |
| `end_label` | Human-readable source-style label |
| `color_name` | Palette category |
| `color_hex` | Poster color |
| `span` | Semicolon-delimited modern-country alignment |
| `region_group` | Broad grouping |
| `notes` | Exceptions / interpretation |
| `confidence` | Confidence in transcription |

## Year convention

BCE years are negative:

```text
500 BCE -> -500
27 BCE  -> -27
```

CE years are positive.

There is no attempt to model a historical year zero.

`Present` is currently represented numerically as 2026 while retaining `Present` in the label field.

# 2. SEAIs

SEAI means **Significant Event / Architectural Item**.

SEAIs are intentionally separate from boxes.

Current categories:

- `Milestone of Civilization`
- `Historical Landmark`

Primary key: `seai_id`

Foreign key:

```text
box_id -> Boxes.box_id
```

Important fields include name, URL, category, plotting year, parent box, icon metadata, historical year, notes, and confidence.

# 3. Population

Population is a **time series**, not a scalar property of a box.

Primary key: `population_id`

Foreign keys:

```text
box_id     -> Boxes.box_id
segment_id -> BoxSegments.segment_id   (optional / future)
```

Current proposed fields:

| Field | Meaning |
|---|---|
| `population_id` | Unique row identifier |
| `box_id` | Historical entity |
| `box_name` | Convenience display field |
| `segment_id` | Optional geographic segment |
| `year` | Knot-point year |
| `year_label` | Display label |
| `sample_type` | Boundary, census, event, breakpoint |
| `population` | Best estimate |
| `log10_population` | Derived value |
| `population_low` | Lower estimate |
| `population_high` | Upper estimate |
| `population_basis` | What population means |
| `estimate_method` | How estimate was produced |
| `source_url` | Direct source |
| `source_citation` | Citation text |
| `confidence` | High / Medium / Low / Unknown |
| `status` | TODO / Estimated / Verified |
| `notes` | Caveats |

Recommended `population_basis` values:

- `polity_total`
- `territorial_segment`
- `modern_country_total`
- `other`

If the Roman Empire has an estimate of 60M, that should generally be one `polity_total` estimate, not 60M duplicated into every modern-country lane.

Prefer sparse, meaningful knot points rather than annual rows.

Good knots include:

- box start;
- box end;
- census;
- plague;
- conquest;
- territorial split;
- demographic collapse;
- expansion;
- benchmark year.

Interpolation can occur at build/render time.

# 4. Regions

`Regions` is currently a modern-country grouping table for omitted areas.

Current groupings:

- Northern Europe / Scandinavia
- Eastern Europe / Slavic world
- Southeast Asia
- Arabia and the Levant
- Sub-Saharan Africa

This is an intermediate model, not a claim that all five are formal geographic/cultural ontologies.

# 5. Proposed: Links

This table is required for serious Sankey/alluvial work.

A Link documents a relationship between historical boxes.

Proposed fields:

| Field | Meaning |
|---|---|
| `link_id` | Unique identifier |
| `source_box_id` | Source entity |
| `target_box_id` | Target entity |
| `year` | Transition/relationship year |
| `relation_type` | Nature of relationship |
| `weight_basis` | How link width should be computed |
| `confidence` | Confidence |
| `source_url` | Supporting source |
| `notes` | Interpretation |

Recommended relation types:

- `successor`
- `partition`
- `unification`
- `conquest`
- `colonization`
- `decolonization`
- `dynastic_transition`
- `institutional_successor`
- `cultural_continuity`
- `migration`
- `other`

Example:

| source | target | year | relation |
|---|---|---:|---|
| Roman Empire | Western Roman Empire | 395 | partition |
| Roman Empire | Byzantine Empire | 395 | partition |
| Frankish Kingdom | West Francia | 843 | partition |
| East Francia | Holy Roman Empire | 962 | institutional_successor |

Not every chronological adjacency should automatically become a link.

# 6. Proposed: BoxSegments

`BoxSegments` should normalize the current `span` representation.

A BoxSegment represents one historical entity occupying one modern-country lane over one time interval.

Proposed fields:

| Field | Meaning |
|---|---|
| `segment_id` | Unique identifier |
| `box_id` | Parent box |
| `modern_country` | Modern-country alignment |
| `start_year` | Segment start |
| `end_year` | Segment end |
| `confidence` | Confidence |
| `notes` | Caveat |

This solves step-shaped poster boxes, differing start/end dates across modern-country lanes, geographic filtering, population allocation, and better alluvial layouts.

# 7. Generated JSON

Suggested outputs:

```text
data/
├── boxes.json
├── seais.json
├── population.json
├── regions.json
├── links.json
└── box-segments.json
```

The build process should validate all IDs and foreign keys.

# 8. Validation rules

At minimum:

### Boxes

- `box_id` unique;
- `start_year <= end_year` when both exist;
- valid color hex;
- controlled confidence vocabulary.

### SEAIs

- `seai_id` unique;
- every `box_id` exists;
- event year numeric when present;
- TODO Wikipedia URLs recognizable.

### Population

- every `box_id` exists;
- `population > 0` when populated;
- `population_low <= population <= population_high`;
- duplicate knot points flagged;
- controlled basis/method vocabulary.

### Links

- source and target boxes exist;
- relation type valid;
- transition year sensible.

### BoxSegments

- parent box exists;
- dates fall reasonably within parent box envelope;
- modern country exists in vocabulary.

# 9. Preserve uncertainty

Do not silently clean up ambiguous history.

Store source, confidence, low/high population, approximate labels, and notes.

The visual layer can decide how uncertainty is displayed.
