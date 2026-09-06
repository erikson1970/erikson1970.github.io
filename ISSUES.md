# Issues

Open-issue tracker for `erikson1970.github.io` as a whole (the root landing
page, `projects/world-history/`, and any future project) — one shared,
continuous history, not split per project.

Severity:

- **Gatekeeper** — blocks closing the current milestone. Must be fixed or explicitly downgraded before merging the milestone branch to `main`.
- **Minor** — tabled. Tracked but does not block milestone closure.

Status: `Open`, `Tabled`, `Resolved`.

An issue closed by a milestone council review notes which review closed it.

**Path note:** issues filed before Milestone 3 refer to paths at the
repository root (`docs/`, `source/`, `tools/`, `css/`, `js/`, `data/`) —
accurate at the time. As of Milestone 3 those paths live under
`projects/world-history/`. Historical entries are left as originally
recorded rather than rewritten.

---

## Open

_(none yet — see Tabled below)_

## Tabled (minor, deferred)

### ISSUE-001 — `Regions` rows lack a unique per-row identifier
- **Severity:** Minor
- **Status:** Tabled
- **Source:** `docs/DATA_MODEL.md`, workbook `Regions` sheet
- **Description:** `region_id` is a grouping key shared by every country row in a region (e.g. `NE_SCAND` repeats once per country), not a unique row key. Fine for filtering today; will need a real per-row key (or a composite `region_id`+`country`) if `Regions` grows into real historical timelines per Phase 8.
- **Deferred until:** Phase 8 (region expansion) or whenever a `Regions`-keyed foreign key is needed.

### ISSUE-002 — All `Boxes`/`SEAIs` URLs are still the TODO placeholder
- **Severity:** Minor
- **Status:** Tabled
- **Source:** `docs/STATUS.md`
- **Description:** Confirmed by validation: 198/198 `Boxes` rows and 83/83 `SEAIs` rows currently hold `https://en.wikipedia.org/wiki/Time_management#Implementation_of_goals`. Expected at this stage; tracked here so it isn't mistaken for a data bug later.
- **Deferred until:** "Add real Wikipedia URLs gradually" (STATUS.md recommended next work, priority 4).

### ISSUE-003 — `Population` table has zero filled estimates
- **Severity:** Minor
- **Status:** Tabled
- **Source:** `docs/STATUS.md`
- **Description:** All 390 seeded knot-point rows have no `population` value yet, by design (values intentionally not invented). No width-by-population rendering is possible until a representative subset is filled.
- **Deferred until:** Phase 6 (population experiment); STATUS.md's recommended first-subset list (Roman, Byzantine, Persian, Ottoman, major Chinese dynasties, etc.).

### ISSUE-004 — `Links` and `BoxSegments` tables do not exist yet
- **Severity:** Minor
- **Status:** Tabled
- **Source:** `docs/DATA_MODEL.md`, `docs/STATUS.md`
- **Description:** No succession/relationship data and no per-country-lane segmentation exist yet. Alluvial/Sankey view and accurate multi-country boxes (Rome, Ottomans, etc.) are blocked on these.
- **Deferred until:** Phase 3 (`Links`, minimal subset) and Phase 7 (`BoxSegments`).
- **Note (Milestone 4):** The `Links` half is now partially resolved — a 7-row hand-authored subset covering the Mediterranean/Europe cluster (`docs/IMPLEMENTATION_PLAN.md` Phase 3) exists and drives a working Sankey/alluvial prototype (see `TRACEABILITY.md` § Milestone 4). The China cluster and the rest of the dataset remain unlinked, and `BoxSegments` remains fully open (still deferred to Phase 7). Left open rather than closed since the title's `Links` scope is only partially covered.

### ISSUE-006 — No automated test suite for `tools/wh_data.py`
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 1 implementation
- **Description:** `build_data.py`/`validate_data.py` were exercised manually against the real workbook and against a deliberately corrupted copy (duplicate `box_id`, invalid `color_hex`, cascading FK break) to confirm the ERROR path genuinely blocks output. There's no repeatable test file for this yet.
- **Deferred until:** whenever the validation logic grows complex enough that manual spot-checks stop being sufficient, or before a CI step is added.

### ISSUE-005 — Six `Boxes` rows have no `start_year`
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Data-integrity council review of `source/world_history_chart_dataset_v2.xlsx`
- **Description:** A handful of "Indigenous Era" boxes (e.g. `US_INDIG`, `CA_INDIG`, `AR_INDIG`, `AU_INDIG`) have a null `start_year` because the poster prints an illegible "c. [BCE]" with no parseable number there. `end_year` is always present, and `DATA_MODEL.md`'s rule only requires `start_year <= end_year` "when both exist," so this is not a validation-rule violation — just an open transcription gap, consistent with STATUS.md limitation #2.
- **Resolution:** None yet. Left for whoever transcribes those boxes' start dates, or for the build script to render them with an explicit "unknown start" treatment.
- **Note:** This entry was misfiled under `## Resolved` from Milestone 0 through Milestone 1 despite its own `Status:` field always saying `Tabled` — caught and moved here by the Milestone 1 process/docs council review.

