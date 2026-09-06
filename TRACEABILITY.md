# Traceability

Maps stated requirements/goals to verification status. Updated at each milestone
council review (see `AGENTS.md` § Milestone review process). Not a substitute for
`ISSUES.md` — this tracks *closure of stated requirements*, `ISSUES.md` tracks
*defects and deferred work*.

Status values: `Met`, `Partial`, `Not started`.

**Path note:** Milestones 0–2 below predate the Milestone 3 restructure and
refer to `index.html`, `css/`, `js/`, `data/`, `source/`, `tools/`, and
`docs/` at the repository root — accurate at the time each was written. As
of Milestone 3, the world-history project (and those paths) live under
`projects/world-history/`; see the Milestone 3 section. Historical entries
are left as originally recorded rather than rewritten.

---

## Milestone 0 — Repository reset & data intake

Goal (`AGENTS.md` Phase 0 / `IMPLEMENTATION_PLAN.md` Phase 0): replace disposable
repo contents with a clean project structure and bring the source workbook in.

| Req | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| M0-1 | Recommended site structure in place (`index.html`, `css/`, `js/`, `data/`, `source/`, `tools/`, `docs/`) | README.md § Recommended site structure | Met | Directories created; docs moved into `docs/`; workbook moved into `source/` |
| M0-2 | Docs readable from paths `AGENTS.md`/README point to | AGENTS.md § Read first | Met | `docs/STATUS.md`, `docs/DATA_MODEL.md`, `docs/VISUALIZATION.md`, `docs/IMPLEMENTATION_PLAN.md` now exist at those paths |
| M0-3 | No disposable/unrelated content remains | README.md § Purpose ("current contents disposable") | Met | Portfolio-template `index.html`/`static/`, `HotelList.txt`, `chat_log.md` removed |
| M0-4 | Excel workbook present as source of truth | README.md § Data authority | Met | `source/world_history_chart_dataset_v2.xlsx` added |
| M0-5 | Workbook row counts match documented counts | docs/STATUS.md | Met | Verified: Boxes 198/198, SEAIs 83/83, Population 390/390, Regions 89/89 |
| M0-6 | No production backend/DB/auth/API keys introduced | AGENTS.md § Project intent | Met | Reset introduced only static assets and docs |

### Data validation spot-checks (informational, feeds Phase 1 `validate_data.py`)

| Check | Result |
|---|---|
| Duplicate `box_id` | none found (198 unique) |
| `start_year <= end_year` | holds for all rows with both years present |
| `color_hex` matches `#RRGGBB` | all 198 valid |
| `box_id` confidence vocabulary in use | `High`, `Medium` |
| Duplicate `seai_id` | none found (83 unique) |
| Orphan `SEAIs.box_id` (no matching Box) | none |
| Orphan `Population.box_id` (no matching Box) | none |
| TODO placeholder URL count | Boxes 198/198, SEAIs 83/83 (expected — see ISSUE-002) |
| `Population.population` filled | 0/390 (expected — see ISSUE-003) |
| Duplicate `Regions.region_id` | 5 groups repeat by design, one row per country (see ISSUE-001) |

### Milestone 0 council review

Reviewed 2026-09-06 against commit `3f84688`: data integrity PASS, static-site
architecture/constraints PASS, process & documentation consistency
PASS_WITH_MINOR_ISSUES (wording/process nits, no gatekeeper findings — see
`ISSUES.md` § Milestone council reviews). Merged to `main`.

## Milestone 1 — Data build pipeline

Goal (`docs/IMPLEMENTATION_PLAN.md` Phase 1): convert the Excel workbook to
validated JSON, failing the build on structural problems and warning on
content-quality issues.

