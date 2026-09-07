// Committed, repeatable test for sankey.js's two pure functions --
// buildSankeyFigure (Phase 3) and computeSankeyHighlight (Phase 5). No
// D3/Plotly/DOM dependency, see those functions' own comments.
// Run with: node js/sankey.test.mjs
//
// Closes another instance of the same ISSUE-009 gap js/timeline.test.mjs
// closed for timeline.js -- this is the first committed test for
// sankey.js. renderSankey()/applySankeySelection() themselves still aren't
// covered here -- that needs a real browser/DOM and Plotly, which this
// environment doesn't have -- so this is a partial, not complete,
// resolution of ISSUE-009 (see ISSUES.md).

import { buildSankeyFigure, computeSankeyHighlight, computeSankeyNodeX } from "./sankey.js";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const dataDir = fileURLToPath(new URL("../data/", import.meta.url));
const boxes = JSON.parse(fs.readFileSync(dataDir + "boxes.json"));
const links = JSON.parse(fs.readFileSync(dataDir + "links.json"));
const boxesById = new Map(boxes.map((b) => [b.box_id, b]));

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok:", msg);
  }
}

// -- buildSankeyFigure (Phase 5.5: node x now comes from the shared,
// app-wide semantic-zoom scale -- state, matching js/state.js's
// initialState() defaults -- not a per-subset min/max) --
const defaultState = { yearStart: -3000, yearEnd: 2026, timeScale: 0 };
const figure = buildSankeyFigure(links, boxesById, defaultState);
assert(figure.boxIds.length > 0, "buildSankeyFigure finds some boxIds from the links subset");
assert(
  new Set(figure.boxIds).size === figure.boxIds.length,
  "boxIds has no duplicates (each box appears once regardless of how many links touch it)"
);
assert(figure.data[0].link.source.length === links.length, "one link entry per row in links.json");
assert(figure.data[0].node.x.every((x) => x >= 0 && x <= 1), "every node x is normalized into [0,1]");
// AGENTS.md "chronology must remain semantically correct": node x-order
// should match start_year order among boxes that have one.
const xByBox = figure.boxIds.map((id, i) => ({ id, x: figure.data[0].node.x[i], start: boxesById.get(id)?.start_year }));
const dated = xByBox.filter((b) => typeof b.start === "number").sort((a, b) => a.start - b.start);
for (let i = 1; i < dated.length; i++) {
  assert(dated[i - 1].x <= dated[i].x, `node x-order matches start_year order (${dated[i - 1].id} before ${dated[i].id})`);
}

// -- computeSankeyNodeX: shares its result with what buildSankeyFigure put
// into node.x above (same function, called with the same args) --
{
  const nodeX = computeSankeyNodeX(figure.boxIds, boxesById, defaultState);
  assert(
    nodeX.every((x, i) => x === figure.data[0].node.x[i]),
    "computeSankeyNodeX matches buildSankeyFigure's node.x for the same state"
  );
  // Changing timeScale changes the exponent, so at least one node (a box not
  // at yearStart or yearEnd exactly) should move.
  const zoomedX = computeSankeyNodeX(figure.boxIds, boxesById, { ...defaultState, timeScale: 2 });
  assert(zoomedX.some((x, i) => x !== nodeX[i]), "computeSankeyNodeX responds to a timeScale change");

  // ISSUE-005: a box with no start_year (none of data/links.json's current
  // subset has one, so this exercises the fallback with a synthetic box
  // rather than real data) falls back to state.yearStart, same "don't
  // fabricate a date" reasoning as js/timeline.js's approxStart -- not
  // some other placeholder that could land it off-screen or at a
  // misleadingly specific position (council review minor finding: this
  // branch was previously untested).
  const syntheticBoxesById = new Map(boxesById);
  syntheticBoxesById.set("NO_START_YEAR", { box_id: "NO_START_YEAR", start_year: null });
  const withUndated = computeSankeyNodeX([...figure.boxIds, "NO_START_YEAR"], syntheticBoxesById, defaultState);
  assert(Number.isFinite(withUndated.at(-1)), "a box with no start_year still gets a finite node x");
  assert(
    Math.abs(withUndated.at(-1) - Math.min(0.98, Math.max(0.02, 0))) < 1e-9,
    "a box with no start_year lands at the clamped left edge (state.yearStart)"
  );
}

// -- computeSankeyHighlight --
const colors = { accent: "#accent", muted: "#muted" };
const none = computeSankeyHighlight(links, figure.boxIds, { selectedBoxId: null, selectedLinkId: null }, colors);
assert(none.nodeLineWidth.every((w) => w === 0), "no selection -> every node line width is 0");
assert(none.linkColor.every((c) => c === colors.muted), "no selection -> every link is muted");

const someBoxId = figure.boxIds[0];
const boxSel = computeSankeyHighlight(links, figure.boxIds, { selectedBoxId: someBoxId, selectedLinkId: null }, colors);
assert(
  boxSel.nodeLineWidth[figure.boxIds.indexOf(someBoxId)] === 3,
  "selected box's node line width is 3"
);
assert(
  boxSel.nodeLineWidth.filter((w) => w === 3).length === 1,
  "exactly one node is highlighted for a single selected box"
);
assert(boxSel.linkColor.every((c) => c === colors.muted), "selecting a box (not a link) leaves every link muted");

// A selected link also outlines its two endpoint nodes (not just the link's
// own color) -- a Sankey link has no non-color channel of its own, so
// without this a selected link would be encoded by color alone (council
// review gatekeeper finding, AGENTS.md "color isn't the sole encoding").
const someLink = links[0];
const linkSel = computeSankeyHighlight(links, figure.boxIds, { selectedBoxId: null, selectedLinkId: someLink.link_id }, colors);
assert(linkSel.linkColor[0] === colors.accent, "selected link is accent-colored");
assert(linkSel.linkColor.slice(1).every((c) => c === colors.muted), "every other link stays muted");
const endpointIndices = [someLink.source_box_id, someLink.target_box_id].map((id) => figure.boxIds.indexOf(id));
assert(
  endpointIndices.every((i) => linkSel.nodeLineWidth[i] === 3),
  "a selected link's two endpoint nodes are outlined"
);
assert(
  linkSel.nodeLineWidth.filter((w) => w === 3).length === endpointIndices.length,
  "only the selected link's own endpoints are outlined, nothing else"
);

// -- A box_id/link_id that isn't in this subset at all highlights nothing --
const nothingSel = computeSankeyHighlight(links, figure.boxIds, { selectedBoxId: "NOT_A_REAL_BOX", selectedLinkId: "NOT_A_REAL_LINK" }, colors);
assert(nothingSel.nodeLineWidth.every((w) => w === 0), "unknown selectedBoxId highlights nothing");
assert(nothingSel.linkColor.every((c) => c === colors.muted), "unknown selectedLinkId highlights nothing");

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll assertions passed.");
