# Agent Instructions

This repository is being developed interactively using Codex and Claude Code.

## Repository structure

This repo serves `erikson1970.github.io` as a whole:

- `/` (root `index.html`, root `css/`) is a modest personal landing page —
  not a project in its own right. Keep it simple and static.
- `projects/<name>/` holds each individual project as a self-contained
  static site (its own `index.html`, `css/`, `js/`, `data/`, etc.), reachable
  at `erikson1970.github.io/projects/<name>/`. The first and (for now)
  primary project is `projects/world-history/`, the world-history explorer
  described throughout the rest of this file.
- `ISSUES.md` and `TRACEABILITY.md` at the root are shared across the whole
  repo (one continuous history, not split per project) — see "Issue and
  requirement tracking" below.
- `AGENTS.md` and `README.md` stay at the root as the overall primer; a
  project may have its own `docs/` for project-specific detail (e.g.
  `projects/world-history/docs/`).

When adding a new project, give it its own `projects/<name>/` directory and
link it from the root landing page; don't scatter its files into the shared
root directories.

## Project intent (`projects/world-history/`)

Build a fully static, graphically rich, interactive world-history explorer for GitHub Pages.

Do not introduce:

- a production backend;
- authentication;
- a database server;
- API keys;
- runtime Python dependencies.

Python is acceptable for build-time preprocessing.

The same static-only, no-backend constraints apply to the root landing page
and to any future project added under `projects/`.

## Source of truth

Excel files in `projects/world-history/source/` are the human-editable source data.

Generated JSON in `projects/world-history/data/` should be reproducible from those files.

Do not silently modify generated JSON in a way that cannot be recreated from the source workbook or build script.

## Read first

Before substantial work, read:

- `README.md`
- `projects/world-history/docs/STATUS.md`
- `projects/world-history/docs/DATA_MODEL.md`
- `projects/world-history/docs/VISUALIZATION.md`
- `projects/world-history/docs/IMPLEMENTATION_PLAN.md`

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
  file, `README.md`, and each project's own docs, e.g.
  `projects/world-history/docs/DATA_MODEL.md` and
  `projects/world-history/docs/IMPLEMENTATION_PLAN.md`) against verification
  evidence.
- Gatekeeper issues must be resolved (or explicitly reclassified as minor,
  with reasoning) before a milestone branch merges to `main`. Minor issues
  are fine to table indefinitely.

## Milestone review process

A **milestone branch** is one that closes out a numbered phase/milestone from
a project's `docs/IMPLEMENTATION_PLAN.md` (e.g.
`projects/world-history/docs/IMPLEMENTATION_PLAN.md`), a site-level change
(e.g. the Milestone 3 root/`projects/` restructure), or `TRACEABILITY.md`
generally (e.g. `feature/repo-reset` for Milestone 0). Small `fix/<name>`
branches for sub-tasks within a milestone don't need their own council; only
the milestone-closing merge to `main` does.

Before that merge, close out the milestone by instantiating a small **council
of experts**: independent reviewers (each a subagent with a distinct lens)
who check the milestone's stated goal against the actual repo state — not a
summary of it — and report findings. At minimum, run:

1. a **data/content integrity** lens (whatever the milestone touched:
   workbook, generated JSON, etc.);
2. an **architecture/static-site constraints** lens (this file's Project
   intent constraints, recommended structure, no leftover disposable
   content);
3. a **process & documentation consistency** lens (do `ISSUES.md` and
   `TRACEABILITY.md` cross-reference each other correctly, do stated file
   paths actually resolve, is anything stale) — do not skip this one; it has
   caught real issues that the other two lenses miss.

Whoever drives the merge (the session/agent orchestrating the milestone)
reconciles the council's findings into `ISSUES.md` (new issues, filed at the
correct severity) and `TRACEABILITY.md` (status updates), and fixes cheap
wording/process nits inline rather than filing them. Each reviewer should
report a `VERDICT: PASS | PASS_WITH_MINOR_ISSUES | FAIL` plus a `FINDINGS`
list tagged `[gatekeeper]` or `[minor]`, citing concrete evidence (file
paths, counts, quoted lines) rather than impressions.

A milestone can close with tabled minor issues; it should not close with
open gatekeeper issues, and a `FAIL` verdict from any reviewer blocks the
merge until resolved or the finding is reclassified with stated reasoning.

## Definition of done for v0.1 (`projects/world-history/`)

A successful v0.1 of the world-history explorer:

- runs as a static site;
- loads generated JSON;
- shows an interactive chronological Sankey/alluvial subset;
- shows a simple timeline;
- supports selecting a historical box;
- updates an inspector;
- supports at least one region filter;
- is deployable directly to GitHub Pages.
