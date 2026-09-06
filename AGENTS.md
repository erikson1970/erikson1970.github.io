# Agent Instructions

This repository is being developed interactively using Codex and Claude Code.

## Project intent

Build a fully static, graphically rich, interactive world-history explorer for GitHub Pages.

Do not introduce:

- a production backend;
- authentication;
- a database server;
- API keys;
- runtime Python dependencies.

Python is acceptable for build-time preprocessing.

## Source of truth

Excel files in `source/` are the human-editable source data.

Generated JSON in `data/` should be reproducible from those files.

Do not silently modify generated JSON in a way that cannot be recreated from the source workbook or build script.

## Read first

Before substantial work, read:

- `README.md`
- `docs/STATUS.md`
- `docs/DATA_MODEL.md`
- `docs/VISUALIZATION.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Historical-data discipline

Do not silently “correct” source-poster data using general knowledge.

Distinguish among:

1. data transcribed from the ChartOrigin poster;
2. externally researched additions;
3. implementation assumptions.

When adding researched data, preserve source URL, notes, confidence, and uncertainty where appropriate.

## IDs

Stable IDs are important.

Before renaming `box_id`, `seai_id`, `link_id`, or `segment_id`, search all dependent tables and generated files.

Prefer migrations over casual renaming.

## Wikipedia TODO URL

This URL is an intentional placeholder:

```text
https://en.wikipedia.org/wiki/Time_management#Implementation_of_goals
```

Treat it as `TODO`, not as actual metadata.

## Initial stack preference

Preferred progression:

1. Plotly for rapid Sankey prototype;
2. D3 if custom timeline/alluvial geometry is needed;
3. ECharts is acceptable if it materially simplifies interaction.

Do not prematurely rewrite a working prototype merely to change libraries.

## Browser architecture

Prefer plain HTML, CSS, modular JavaScript, and static JSON.

Avoid framework introduction unless there is a demonstrated need.

## Data build

Implement validation as early as practical.

The build should detect:

- duplicate IDs;
- broken foreign keys;
- malformed years;
- invalid population ranges;
- unknown relation types.

Warnings should include:

- TODO URLs;
- missing population;
- low-confidence records.

## Visualization semantics

A Sankey/alluvial link does **not** mean literal conservation of people.

Ribbon width means estimated historical scale unless a particular view explicitly defines another metric.

Chronology must remain semantically correct.

Do not allow an auto-layout to reorder nodes in a historically misleading way.

## Accessibility

Interactive marks should not require hover.

Where practical:

- click/tap selects;
- keyboard access is available;
- inspector mirrors tooltip information;
- color is not the sole encoding.

## Scope control

Prefer small vertical slices:

1. load data;
2. validate;
3. render a small subset;
4. synchronize selection;
5. add filtering;
6. expand data coverage.

Do not attempt to perfect every historical region before producing a working visualization.

## Source control workflow

`main` is treated as sacred, even though it is not branch-protected on GitHub.

- Do work on `feature/<name>` or `fix/<name>` branches, never directly on `main`.
- Merge to `main` only after a milestone's goal is verified closed (see
  "Milestone review process" below).
- Commit frequently on the working branch — small, real commits, not one
  giant squash at the end.

## Issue and requirement tracking

- `ISSUES.md` tracks open defects/deferred work, each tagged **Gatekeeper**
  (blocks the current milestone) or **Minor** (tabled — tracked, not
  blocking).
- `TRACEABILITY.md` tracks closure of stated requirements/goals (from this
  file, `README.md`, `docs/DATA_MODEL.md`, `docs/IMPLEMENTATION_PLAN.md`)
  against verification evidence.
- Gatekeeper issues must be resolved (or explicitly reclassified as minor,
  with reasoning) before a milestone branch merges to `main`. Minor issues
  are fine to table indefinitely.

## Milestone review process

Before merging a milestone branch to `main`, close out the milestone by
instantiating a small **council of experts**: independent reviewers (each a
subagent with a distinct lens — e.g. data integrity, architecture/static-site
constraints, accessibility/visualization semantics) who each check the
milestone's stated goal against the actual repo state and report findings.

- Feed the council the milestone's requirements (from `TRACEABILITY.md`/this
  file) and the current diff/state — not just a summary.
- Reconcile their findings into `ISSUES.md` (new issues) and
  `TRACEABILITY.md` (status updates) before deciding to merge.
- A milestone can close with tabled minor issues; it should not close with
  open gatekeeper issues.

## Definition of done for v0.1

A successful v0.1:

- runs as a static site;
- loads generated JSON;
- shows an interactive chronological Sankey/alluvial subset;
- shows a simple timeline;
- supports selecting a historical box;
- updates an inspector;
- supports at least one region filter;
- is deployable directly to GitHub Pages.
