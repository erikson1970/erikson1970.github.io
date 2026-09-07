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
are left as originally recorded rather than rewritten. This also applies to
`README.md` section citations below (e.g. "README.md § Recommended site
structure", "§ Data authority", "§ core idea"): that content moved wholesale
to `projects/world-history/README.md` in Milestone 3 — the root `README.md`
today only has `## Structure` and `## Projects` sections. Follow the cited
section name into `projects/world-history/README.md` instead.

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
| M3-4 | Moved project verified functional at its new nested path | Process norm (established Milestone 1/2) | Partial | Local static server + `curl` against `projects/world-history/`, `css/history.css`, `js/app.js`, `data/boxes.json` (independently reproduced by the Milestone 3 path/link-integrity council reviewer); `python3 tools/validate_data.py` run from `projects/world-history/` (671 warnings, 0 errors, unchanged — independently reproduced); a Node `loadAllData()` run against the moved JSON was also performed (198/83/390/89 rows, unchanged) but, like the Milestone 2 runtime checks (see M2-9, ISSUE-009), was not captured as a committed, repeatable test file — downgraded from Met to Partial for this sub-claim during Milestone 3 reconciliation |
| M3-5 | `ISSUES.md`/`TRACEABILITY.md` kept shared at repository root, one continuous history | User request (explicit choice over per-project split) | Met | Neither file moved; both got a "Path note" explaining pre-Milestone-3 entries reference now-superseded root-relative paths |
| M3-6 | `AGENTS.md`/`README.md` updated to describe the new structure | Process norm (docs must match reality) | Met | `AGENTS.md` gained a "Repository structure" section and updated paths throughout; root `README.md` rewritten for the personal-site framing; old `README.md` moved to `projects/world-history/README.md` with a historical note added |
| M3-7 | No production backend/DB/auth/API keys introduced | AGENTS.md § Project intent | Met | Restructure introduced only static HTML/CSS and doc changes |

### Milestone 3 council review

Reviewed 2026-09-06 against commit `ce8b234`: path & link integrity PASS,
static-site architecture/constraints & accessibility PASS_WITH_MINOR_ISSUES,
process & documentation consistency PASS_WITH_MINOR_ISSUES. No gatekeeper
findings; a missing project-card heading and a missing font preconnect were
fixed inline, stale `README.md` section citations were addressed by
extending the Path note above, and M3-4 was downgraded to Partial to match
its actual evidence — see `ISSUES.md` § Milestone council reviews. Merged to
`main`.

## Milestone 4 — Plotly alluvial prototype (Phase 3)

Goal (`docs/IMPLEMENTATION_PLAN.md` Phase 3): create a minimal `Links` table
for a small subset and a Sankey/alluvial view over it, with nodes ordered
chronologically, clickable links, selected-node-updates-inspector, and the
page remaining static.

| Req | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| M4-1 | Minimal `Links` table for a chosen subset | IMPLEMENTATION_PLAN.md Phase 3 | Met | 7-row Links sheet added to the workbook covering the Mediterranean/Europe candidate list (all 9 named boxes: Roman Empire, Western Roman Empire, Byzantine Empire, Frankish Kingdom, West Francia, Kingdom of France, East Francia, Holy Roman Empire, Ottoman Empire); China cluster deliberately left for a later pass (see ISSUE-004 note) |
| M4-2 | `Links` fields match `DATA_MODEL.md` §5 | docs/DATA_MODEL.md | Met | `link_id`, `source_box_id`, `target_box_id`, `year`, `relation_type`, `weight_basis`, `confidence`, `source_url`, `notes` all present; `relation_type` drawn from the recommended vocabulary |
| M4-3 | Build/validation extended to cover `Links` | docs/DATA_MODEL.md §8, IMPLEMENTATION_PLAN.md Phase 1 | Met | `validate_links()` in `tools/wh_data.py`: checks `link_id` uniqueness, source/target FK existence against `Boxes`, malformed year, `relation_type` membership (classified as ERROR, not the file's usual WARNING-for-vocabulary default, per Phase 1's explicit "fails on unknown relation types"); year-outside-combined-span is a WARNING. `build_data.py` writes `data/links.json`. Verified: clean run unchanged at 671 warnings/0 errors (Links adds none); a deliberately corrupted `relation_type` and a broken FK were each independently confirmed to block the build (ERROR, exit 1, no output written) |
| M4-4 | M1-6 ("fails on unknown relation types"), previously Not started, now actually testable | IMPLEMENTATION_PLAN.md Phase 1 | Met | See M4-3; M1-6 above should be read as superseded by this row now that `Links` exists |
| M4-5 | Nodes ordered chronologically | IMPLEMENTATION_PLAN.md Phase 3 acceptance criteria | Met | `buildSankeyFigure()` in `js/sankey.js` derives node `x` from `start_year` (clamped `[0.02, 0.98]`) and passes `arrangement: "fixed"` to Plotly, which strictly enforces the given coordinates instead of auto-laying-out nodes (AGENTS.md § Visualization semantics forbids auto-reordering); verified via a Node unit test against real generated data confirming monotonic x-ordering |
| M4-6 | Links clickable | IMPLEMENTATION_PLAN.md Phase 3 acceptance criteria | Partial | `renderSankey()` wires a `plotly_click` handler that distinguishes link clicks (`point.source`/`point.target` present) from node clicks and calls `onSelectLink`/`onSelectBox` accordingly; the pure event-routing logic and `js/app.js` wiring were verified. A real, independently-verified click path also exists via the `#alluvial-list` keyboard/AT alternative (see M4-11), which calls the identical `onSelectLink`/store code and was confirmed end-to-end in the fake-DOM harness. Still Partial because the Plotly chart's own `plotly_click` firing on a real rendered SVG could not be exercised in this environment (no browser) — see M4-8 |
| M4-7 | Selected node/link updates inspector | IMPLEMENTATION_PLAN.md Phase 3 acceptance criteria | Met | `js/app.js`: `onSelectBox`/`onSelectLink` callbacks set `selectedBoxId`/`selectedLinkId` (mutually exclusive) on the shared store; `renderInspector` branches to `renderLinkInspector` when a link is selected, showing source → target, year, relation type, confidence, notes, source URL. Verified end-to-end for both the box-click path and the link-click path (via `#alluvial-list`, see M4-11) in the fake-DOM harness — this row covers the store/render logic itself, which is fully exercised regardless of which UI element triggers it (chart vs. fallback list); the *chart's own* click-firing is M4-6's remaining caveat |
| M4-8 | Page remains static (no backend, no build step at runtime) | IMPLEMENTATION_PLAN.md Phase 3 acceptance criteria, AGENTS.md § Project intent | Partial | Plotly loaded via a pinned-version CDN `<script>` (`cdn.plot.ly/plotly-2.35.2.min.js`, reachability verified with `curl -I`); `renderSankey()` call in `main()` is `await`ed inside a try/catch (covering both a synchronous throw and an async `Plotly.newPlot` rejection) so a CDN/offline failure degrades to a text fallback rather than breaking the rest of the page. `links.json` itself is now fetched separately from the required tables (see M4-12) so even a broken/missing Links file can't take down the box list/inspector/filter either. Verified via a Node fake-DOM harness (fetch redirected to a local static server, deliberately no `window.Plotly` to exercise the fallback path): data loads, summary renders, 198 boxes render, region filter (13 options) narrows the list, box click and `#alluvial-list` link click both populate the inspector correctly, filter change resets it, and the alluvial container shows the expected caught fallback message. Marked Partial because this environment has no real browser to confirm actual Plotly chart rendering or genuine `plotly_click` firing — the fallback path and all non-Plotly wiring are the parts that are Met |
| M4-9 | Accessible alternative for a chart with no native text alternative | AGENTS.md § accessibility | Met | `<div id="alluvial" role="img" aria-label="...">` plus `aria-describedby` pointing at a visually-hidden, keyboard-focusable `#alluvial-list` of real `<button>`s (one per link: source → target, year, relation type) that call the same `onSelectLink` path as a chart click. Added during Milestone 4 council reconciliation after the architecture/accessibility reviewer noted the original `role="img"`/`aria-label`-only treatment gave AT/keyboard users no way to browse or select individual links, unlike the box list's real `<button>` pattern (M2-7). `.visually-hidden:focus-within` (`css/history.css`) makes a focused item visible rather than only technically present in the DOM. Verified via the fake-DOM harness: 7 items render, and simulating a click on the first one correctly populates the inspector. Ribbon-width caveat (equal-weight placeholder, not population-based) stated in visible text above the chart too, not just the aria-label |
| M4-10 | No production backend/DB/auth/API keys introduced | AGENTS.md § Project intent | Met | Phase 3 added only a workbook sheet, Python validation code, generated JSON, and static JS/CSS/HTML; the Plotly CDN script is a static asset load, not a backend dependency |
| M4-11 | Chart theme consistency and defensive-coding gaps closed during reconciliation | Milestone 4 architecture/accessibility council review | Met | Three findings fixed inline: (1) `renderSankey()` now reads `--bg`/`--fg` off `:root` via `getComputedStyle` and sets `paper_bgcolor`/`plot_bgcolor`/`font.color` so the chart matches the page's light/dark theme instead of always rendering an opaque white rectangle; (2) `buildSankeyFigure()` guards the case where no referenced box has a numeric `start_year` — an empty `years` array previously produced `Math.min()`/`Math.max()` of `+Infinity`/`-Infinity`, and `-Infinity || 1` still evaluates to `-Infinity` (truthy in JS), silently yielding `NaN` node x-positions; now falls back to `0`/`0` when the array is empty; (3) `renderSankey()` is now `async` and its caller `await`s it, so an asynchronous `Plotly.newPlot` rejection is caught by `js/app.js`'s try/catch instead of becoming an unhandled promise rejection |
| M4-12 | `links.json` load failure isolated from the required-data load | Milestone 4 architecture/accessibility council review | Met | `js/data.js`'s `loadAllData()` previously fetched `links.json` in the same `Promise.all` as `boxes`/`seais`/`population`/`regions`, so a single broken/missing Links file would reject the whole call and show "Failed to load data," taking down the box list/inspector/filter too. Split into required (`FILES`, hard-fails) and optional (`OPTIONAL_FILES`, catches and defaults to `[]` with a `console.warn`) — matching the graceful-degradation principle already established for the Plotly-load failure itself (M4-8) |

### Milestone 4 council review

Reviewed 2026-09-06 against commit `65f38ab` (branch `feature/alluvial-prototype`),
three lenses:

| Reviewer | Verdict |
|---|---|
| Data integrity | PASS_WITH_MINOR_ISSUES |
| Static-site architecture/constraints & accessibility | PASS_WITH_MINOR_ISSUES |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

No gatekeeper findings. Fixed inline: a real accessibility gap (the Plotly
widget alone gave AT/keyboard users no way to browse or select a link —
added the `#alluvial-list` keyboard-focusable fallback, M4-9); a real
theme-consistency bug (Plotly chart ignoring the page's dark mode, M4-11); a
real robustness gap (a broken `links.json` could take down the whole page,
not just the alluvial section, M4-12); a latent `NaN`-node-position edge
case and an un-awaited `Plotly.newPlot` promise (both M4-11); a misleading
alluvial-note sentence that read as one chained succession rather than 7
discrete links (`index.html`); a JSDoc gap (`linksById` missing from
`loadAllData`'s comment); and an opaque validation error message for a
missing `relation_type` (now says "missing relation_type" instead of
"relation_type None not in [...]"). Tabled as new minor issues rather than
fixed: ISSUE-011 (the `DATA_MODEL.md` §8 "transition year sensible" check is
a loose union-envelope heuristic, not a real sensibility check). Extended
existing entries: ISSUE-009 (this is the third milestone where runtime JS
verification was performed but not committed as a repeatable test file);
ISSUE-010 (commit granularity improved to 3 commits this milestone, still
not fully resolved). M4-6/M4-7/M4-8 wording reconciled so a Partial rating
doesn't overclaim what's actually verified — see `ISSUES.md` § Milestone
council reviews. Merged to `main`.

## Milestone 5 — D3 timeline prototype (Phase 4)

Goal (`docs/IMPLEMENTATION_PLAN.md` Phase 4): render source-poster-inspired
boxes from `Boxes` as an SVG timeline, with correct dates, matching colors,
click selection, date zoom/filter, and SEAI overlay.

| Req | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| M5-1 | Boxes render at correct dates | IMPLEMENTATION_PLAN.md Phase 4 acceptance criteria | Met | `buildTimelineLayout()` in `js/timeline.js` maps each in-view box to `{effectiveStart, end}`; `renderTimeline()` draws a `d3.scaleLinear` x-axis over `[yearStart, yearEnd]` and positions each bar accordingly. Verified by `js/timeline.test.mjs` (committed, run with `node js/timeline.test.mjs`) against the real generated `data/boxes.json`: rows sort ascending by `effectiveStart`, narrowing the year range correctly drops boxes entirely outside it, and region filtering never mixes regions |
| M5-2 | Colors match source data | IMPLEMENTATION_PLAN.md Phase 4 acceptance criteria | Met | Bar `fill` is `box.color_hex` directly (same field the box list's swatch already uses), falling back to a neutral gray only if a box is missing one |
| M5-3 | Click selection works | IMPLEMENTATION_PLAN.md Phase 4 acceptance criteria | Partial | `renderTimeline()` wires a click handler on each row's `<g>` calling `onSelectBox(box.box_id)`, which `js/app.js` routes to the same shared `selectedBoxId` the box list uses (mutually exclusive with `selectedLinkId`, matching the existing pattern). The event-routing/store logic was code-reviewed against the identical, already-verified pattern in `js/sankey.js`/`js/app.js`; unlike Milestone 4, this round did not rebuild the fake-DOM harness to simulate an actual click event on a rendered D3 element (cost-conscious tradeoff this milestone — see council review note below), so real click-firing on the rendered SVG is unverified in this environment |
| M5-4 | Date zoom/filter works | IMPLEMENTATION_PLAN.md Phase 4 acceptance criteria | Met | Plain `<input type="number">` "From year"/"To year" controls (not a D3 brush — chosen specifically because a brush needs real mouse-drag events this no-browser environment can't simulate, whereas a number input's `change` event and resulting `buildTimelineLayout()` output are Node-testable) drive `state.yearStart`/`yearEnd`, with a guard in `js/app.js` rejecting a reversed range (`yearStart > yearEnd`) before it ever reaches the store — `d3.scaleLinear` doesn't throw on one, it just silently draws chronology backwards. Verified by `js/timeline.test.mjs`: narrowing the range to 1900–2000 removes every box whose `end_year` predates it or whose real/effective start postdates it |
| M5-5 | SEAIs can be overlaid | IMPLEMENTATION_PLAN.md Phase 4 acceptance criteria | Met | `buildTimelineLayout()` builds `seaiMarkers` from `seaisByBoxId`, filtered to the current year range and gated on `state.showSeais` (wired to a checkbox); `renderTimeline()` draws each as a `d3.symbolDiamond` path — a distinct shape, not just a color dot, per AGENTS.md's "color isn't the sole encoding." Verified by `js/timeline.test.mjs`: `showSeais:false` yields zero markers, `showSeais:true` yields a nonempty set, and every marker's year falls within the current domain |
| M5-6 | ISSUE-005 boxes (no legible start date) don't get a fabricated coordinate | AGENTS.md § Historical-data discipline; docs/STATUS.md limitation #2 | Met | The 6 null-`start_year` boxes get `approxStart: true` and an `effectiveStart` pinned to the current view's left edge (`state.yearStart`), not an invented year; `renderTimeline()` draws these with a dashed (`stroke-dasharray`) stroke — the whole bar's outline, not literally just its left edge (an SVG `<rect>` doesn't support per-side dashing without extra path work). Verified by `js/timeline.test.mjs`: exactly the 6 known ISSUE-005 boxes (`US_INDIG`, `CA_INDIG`, `AR_INDIG`, `AU_INDIG`, `UK_CELTIC`, `JP_JOMON`) carry `approxStart`, all six clamp to `domainStart`, and all six correctly drop out once the visible range starts after their real `end_year` (confirmed with a 1900–2000 window; their actual `end_year`s range from **-300** (`JP_JOMON`) to 1788 (`AU_INDIG`), not 43–1788 as an earlier draft of this row incorrectly stated) |
| M5-7 | Page remains static; D3 CDN failure degrades gracefully | IMPLEMENTATION_PLAN.md Phase 4, AGENTS.md § Project intent | Partial | D3 loaded via a pinned-version CDN `<script>` (`cdnjs.cloudflare.com/.../d3/7.9.0/d3.min.js`, reachability verified with `curl -I`); `renderTimelineView()` in `js/app.js` wraps `renderTimeline()` in a plain synchronous try/catch (simpler than the Sankey pattern, M4-8, since `renderTimeline()` has no promises to await) so a missing `window.d3` shows a text fallback instead of breaking the rest of the page. `buildTimelineLayout()` itself has no D3/DOM dependency at all and is directly unit-tested by `js/timeline.test.mjs`. Marked Partial for the same reason as M4-8: no real browser in this environment to confirm actual D3 SVG rendering or genuine click-firing |
| M5-8 | No independent hidden-list fallback for the timeline chart (deliberate, documented) | AGENTS.md § Accessibility | Met | Unlike `#alluvial-list` (M4-9), the timeline intentionally has no hidden-button mirror of its own: `js/app.js`'s `filteredBoxes()` (box list) filters only by region, while `buildTimelineLayout()` filters by region *and* year range, so the box list is always a superset of what the timeline draws for any filter combination — every box shown here is already in the box list, which is fully keyboard-operable and drives the identical `selectedBoxId`. `#timeline` still carries `role="img"`/`aria-label`, and both `index.html`'s visible `.timeline-note` and this table's reasoning state the justification explicitly, so the omission reads as a decision, not an oversight |
| M5-9 | No production backend/DB/auth/API keys introduced | AGENTS.md § Project intent | Met | Phase 4 added only static JS/CSS/HTML, a pinned CDN script load, and a `package.json` (`{"type":"module"}`, needed only so Node can run `js/timeline.test.mjs` — it changes nothing about how the browser loads the site) |

### Milestone 5 council review

Reviewed against commits `d80728f`/`212409b` (branch `feature/timeline-view`),
three lenses:

| Reviewer | Verdict |
|---|---|
| Data / content integrity | PASS_WITH_MINOR_ISSUES |
| Architecture / static-site constraints & accessibility | PASS_WITH_MINOR_ISSUES |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

No lens found a data-corruption or accessibility gatekeeper defect; the process
lens flagged two gatekeepers, both about this document and `ISSUES.md`
disagreeing with themselves, and both fixed inline below rather than tabled:

- **This table's own "v0.1 definition of done" section still said V1-4
  ("Simple timeline") was "Not started"** in the same commit that added this
  Milestone 5 section claiming M5-1 "Met" — fixed by superseding V1-4 below,
  the same way V1-3 was updated after Milestone 4.
- **ISSUE-009 (no committed test suite for `js/`) was not extended for what
  would have been its 4th recurrence** — this time actually fixed rather than
  re-tabled: `js/timeline.test.mjs` is now a committed, repeatable test for
  `buildTimelineLayout()` (run with `node js/timeline.test.mjs`; a
  `package.json` with `"type": "module"` was added so Node can load it and
  `./timeline.js` directly, no scratch-copy workaround needed). This closes
  the gap for `timeline.js` specifically — `sankey.js`, `app.js`, `data.js`,
  and `state.js` remain uncovered, so ISSUE-009 stays open with a note
  rather than resolved outright. `renderTimeline()`'s actual D3/DOM behavior
  and real click-firing are still unverified in this no-browser environment
  (see M5-3/M5-7 above) — the new test only covers the pure half.

Also fixed inline (real code changes, not just tabled):
- **Reversed year-range bug** (architecture finding): setting "From year" >
  "To year" didn't crash, but `d3.scaleLinear` silently drew the axis and
  every bar's chronology right-to-left with no warning — a real, if
  non-crashing, violation of AGENTS.md's "chronology must remain
  semantically correct." `js/app.js`'s year-input handlers now reject (and
  visually revert) a change that would put `yearStart` past `yearEnd` or
  vice versa, before it ever reaches the store.
- **Dead SEAI tooltip** (architecture finding): `.seai-marker`'s
  `pointer-events: none` in `css/history.css` meant the diamond's `<title>`
  tooltip (added in `renderTimeline()`) could never actually receive a
  hover. Removed the `pointer-events: none` rule.
- **Wrong evidence numbers and citations** (data-integrity and process
  findings, both independently caught the same errors): M5-6's stated
  `end_year` range for the six ISSUE-005 boxes ("43–1788") omitted
  `JP_JOMON`'s -300 and its "dashed left edge" description overstated what
  the CSS actually draws; its `AGENTS.md` citation ("§ data honesty") didn't
  match any real heading. All three corrected above.
- **Imprecise code comment** (data-integrity finding): `js/timeline.js`'s
  comment describing how many SEAIs lack a numeric year said "a handful";
  the real dataset has exactly one. Corrected.

Tabled as new minor issues (not gatekeepers): **ISSUE-012** (no resize
re-render for the timeline SVG, unlike the Sankey diagram's
`responsive: true`; a handful of prehistoric-landmark SEAIs whose real year
predates their parent box's own span by millennia can visually detach from
their row if a user widens "From year" far enough to bring them into view).
Also updated inline: `ISSUE-005`/`ISSUE-003` now note this milestone's use
of them (matching the existing `ISSUE-004` pattern); `ISSUE-010` notes
Milestone 5 landed as 2 commits, back from Milestone 4's 3. Milestone
approved to merge to `main`. See `ISSUES.md` § Milestone council reviews for
the full write-up (also backfilled there: a Milestone 4 section that should
have existed already but didn't, caught during this review).

## v0.1 definition of done (forward-looking; not yet in scope)

Tracked here so later milestones can check items off against `AGENTS.md`'s
"Definition of done for v0.1" without re-deriving the list.

| Req | Requirement | Status |
|---|---|---|
| V1-1 | Runs as a static site | Met (Milestone 2) |
| V1-2 | Loads generated JSON | Met (Milestone 2) |
| V1-3 | Interactive chronological Sankey/alluvial subset | Partial (Milestone 4, small 7-link Mediterranean/Europe subset; see M4-6/M4-8 caveats) |
| V1-4 | Simple timeline | Partial (Milestone 5; a first D3 Gantt-style bar-per-box timeline exists with click selection, year-range filter, and SEAI overlay — see M5-1..M5-9 — but not yet the poster's own lane/segment geometry or population-based width) |
| V1-5 | Select a historical box | Met (Milestone 2 box-list; Milestone 4 adds alluvial node/link selection for the Links subset, see M4-6) |
| V1-6 | Updates an inspector | Met (Milestone 2) |
| V1-7 | At least one region filter | Met (Milestone 2) |
| V1-8 | Deployable to GitHub Pages | Met (live since Milestone 0; Milestone 2 content not yet merged to `main`) |