| Req | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| M1-1 | Build script reads `source/*.xlsx`, writes `data/*.json` | README.md § Data authority, IMPLEMENTATION_PLAN.md Phase 1 | Met | `tools/build_data.py`; run produces `data/{boxes,seais,population,regions}.json` |
| M1-2 | Fails on duplicate IDs | IMPLEMENTATION_PLAN.md Phase 1 | Met | `wh_data.py` `validate_boxes`/`validate_seais`/`validate_population`; verified against an injected duplicate `box_id` (exit 1, no output written) |
| M1-3 | Fails on broken foreign keys | IMPLEMENTATION_PLAN.md Phase 1 | Met | `SEAIs.box_id`/`Population.box_id` checked against `Boxes`; verified via injected corruption (cascading FK errors correctly detected) |
| M1-4 | Fails on malformed years | IMPLEMENTATION_PLAN.md Phase 1 | Met | numeric-type check on all year fields |
| M1-5 | Fails on invalid population ranges | IMPLEMENTATION_PLAN.md Phase 1 | Met | `population > 0`, `low <= population <= high` |
| M1-6 | Fails on unknown relation types | IMPLEMENTATION_PLAN.md Phase 1 | Not started | No `Links` table exists yet (tracked as ISSUE-004); nothing to validate until Phase 3 |
| M1-7 | Warns on TODO URLs, missing population, low-confidence records, suspicious dates | IMPLEMENTATION_PLAN.md Phase 1 | Met | Verified: real workbook run produces exactly 671 warnings (198 Box + 83 SEAI TODO URLs, 390 unfilled Population rows), 0 errors |
| M1-8 | `data/*.json` reproducible from `source/*.xlsx`, never hand-edited | AGENTS.md § Source of truth | Met | `data/README.md` states the rule; build overwrites deterministically on every run |
| M1-9 | No runtime Python — build-time only | AGENTS.md § Project intent | Met | `tools/` scripts run only at build time; no Python referenced from `index.html`/`js/` |

### Milestone 1 council review

Reviewed 2026-09-06 against commit `74459d7`: data integrity PASS, static-site
architecture/constraints PASS, process & documentation consistency
PASS_WITH_MINOR_ISSUES (a misfiled issue entry and two stale-docs nits, no
gatekeeper findings — see `ISSUES.md` § Milestone council reviews). Merged to
`main`.

## Milestone 2 — Minimal static application

Goal (`docs/IMPLEMENTATION_PLAN.md` Phase 2): a genuinely interactive first
slice on top of Phase 1's generated JSON — separate data loading, state
management, and rendering; select a box and see an inspector; at least one
filter.

| Req | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| M2-1 | Data loading is a separate module from rendering/state | IMPLEMENTATION_PLAN.md Phase 2 | Met | `js/data.js` only fetches/indexes; no DOM references |
| M2-2 | State management is a separate, minimal module | IMPLEMENTATION_PLAN.md Phase 2 | Met | `js/state.js`: `createStore()` (get/set/subscribe), no rendering logic |
| M2-3 | Runs as a static site with no build step | AGENTS.md § Project intent | Met | Plain ES modules loaded via `<script type="module">`; no bundler |
| M2-4 | Select a historical box | README.md § core idea, V1-5 | Met | Box list items are `<button>`s; click toggles `selectedBoxId` |
| M2-5 | Updates an inspector | README.md § core idea, V1-6 | Met | `renderInspector` shows name/dates/region/span/confidence/notes/url/SEAIs |
| M2-6 | At least one region filter | README.md § core idea, V1-7 | Met | `region-filter` `<select>` populated from `regionGroups()`, filters the list |
| M2-7 | Interactive marks don't require hover; keyboard-accessible | AGENTS.md § accessibility | Met | Real `<button>` elements (native click + Enter/Space + Tab focus); `:focus-visible` style in `css/history.css` |
| M2-8 | Color is not the sole encoding for selection state | AGENTS.md § accessibility | Met | Selected item also gets bold text + a checkmark (`::before`), not just background color |
| M2-9 | Runtime behavior verified, not just claimed | Process norm established during Milestone 1 (not yet written into AGENTS.md) | Partial | Node (built-in fetch) against a local static server + a minimal DOM stub: `loadAllData`/`regionGroups` against real `data/*.json`, `createStore` pub-sub semantics, full `app.js` wiring (click-to-select, filter narrowing, selection-clear-on-filter-change) — verification performed and independently reproduced by the Milestone 2 data-integrity/architecture council reviewers, but not captured as a committed, repeatable test file (see ISSUE-009) |

