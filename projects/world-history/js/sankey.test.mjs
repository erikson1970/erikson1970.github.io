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

import { buildSankeyFigure, computeSankeyHighlight } from "./sankey.js";
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

// -- buildSankeyFigure --
const figure = buildSankeyFigure(links, boxesById);
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

const someLinkId = links[0].link_id;
const linkSel = computeSankeyHighlight(links, figure.boxIds, { selectedBoxId: null, selectedLinkId: someLinkId }, colors);
assert(linkSel.linkColor[0] === colors.accent, "selected link is accent-colored");
assert(linkSel.linkColor.slice(1).every((c) => c === colors.muted), "every other link stays muted");
assert(linkSel.nodeLineWidth.every((w) => w === 0), "selecting a link (not a box) leaves every node line width 0");

// -- A box_id/link_id that isn't in this subset at all highlights nothing --
const nothingSel = computeSankeyHighlight(links, figure.boxIds, { selectedBoxId: "NOT_A_REAL_BOX", selectedLinkId: "NOT_A_REAL_LINK" }, colors);
assert(nothingSel.nodeLineWidth.every((w) => w === 0), "unknown selectedBoxId highlights nothing");
assert(nothingSel.linkColor.every((c) => c === colors.muted), "unknown selectedLinkId highlights nothing");

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll assertions passed.");
