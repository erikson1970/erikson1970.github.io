# Issues

Open-issue tracker for the World History Explorer project.

Severity:

- **Gatekeeper** — blocks closing the current milestone. Must be fixed or explicitly downgraded before merging the milestone branch to `main`.
- **Minor** — tabled. Tracked but does not block milestone closure.

Status: `Open`, `Tabled`, `Resolved`.

An issue closed by a milestone council review notes which review closed it.

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

## Resolved

### ISSUE-000 — Repo contained an unrelated portfolio template and stray files
- **Severity:** Gatekeeper
- **Status:** Resolved
- **Description:** `index.html` and `static/` held a generic "Portfolio template" theme (Lorem Ipsum, fake bios) unrelated to this project; `HotelList.txt` (personal hotel-search links) and `chat_log.md` (dead sandbox links from doc handoff) were also present.
- **Resolution:** Removed `static/`, `HotelList.txt`, `chat_log.md`; replaced `index.html` with a minimal placeholder. Closed by Milestone 0 council review.

### ISSUE-005 — Six `Boxes` rows have no `start_year`
- **Severity:** Minor
- **Status:** Tabled
- **Source:** Data-integrity council review of `source/world_history_chart_dataset_v2.xlsx`
- **Description:** A handful of "Indigenous Era" boxes (e.g. `US_INDIG`, `CA_INDIG`, `AR_INDIG`, `AU_INDIG`) have a null `start_year` because the poster prints an illegible "c. [BCE]" with no parseable number there. `end_year` is always present, and `DATA_MODEL.md`'s rule only requires `start_year <= end_year` "when both exist," so this is not a validation-rule violation — just an open transcription gap, consistent with STATUS.md limitation #2.
- **Resolution:** None yet. Left for whoever transcribes those boxes' start dates, or for the build script to render them with an explicit "unknown start" treatment.

## Milestone council reviews

### Milestone 0 — Repository reset & data intake
Reviewed 2026-09-06 against commit `3f84688` (branch `feature/repo-reset`), three lenses:

| Reviewer | Verdict |
|---|---|
| Data integrity | PASS |
| Static-site architecture / constraints | PASS |
| Process & documentation consistency | PASS_WITH_MINOR_ISSUES |

No gatekeeper findings. The process/docs reviewer's minor findings (severity-field enum drift on a resolved issue, no per-entry `Status:` field, ambiguity in `AGENTS.md`'s milestone-review process) were fixed inline in this document and in `AGENTS.md` rather than filed as separate issues. Milestone approved to merge to `main`.