### ISSUE-007 — `wh_data.py` vocabulary-check loop has dead code for `estimate_method`
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 1 data-integrity council review
- **Description:** The loop in `validate_population` iterates `for field_name in ("population_basis", "estimate_method")`, but the guard condition only fires for `field_name == "population_basis"`, so the `estimate_method` branch can never execute. Harmless today because `DATA_MODEL.md` §3 defines no recommended vocabulary for `estimate_method` (nothing is actually missed), but the code reads as if both fields are checked.
- **Deferred until:** whenever `estimate_method` gets a real controlled vocabulary, or general pipeline cleanup.

### ISSUE-008 — Malformed/corrupt source workbook produces a raw Python traceback, not a clean CLI error
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 1 data-integrity council review
- **Description:** A truncated/non-zip `.xlsx` raises an uncaught `zipfile.BadZipFile` from inside `openpyxl.load_workbook`, and a workbook missing an expected sheet raises an uncaught `ValueError` from `wh_data.load_workbook`; neither is wrapped in a try/except in `build_data.py`/`validate_data.py`. Confirmed safe in both cases (exit code 1, no output written) — just not a clean `error:`-prefixed message like the already-handled missing-`--source`-file case.
- **Deferred until:** whenever the CLI's error UX is revisited, or before non-maintainers start editing the workbook directly.

### ISSUE-009 — No automated test suite for `js/app.js`/`js/data.js`/`js/state.js`
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 2 process/docs council review
- **Description:** Parallel to ISSUE-006 but for the frontend: the Milestone 2 commit message documents real Node-based runtime verification (against a live local server and a minimal DOM stub), but none of it is a committed, repeatable test file — only prose in the commit message. ISSUE-006's title/scope is explicitly the Python pipeline (`tools/wh_data.py`) and does not cover this. The same gap recurred in Milestone 3: a Node `loadAllData()` run verified the moved `data/*.json` still loads correctly post-move, again only as prose (see `TRACEABILITY.md` M3-4, downgraded to Partial for this reason). Recurred a third time in Milestone 4: a Node fake-DOM harness verified the Sankey/Links integration (data load, box-list render, region-filter narrowing, box- and link-click-to-inspector, the accessible fallback list, and the Plotly-unavailable degradation path), but again only as commit-message/`TRACEABILITY.md` prose, not a committed test file (see `TRACEABILITY.md` M4-6/M4-8).
- **Deferred until:** whenever `js/` grows complex enough that manual/ad-hoc verification stops being sufficient, or alongside ISSUE-006 if/when a test runner is introduced for either side.

### ISSUE-010 — Milestone commits land as one (or two) large commits, not the "commit frequently" granularity AGENTS.md describes
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 2 process/docs council review
- **Description:** AGENTS.md § Source control workflow says "commit frequently on working branch — small, real commits, not one giant squash at the end." All three milestones so far (0, 1, 2) each landed as one primary commit (plus, for 1 and 2, one small follow-up docs commit) rather than incremental commits during the work. Not flagged by either of the first two council reviews; caught on the third pass. No functional impact — each commit message is detailed and the work was verified as a unit before committing — but it's a real gap between written process and actual practice.
- **Deferred until:** a decision on whether to tighten actual practice (commit more granularly mid-milestone going forward) or relax AGENTS.md's wording to match reality; not worth rewriting history on already-merged milestones.
- **Note (Milestone 4):** Improved, not resolved — Milestone 4 split cleanly into three commits (data pipeline, UI, docs/traceability) instead of one or two, closer to but still short of the "small, real commits" ideal. Left open since Milestones 0–3 are unaffected and the practice isn't yet consistent enough to call this closed.

### ISSUE-011 — `Links` "transition year sensible" check is a loose union-envelope heuristic, not a real sensibility check
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 4 data-integrity council review
- **Description:** `docs/DATA_MODEL.md` §8 lists "transition year sensible" as a `Links` validation rule. The actual implementation (`tools/wh_data.py` `validate_links`) checks only that the link's `year` falls within `[min(source.start_year, target.start_year), max(source.end_year, target.end_year)]` — the *union* of both boxes' lifespans, not their overlap or adjacency. A link between two boxes centuries apart could still pass this check if the chosen year happened to land inside the wider combined span. Not triggered by any of the current 7 rows (all pass cleanly and are historically accurate), and it's correctly scoped as a WARNING rather than a build-blocking ERROR, but the word "sensible" oversells what's actually verified.
- **Deferred until:** whenever a real subset gets large/varied enough that this heuristic would plausibly miss a genuinely bad link, or general validation-logic cleanup.

## Resolved

### ISSUE-000 — Repo contained an unrelated portfolio template and stray files
- **Severity:** Gatekeeper
- **Status:** Resolved
- **Description:** `index.html` and `static/` held a generic "Portfolio template" theme (Lorem Ipsum, fake bios) unrelated to this project; `HotelList.txt` (personal hotel-search links) and `chat_log.md` (dead sandbox links from doc handoff) were also present.
- **Resolution:** Removed `static/`, `HotelList.txt`, `chat_log.md`; replaced `index.html` with a minimal placeholder. Closed by Milestone 0 council review.

