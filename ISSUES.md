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
- **Note (Milestone 5):** This is why the Phase 4 timeline (`js/timeline.js`) has no population-based width mode: `js/state.js`'s `widthMode` field exists but has no UI control yet, deferred until this table has real values to render.

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
- **Note (Milestone 5):** `js/timeline.js`'s `buildTimelineLayout()` gives these six boxes exactly the "explicit unknown start treatment" this issue's resolution note anticipated — `approxStart: true`, with the bar's rendered start pinned to the current view's left edge rather than a fabricated year. Still not resolved (no real `start_year` has been transcribed), just no longer un-rendered.

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
- **Note (Milestone 5):** Partially resolved rather than recurring a 4th time — `js/timeline.test.mjs` is a committed, repeatable test for `buildTimelineLayout()` (run with `node js/timeline.test.mjs`; a new root `package.json` with `"type": "module"` lets Node load it and `./timeline.js` directly, no scratch-copy workaround needed). `renderTimeline()`'s actual D3/DOM rendering and click-firing are still unverified (no real browser in this environment), and `sankey.js`/`app.js`/`data.js`/`state.js` remain entirely uncovered, so this issue stays open and Tabled rather than moving to Resolved.
- **Note (Milestone 6):** A second module now has committed coverage — `js/sankey.test.mjs` (run with `node js/sankey.test.mjs`), covering `buildSankeyFigure()` (previously untested, Phase 3) and the new `computeSankeyHighlight()` (Phase 5). `applySankeySelection()`'s actual `Plotly.restyle` call, and `app.js`/`data.js`/`state.js` in full, remain uncovered — still Tabled, not Resolved.

