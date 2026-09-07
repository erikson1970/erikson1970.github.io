// Committed, repeatable test for buildTimelineLayout() -- js/timeline.js's
// pure data transform (no D3/DOM dependency, see that file's own comment).
// Run with: node js/timeline.test.mjs
//
// This exists specifically to close ISSUE-009's recurring gap (Milestones
// 2-4 each did real Node-based verification but only wrote it up as
// commit-message/TRACEABILITY.md prose, never a committed test file).
// renderTimeline() itself still isn't covered here -- that needs a real
// browser/DOM and D3, which this environment doesn't have -- so this is a
// partial, not complete, resolution of ISSUE-009 (see ISSUES.md).

import { buildTimelineLayout } from "./timeline.js";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const dataDir = fileURLToPath(new URL("../data/", import.meta.url));
const boxes = JSON.parse(fs.readFileSync(dataDir + "boxes.json"));
const seais = JSON.parse(fs.readFileSync(dataDir + "seais.json"));

const seaisByBoxId = new Map();
for (const s of seais) {
  if (!seaisByBoxId.has(s.box_id)) seaisByBoxId.set(s.box_id, []);
  seaisByBoxId.get(s.box_id).push(s);
}

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok:", msg);
  }
}

// -- Default state (matches js/state.js's initialState()) --
const defaultState = { regionFilter: "all", yearStart: -3000, yearEnd: 2026, showSeais: true, timeScale: 0 };
const layout = buildTimelineLayout(boxes, seaisByBoxId, defaultState);

assert(layout.rows.length > 0, "default state produces some rows");
assert(layout.rows.length <= boxes.length, "rows never exceed box count");

// -- Phase 5.5: shared semantic-zoom scale (docs/timescaleRequirement.md) --
assert(typeof layout.scale?.yearToX === "function", "layout exposes a scale with yearToX");
assert(layout.scale.yearToX(layout.domainStart) === 0, "scale.yearToX(domainStart) === 0");
assert(layout.scale.yearToX(layout.domainEnd) === 1, "scale.yearToX(domainEnd) === 1");
assert(Array.isArray(layout.ticks) && layout.ticks.length > 0, "layout exposes calendar-time-first ticks");
assert(
  layout.ticks.every((t) => typeof t.year === "number" && t.x === layout.scale.yearToX(t.year)),
  "every tick's x matches the shared scale applied to its year"
);
for (let i = 1; i < layout.ticks.length; i++) {
  assert(layout.ticks[i].x > layout.ticks[i - 1].x, "ticks strictly increase in x");
}
// A different timeScale slider value changes p (exponent), so at least one
// row's effectiveStart should map to a different x than at s=0 -- confirms
// buildTimelineLayout actually threads state.timeScale through, not just
// state.yearStart/yearEnd.
{
  const zoomedLayout = buildTimelineLayout(boxes, seaisByBoxId, { ...defaultState, timeScale: 2 });
  assert(zoomedLayout.scale.exponent() !== layout.scale.exponent(), "timeScale changes the scale's exponent");
}

// -- ISSUE-005: exactly the 6 known null-start_year boxes get approxStart --
const approxRows = layout.rows.filter((r) => r.approxStart);
const approxIds = approxRows.map((r) => r.box.box_id).sort();
assert(
  JSON.stringify(approxIds) === JSON.stringify(["AR_INDIG", "AU_INDIG", "CA_INDIG", "JP_JOMON", "UK_CELTIC", "US_INDIG"]),
  `exactly the 6 known ISSUE-005 boxes are approxStart, got ${approxIds}`
);
for (const r of approxRows) {
  assert(r.effectiveStart === defaultState.yearStart, `${r.box.box_id} effectiveStart clamps to domainStart`);
}

// -- Sort order --
for (let i = 1; i < layout.rows.length; i++) {
  assert(layout.rows[i - 1].effectiveStart <= layout.rows[i].effectiveStart, "rows sorted ascending by effectiveStart");
}

// -- Year-range filter: narrowing to 1900-2000 drops every approx-start box,
// since all 6 have a real end_year (-300..1788) before 1900. --
const narrow = buildTimelineLayout(boxes, seaisByBoxId, { regionFilter: "all", yearStart: 1900, yearEnd: 2000, showSeais: true });
assert(narrow.rows.every((r) => r.end >= 1900 && r.effectiveStart <= 2000), "narrow range filters correctly");
assert(narrow.rows.filter((r) => r.approxStart).length === 0, "approx-start boxes excluded once range starts after their real end_year");
assert(narrow.rows.length < layout.rows.length, "narrow range has fewer rows than full range");

// -- Region filter never mixes regions --
const groups = [...new Set(boxes.map((b) => b.region_group).filter(Boolean))];
const oneRegion = groups[0];
const regionLayout = buildTimelineLayout(boxes, seaisByBoxId, { ...defaultState, regionFilter: oneRegion });
assert(regionLayout.rows.every((r) => r.box.region_group === oneRegion), "region filter applies");
assert(regionLayout.rows.length < layout.rows.length, "region filter narrows the set");

// -- showSeais toggle --
const noSeais = buildTimelineLayout(boxes, seaisByBoxId, { ...defaultState, showSeais: false });
assert(noSeais.seaiMarkers.length === 0, "showSeais:false yields zero markers");
assert(layout.seaiMarkers.length > 0, "showSeais:true yields some markers by default");
assert(
  layout.seaiMarkers.every((m) => typeof m.year === "number" && m.year >= layout.domainStart && m.year <= layout.domainEnd),
  "all markers within domain"
);

// -- rowIndexByBoxId matches rows array --
for (const [boxId, idx] of layout.rowIndexByBoxId) {
  assert(layout.rows[idx].box.box_id === boxId, "rowIndexByBoxId matches rows array");
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll assertions passed.");
