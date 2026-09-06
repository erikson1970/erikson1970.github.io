# Visualization Concepts

## Overall direction

The project should not simply redraw the original poster.

The poster is the source dataset and visual inspiration. The site should expose relationships that are hard to see on paper.

The strongest direction is a synchronized set of views built from one shared data model.

# View 1: Timeline

## Goal

Provide a recognizable, interactive descendant of the source poster.

Possible orientation:

- time horizontally for stronger compatibility with Sankey/alluvial views;
- region / modern-country lanes vertically.

The original poster's vertical-time orientation can still be tested.

## Box width modes

Allow:

- equal width;
- population;
- `log10(population)`;
- `sqrt(population)`.

Raw population may make smaller ancient polities disappear visually. `log10` or square root may be better compromises.

## Interaction

Clicking a box should:

- select it persistently;
- highlight corresponding SEAIs;
- update the inspector;
- highlight predecessor/successor links;
- dim unrelated boxes.

Hover can enhance but must not be the only interaction.

# View 2: Alluvial / Sankey

## Goal

Show succession, fragmentation, unification, conquest, and institutional continuity.

This is conceptually an **alluvial history view**, even if implemented with a Sankey library.

Recommended explanatory text:

> Ribbon width represents the estimated scale of the historical entity, not a literal transfer of people.

Chronology should constrain horizontal placement.

Do not allow generic auto-layout to place a 500 BCE node to the right of a 500 CE node.

# View 3: Population river / streamgraph

## Goal

Show demographic scale through time.

Potential hierarchy:

```text
World
  → Region
    → Civilization / polity
```

This becomes especially useful once population estimates are filled.

The browser or build script can interpolate between sparse knot points.

Candidate interpolation:

- linear population;
- log-linear population.

# View 4: Genealogy / relationship graph

This emphasizes relationship type rather than width.

Potential use:

- inspect one polity’s predecessors;
- inspect successors;
- distinguish conquest from dynastic transition;
- explore cross-regional relationships.

This can wait until `Links` matures.

# Proposed first page

```text
┌─────────────────────────────────────────────────────────────┐
│ WORLD HISTORY EXPLORER                                     │
│ Date range     Region       Width basis       SEAIs         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                 ALLUVIAL / SANKEY                           │
│                                                             │
├──────────────────────────────────────┬──────────────────────┤
│ Timeline                             │ Inspector             │
│                                      │                       │
│                                      │ Selected box          │
│                                      │ Dates                 │
│                                      │ Population            │
│                                      │ SEAIs                 │
│                                      │ Wikipedia             │
└──────────────────────────────────────┴──────────────────────┘
```

On narrow screens, stack vertically.

# Technology comparison

## Plotly

Best for rapid prototype and initial Sankey.

Advantages:

- fast;
- mature;
- good tooltips;
- easy static output.

Limitations:

- custom timeline/Sankey hybrid geometry may become awkward;
- exact node placement can be restrictive;
- advanced cross-view interaction may feel like fighting the library.

Recommendation: **use Plotly for the first functional experiment.**

## Apache ECharts

Good for a polished interactive dashboard with strong built-in interaction.

Recommendation: consider it if Plotly works conceptually but feels too scientific or generic.

## D3

Best for the likely final bespoke visualization.

Advantages:

- maximum control;
- direct SVG geometry;
- exact chronology;
- variable-width ribbons;
- synchronized custom views.

Cost:

- more code;
- more layout responsibility.

Recommendation: **likely final renderer if the project becomes a custom temporal Sankey.**

# Temporal Sankey concept

Instead of constant-width links, let ribbon width vary with time.

This produces a hybrid of:

- Sankey;
- alluvial;
- streamgraph;
- timeline.

That is a strong reason to keep population as a time series.

# Filtering

Recommended controls:

### Geography

- all;
- region;
- modern country.

### Time

- brush/slider;
- optional typed year range.

### Width

- equal;
- population;
- log population;
- square root population.

### Layers

- SEAIs;
- population uncertainty;
- modern-country lanes;
- succession links;
- selected ancestry/descendency only.

# Inspector behavior

Selecting a Box should show:

- name;
- dates;
- region/span;
- source color;
- population at selected date;
- low/high estimate;
- population method;
- confidence;
- SEAIs;
- notes;
- Wikipedia link.

Selecting a SEAI should show name, year, parent box, icon type, notes, and Wikipedia link.

# Visual uncertainty

Possible future encodings:

- dotted outline for uncertain boundaries;
- translucent population bands for low/high;
- warning glyph for low-confidence transcription;
- approximate-date prefix preserved in labels.

# Accessibility

- selection should not depend on hover;
- interactive marks should be keyboard reachable where practical;
- inspector should mirror tooltip information;
- color should not be the sole encoding.

# First prototype success criteria

The first prototype is successful if it can:

1. load generated static JSON;
2. render a chronological Sankey/alluvial subset;
3. render a simple timeline;
4. select a box in either view;
5. update a shared inspector;
6. filter by region;
7. switch width basis between equal and placeholder population mode;
8. deploy with no server-side component.
