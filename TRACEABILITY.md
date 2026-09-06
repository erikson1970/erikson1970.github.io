# Traceability

Maps stated requirements/goals to verification status. Updated at each milestone
council review (see `AGENTS.md` § Milestone review process). Not a substitute for
`ISSUES.md` — this tracks *closure of stated requirements*, `ISSUES.md` tracks
*defects and deferred work*.

Status values: `Met`, `Partial`, `Not started`.

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

## v0.1 definition of done (forward-looking; not yet in scope)

Tracked here so later milestones can check items off against `AGENTS.md`'s
"Definition of done for v0.1" without re-deriving the list.

| Req | Requirement | Status |
|---|---|---|
| V1-1 | Runs as a static site | Not started |
| V1-2 | Loads generated JSON | Not started |
| V1-3 | Interactive chronological Sankey/alluvial subset | Not started |
| V1-4 | Simple timeline | Not started |
| V1-5 | Select a historical box | Not started |
| V1-6 | Updates an inspector | Not started |
| V1-7 | At least one region filter | Not started |
| V1-8 | Deployable to GitHub Pages | Not started |