### ISSUE-010 — Milestone commits land as one (or two) large commits, not the "commit frequently" granularity AGENTS.md describes
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 2 process/docs council review
- **Description:** AGENTS.md § Source control workflow says "commit frequently on working branch — small, real commits, not one giant squash at the end." All three milestones so far (0, 1, 2) each landed as one primary commit (plus, for 1 and 2, one small follow-up docs commit) rather than incremental commits during the work. Not flagged by either of the first two council reviews; caught on the third pass. No functional impact — each commit message is detailed and the work was verified as a unit before committing — but it's a real gap between written process and actual practice.
- **Deferred until:** a decision on whether to tighten actual practice (commit more granularly mid-milestone going forward) or relax AGENTS.md's wording to match reality; not worth rewriting history on already-merged milestones.
- **Note (Milestone 4):** Improved, not resolved — Milestone 4 split cleanly into three commits (data pipeline, UI, docs/traceability) instead of one or two, closer to but still short of the "small, real commits" ideal. Left open since Milestones 0–3 are unaffected and the practice isn't yet consistent enough to call this closed.
- **Note (Milestone 5):** Regressed back to two commits (code, then docs/traceability) — not egregious (still a clean split, not a single squash), but not the three-commit improvement Milestone 4 made either. Practice still inconsistent; left open.
- **Note (Milestone 7):** Regressed further — landed as a single commit bundling the new `js/timescale.js` module, the `js/timeline.js`/`js/sankey.js`/`js/app.js`/`index.html` integration, all three test files, and all docs/traceability updates together (flagged by that milestone's own architecture council review). Practice remains inconsistent milestone to milestone; left open.

### ISSUE-011 — `Links` "transition year sensible" check is a loose union-envelope heuristic, not a real sensibility check
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 4 data-integrity council review
- **Description:** `docs/DATA_MODEL.md` §8 lists "transition year sensible" as a `Links` validation rule. The actual implementation (`tools/wh_data.py` `validate_links`) checks only that the link's `year` falls within `[min(source.start_year, target.start_year), max(source.end_year, target.end_year)]` — the *union* of both boxes' lifespans, not their overlap or adjacency. A link between two boxes centuries apart could still pass this check if the chosen year happened to land inside the wider combined span. Not triggered by any of the current 7 rows (all pass cleanly and are historically accurate), and it's correctly scoped as a WARNING rather than a build-blocking ERROR, but the word "sensible" oversells what's actually verified.
- **Deferred until:** whenever a real subset gets large/varied enough that this heuristic would plausibly miss a genuinely bad link, or general validation-logic cleanup.

### ISSUE-012 — Timeline SVG doesn't re-render on window resize; a few prehistoric-landmark SEAIs can visually detach from their row if the year range is widened enough
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 5 architecture/accessibility council review
- **Description:** Two independent minor gaps in `js/timeline.js`: (1) `renderTimeline()` computes SVG width once per render from `container.clientWidth`; unlike the Sankey/Plotly diagram (`responsive: true`), it only picks up a new width on the next state change, not on a bare window resize. (2) A few `seais.json` rows (e.g. `L15`/`PT_TRIBES` at year -3500, `L18`/`ES_IBERIAN` at -14500, `L21`/`FR_GAUL` at -17000) have a real numeric year that predates their parent box's own `start_year` by thousands of years — a pre-existing quirk in the data, not something `timeline.js` introduced. At the default `-3000..2026` view these are correctly excluded by the ordinary year-range filter, but if a user widens "From year" enough to bring one into view, its diamond marker clamps to the plot's left edge while its parent box's bar sits far to the right, which could read as misattributed.
- **Deferred until:** (1) whenever the timeline gets enough real usage to justify a resize listener; (2) whenever those specific `seais.json` rows are reviewed for whether their year, their parent `box_id`, or both need correcting — likely alongside whatever eventually addresses ISSUE-005's prehistoric-era boxes generally.

### ISSUE-013 — Semantic-zoom time scale changes snap instantly, not smoothly animated
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 7 (Phase 5.5) implementation, `docs/timescaleRequirement.md` § Zoom Interaction
- **Description:** That doc explicitly frames smooth animation while zooming/dragging the time-compression slider or year-range inputs as optional ("if technically practical, animate the layout smoothly"). The current implementation (`js/timeline.js`'s full SVG redraw per state change, `js/sankey.js`'s `applySankeyTimeScale()` via `Plotly.restyle`) recomputes and redraws positions immediately on every `input` event with no transition/tween, so bars, markers, ticks, and Sankey nodes jump to their new position each frame rather than easing.
- **Deferred until:** real usage suggests the instant-snap behavior is actually distracting/hard to track at the current ~198-box, small-Links-subset scale; would likely mean D3 `.transition()` calls in `renderTimeline()` and a Plotly `layout.transition`/animated `restyle` for the Sankey side.

### ISSUE-014 — Time-scale slider's continuous `input` updates re-render every panel, not just the ones that depend on it
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Milestone 7 (Phase 5.5) council review (accessibility/UX lens)
- **Description:** `js/app.js`'s single `store.subscribe` callback re-runs `renderList` (rebuilds the ~198-item box list), `renderInspector`, `renderTimelineView`, `renderAlluvialListSelection`, `renderSankeySelection`, and `renderSankeyTimeScale` on every state change, including the new `#time-scale` slider's `input` event — which can fire many times per second during a drag or a held arrow key. Only `renderTimelineView` and `renderSankeyTimeScale` actually depend on `timeScale`; the rest do redundant work each tick. `docs/timescaleRequirement.md`'s own Performance section recommends updating only x-related geometry where possible. Unlikely to be noticeably slow at the current ~198-box/7-link scale (the pre-existing region/year filters already do a full box-list rebuild on `change`, just far less frequently), but this is the first control wired to a high-frequency event, and the gap is real and unaddressed.
- **Deferred until:** real usage shows jank during a slider drag, or the dataset grows enough (more boxes, a larger `Links` subset) to make the redundant work costly — likely fix is either narrowing what `store.subscribe` re-renders per patch (e.g. a per-field subscription) or `requestAnimationFrame`-throttling the slider's `store.set` calls.

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

### Milestone 4 — Plotly alluvial prototype (Phase 3)
Reviewed against commits `e363906`/`be635c9`/`65f38ab` (branch
`feature/alluvial-prototype`), three lenses:

| Reviewer | Verdict |
|---|---|
| Data / content integrity | PASS_WITH_MINOR_ISSUES |
| Architecture / static-site constraints & accessibility | PASS_WITH_MINOR_ISSUES |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

No gatekeeper findings. Fixed inline (real code/docs changes, not just tabled):
- **No keyboard/AT access to Sankey links** (architecture/accessibility finding): Plotly's SVG hit-targets are mouse-only with no tabindex, and unlike box selection (already a real `<button>` list), a link had no accessible alternative at all. Added `#alluvial-list`, a visually-hidden-but-focusable `<ul>` of real `<button>`s (`.visually-hidden`/`:focus-within` in `css/history.css`) driving the same `selectedLinkId` as a Plotly click.
- **Dark-theme bug** (architecture finding): Plotly's default opaque-white `paper_bgcolor`/`plot_bgcolor` rendered as a stark white rectangle in dark mode. `renderSankey()` now reads the page's own `--bg`/`--fg` CSS custom properties via `getComputedStyle` and passes them into `layout`.
- **`links.json` fetch failure could take down the whole page** (architecture finding): `loadAllData()` originally fetched all tables via one `Promise.all`, so a broken/missing `links.json` — feeding only the peripheral Sankey prototype — would fail the box list, inspector, and region filter too. Split into required (`boxes`/`seais`/`population`/`regions`, still hard-failing) and optional (`links`, defaults to `[]` with a `console.warn`) fetches.
- **NaN edge case** (architecture finding): `buildSankeyFigure()`'s `Math.min(...years)`/`Math.max(...years)` over an empty array (every referenced box has a null `start_year`, per ISSUE-005) would silently produce `NaN` node x-positions (`-Infinity || 1` is still `-Infinity`, a truthy value in JS). Guarded with a length check.
- **Un-awaited Plotly promise** (architecture finding): `renderSankey()` called `Plotly.newPlot` without awaiting it, so an asynchronous rejection (as opposed to a synchronous throw) would bypass `js/app.js`'s intended fallback message and surface only as an unhandled-rejection console warning. Made `renderSankey()` `async`, `await`ed the call, and `await`ed the call site inside the existing try/catch.
- **Misleading UI copy** (process finding): the alluvial section's note didn't disclose that it covers only a 7-row hand-authored subset, not the full dataset. Reworded to name the exact 7 successions.
- **JSDoc gap** (process finding): `buildSankeyFigure()`'s doc comment didn't explain the `arrangement: "fixed"` chronology-preservation rationale. Extended.
- **Opaque validation error** (data-integrity finding): `validate_links()` gave the same generic message for both "missing `relation_type`" and "`relation_type` not in the controlled vocabulary." Split into two distinct messages.

New minor issue filed (tabled, not a gatekeeper): ISSUE-011 (the `Links` "transition year sensible" check is a loose union-envelope heuristic, not a real overlap-adjacency check). ISSUE-004 noted as partially addressed (small Mediterranean/Europe `Links` subset now exists); ISSUE-009 extended for a third recurrence (Node fake-DOM harness verification, again only commit-message/prose, not a committed test file); ISSUE-010 noted as improved (three commits this milestone instead of one or two). Milestone approved to merge to `main`.

**Note (added retroactively during the Milestone 5 review):** this section
was missing from `ISSUES.md` despite `TRACEABILITY.md`'s Milestone 4 section
and commit `09eea5f` ("Milestone 4 council review: reconcile findings, close
out") both referring to it — caught by the Milestone 5 process/docs council
review and backfilled here from that commit's actual history rather than
left broken.

### Milestone 5 — D3 timeline prototype (Phase 4)
Reviewed against commits `d80728f`/`212409b` (branch `feature/timeline-view`),
three lenses:

| Reviewer | Verdict |
|---|---|
| Data / content integrity | PASS_WITH_MINOR_ISSUES |
| Architecture / static-site constraints & accessibility | PASS_WITH_MINOR_ISSUES |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

Two gatekeeper findings, both about this repo's own docs disagreeing with
themselves, both fixed inline rather than tabled — see `TRACEABILITY.md`'s
Milestone 5 council-review note for the full list (reversed year-range bug,
dead SEAI tooltip, wrong evidence numbers/citations, the V1-4 supersession
row, and closing ISSUE-009's recurrence with an actual committed test file,
`js/timeline.test.mjs`, instead of tabling it a fourth time). New minor
issue filed: ISSUE-012 (no resize re-render; a few prehistoric-landmark
SEAIs can visually detach from their row if the year range is widened
enough). ISSUE-005/ISSUE-003 annotated with this milestone's use of them;
ISSUE-010 noted as regressed to two commits. This Milestone 4 section was
also backfilled during this review (see note above). Milestone approved to
merge to `main`.

### Milestone 6 — Cross-panel selection sync (Phase 5)
Reviewed against commit `6e5681a` (branch `feature/shared-interaction`),
three lenses:

| Reviewer | Verdict |
|---|---|
| Correctness & data-fidelity | PASS |
| Accessibility & UX | PASS_WITH_MINOR_ISSUES |
| Architecture & docs/process | PASS_WITH_MINOR_ISSUES |

Two gatekeeper findings, both fixed inline rather than tabled — see
`TRACEABILITY.md`'s Milestone 6 council-review note for the full list
(the Sankey selected-link color-only encoding, and this section's own
missing Milestone 6 note, backfilled now rather than left broken). No new
issue filed. Milestone approved to merge to `main`.

### Milestone 7 — Semantic zoom time scale (Phase 5.5)
Reviewed against commit `887f483` (branch `feature/semantic-zoom-scale`)
vs. `main` at `2df28c3`, three lenses:

| Reviewer | Verdict |
|---|---|
| Correctness & data-fidelity | PASS |
| Accessibility & UX | PASS_WITH_MINOR_ISSUES |
| Architecture & docs/process | PASS |

One gatekeeper finding, fixed inline: `js/timeline.js`'s `formatTickYear`
rendered a tick landing on calendar year 0 as "0 CE" — a year that doesn't
exist under this dataset's own documented BCE/CE convention
(`docs/DATA_MODEL.md`: "There is no attempt to model a historical year
zero"), and the app's own default `-3000..2026` view produces exactly such
a tick. Fixed at the source: `js/timescale.js`'s `timeTicks()` now excludes
an exact-0 candidate (covered by a new `timescale.test.mjs` assertion);
`formatTickYear` itself also now guards year 0 (and the `-0` `Math.round`
can produce) in case it's ever reused for a hover/inspector display of an
exact year, per `docs/timescaleRequirement.md`'s own recommendation.

Minor findings, two fixed inline, two tabled:
- Fixed: `js/sankey.test.mjs` didn't exercise `computeSankeyNodeX`'s
  null-`start_year` fallback (ISSUE-005) with any real data — added a
  synthetic-box case.
- Fixed: `js/timeline.js`'s tick rendering recomputed `scale.yearToX(year)`
  a second time per tick instead of reusing the `x` `buildTimelineLayout`
  already put on each `layout.ticks` entry — simplified to reuse it.
- Tabled as ISSUE-013: smooth animation while zooming/dragging isn't
  implemented — explicitly optional in `docs/timescaleRequirement.md`.
- Tabled as ISSUE-014: the new time-scale slider's `input` listener
  triggers a full re-render of every panel (not just the ones that
  actually depend on `timeScale`) on every drag tick — no debounce/RAF
  throttle exists. Unlikely to matter at the current dataset scale.

ISSUE-010 (milestone commit granularity) noted as regressed further this
milestone (a single commit, where Milestone 4 managed three and Milestone
5/6 managed two) — see that issue's own Milestone 7 note. Milestone
approved to merge to `main`.