### Milestone 2 council review

Reviewed 2026-09-06 against commits `7511bee`/`3881455`: data integrity
PASS_WITH_MINOR_ISSUES, static-site architecture/constraints & accessibility
PASS, process & documentation consistency PASS_WITH_MINOR_ISSUES. No
gatekeeper findings; a real sort-order bug and an unhandled-rejection gap
were fixed inline, `js/README.md`/`docs/STATUS.md` refreshed, two new minor
issues tabled (ISSUE-009, ISSUE-010) — see `ISSUES.md` § Milestone council
reviews. Merged to `main`.

## Milestone 3 — Site restructure

Goal (user request, relayed 2026-09-06): make the repository root a modest
personal landing page for erikson1970, move the World History Explorer to
live under `projects/world-history/`, and put the site in a shape that
supports adding further projects later — without breaking the existing
project or losing its history.

| Req | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| M3-1 | World History Explorer fully relocated to `projects/world-history/` with no broken internal paths | User request | Met | Whole tree moved as one `git mv` commit (`121b4ff`, git-detected 100% renames); internal relative references between `index.html`/`css/`/`js/`/`data/` are unaffected since the whole subtree moved together |
| M3-2 | Root becomes a modest personal landing page (Viking/Nordic/French-themed), not the world-history project | User request | Met | New root `index.html` + `css/site.css`: navy/forest-green ground, gold/bronze accents, serif display headings, CSS-only knotwork divider, user's verbatim bio copy |
| M3-3 | Root design supports future project expansion | User request | Met | `.project-list`/`.project-card` pattern designed for repeated `<li>` entries; root `README.md` documents adding a `projects/<name>/` directory per new project |
| M3-4 | Moved project verified functional at its new nested path | Process norm (established Milestone 1/2) | Met | Local static server + `curl` against `projects/world-history/`, `css/history.css`, `js/app.js`, `data/boxes.json`; Node `loadAllData()` against the moved JSON (198/83/390/89 rows, unchanged); `python3 tools/validate_data.py` run from `projects/world-history/` (671 warnings, 0 errors, unchanged) |
| M3-5 | `ISSUES.md`/`TRACEABILITY.md` kept shared at repository root, one continuous history | User request (explicit choice over per-project split) | Met | Neither file moved; both got a "Path note" explaining pre-Milestone-3 entries reference now-superseded root-relative paths |
| M3-6 | `AGENTS.md`/`README.md` updated to describe the new structure | Process norm (docs must match reality) | Met | `AGENTS.md` gained a "Repository structure" section and updated paths throughout; root `README.md` rewritten for the personal-site framing; old `README.md` moved to `projects/world-history/README.md` with a historical note added |
| M3-7 | No production backend/DB/auth/API keys introduced | AGENTS.md § Project intent | Met | Restructure introduced only static HTML/CSS and doc changes |

### Milestone 3 council review

_(pending — to be run against the branch tip before merge to `main`)_

## v0.1 definition of done (forward-looking; not yet in scope)

Tracked here so later milestones can check items off against `AGENTS.md`'s
"Definition of done for v0.1" without re-deriving the list.

| Req | Requirement | Status |
|---|---|---|
| V1-1 | Runs as a static site | Met (Milestone 2) |
| V1-2 | Loads generated JSON | Met (Milestone 2) |
| V1-3 | Interactive chronological Sankey/alluvial subset | Not started |
| V1-4 | Simple timeline | Not started |
| V1-5 | Select a historical box | Met (Milestone 2, box-list only; no timeline/alluvial marks yet) |
| V1-6 | Updates an inspector | Met (Milestone 2) |
| V1-7 | At least one region filter | Met (Milestone 2) |
| V1-8 | Deployable to GitHub Pages | Met (live since Milestone 0; Milestone 2 content not yet merged to `main`) |