## Milestone council reviews

### Milestone 0 — Repository reset & data intake
Reviewed 2026-09-06 against commit `3f84688` (branch `feature/repo-reset`), three lenses:

| Reviewer | Verdict |
|---|---|
| Data integrity | PASS |
| Static-site architecture / constraints | PASS |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

No gatekeeper findings. The process/docs reviewer's minor findings (severity-field enum drift on a resolved issue, no per-entry `Status:` field, ambiguity in `AGENTS.md`'s milestone-review process) were fixed inline in this document and in `AGENTS.md` rather than filed as separate issues. Milestone approved to merge to `main`.

### Milestone 1 — Data build pipeline
Reviewed 2026-09-06 against commit `74459d7` (branch `feature/build-data-pipeline`), three lenses:

| Reviewer | Verdict |
|---|---|
| Data integrity | PASS |
| Static-site architecture / constraints | PASS |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

No gatekeeper findings. New minor issues filed: ISSUE-007 (dead code in a vocabulary-check loop), ISSUE-008 (raw traceback on a malformed/corrupt workbook instead of a clean CLI error). The process reviewer's misfiled-`ISSUE-005` finding was fixed inline (moved from `## Resolved` to `## Tabled`, matching its own `Status:` field). Also fixed inline: `tools/README.md` now points at `tools/requirements.txt`, and `docs/STATUS.md` was refreshed to mention the build/validation pipeline. Milestone approved to merge to `main`.

### Milestone 2 — Minimal static application
Reviewed 2026-09-06 against commits `7511bee`/`3881455` (branch `feature/minimal-app`), three lenses:

| Reviewer | Verdict |
|---|---|
| Data integrity | PASS_WITH_MINOR_ISSUES |
| Static-site architecture / constraints & accessibility | PASS |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

No gatekeeper findings. Fixed inline (real code/docs changes, not just tabled):
- **Sort-order bug** (data-integrity finding): `filteredBoxes` in `js/app.js` sorted the 6 null-`start_year` boxes from ISSUE-005 by their *end* year, misplacing e.g. `US_INDIG` (prehistory–1607) next to 16th–century boxes instead of near other prehistoric-start entities. Changed the fallback from `?? end_year ?? 0` to `?? Number.NEGATIVE_INFINITY` so these boxes sort to the front, consistent with them representing the earliest, least-precisely-dated era for their region.
- **Unhandled rejection** (architecture finding): `main()`'s call site had no `.catch()`, so a rendering-time error (as opposed to a fetch failure, already handled) would only produce a silent console warning. Added `main().catch(...)` routing to the same `setStatus(..., true)` error display.
- **Stale `js/README.md`** (process finding): rewritten to describe the actual `data.js`/`state.js`/`app.js` split instead of a since-superseded planned module list.
- **Stale `docs/STATUS.md`** (process finding): refreshed to mention the Phase 2 prototype and mark "Build first interactive prototype" done.

New minor issues filed (tabled, not gatekeepers): ISSUE-009 (no automated test suite for the new `js/` modules, parallel to ISSUE-006), ISSUE-010 (milestones have landed as one or two large commits rather than the frequent-small-commits granularity AGENTS.md describes — a process/practice gap, not unique to this milestone). Milestone approved to merge to `main`.

### Milestone 3 — Site restructure
Reviewed 2026-09-06 against commit `ce8b234` (branch `feature/site-restructure`), three lenses:

| Reviewer | Verdict |
|---|---|
| Path & link integrity | PASS |
| Static-site architecture / constraints & accessibility | PASS_WITH_MINOR_ISSUES |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

No gatekeeper findings. Fixed inline (real code/docs changes, not just tabled):
- **Missing heading on project cards** (architecture/accessibility finding): `.project-card` links weren't wrapped in a heading, so screen-reader users navigating by heading list would miss per-project headings once more cards are added. Wrapped the link in an `<h3>` in `index.html` and updated `css/site.css` selectors accordingly.
- **Missing `fonts.googleapis.com` preconnect** (architecture finding, trivial performance nit): added the second `<link rel="preconnect">` alongside the existing `fonts.gstatic.com` one.
- **Stale `README.md` section citations in `TRACEABILITY.md`** (process finding): Milestones 0–2's requirement rows cite "README.md § ..." headings that moved wholesale to `projects/world-history/README.md` in Milestone 3; the existing "Path note" only covered directory paths, not this. Extended the note to explain the README content relocation too.
- **M3-4 evidence overstated** (process finding): the requirement's "Met" status rested partly on a Node `loadAllData()` run that, like Milestone 2's equivalent checks (ISSUE-009), was never captured as a committed, repeatable test — only asserted in prose. Downgraded M3-4 to Partial in `TRACEABILITY.md` and extended ISSUE-009's description to note the recurrence.

Noted, not newly filed: Milestone 3 again landed as two large commits (`121b4ff`, `ce8b234`), consistent with the already-tabled ISSUE-010 rather than a new or worsened gap. Milestone approved to merge to `main`.
