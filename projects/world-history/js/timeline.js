// Timeline view (docs/IMPLEMENTATION_PLAN.md Phase 4). One horizontal bar per
// box, in view, ordered chronologically -- a Gantt-style "descendant of the
// source poster" per docs/VISUALIZATION.md View 1, not yet the poster's own
// vertical-time/lane geometry (BoxSegments doesn't exist yet -- see
// docs/STATUS.md limitation #3 -- so there's no real per-region lane to draw
// beyond box_id order).
//
// Split the same way as js/sankey.js: a pure data transform
// (buildTimelineLayout -- no D3/DOM dependency, Node-testable) and a
// rendering function (renderTimeline -- needs a real browser and the D3 UMD
// build loaded as window.d3).

import { semanticTimeScale, timeTicks } from "./timescale.js";

/**
 * Compute which boxes are in view (region + year-range filtered), their bar
 * extents, and which SEAIs to overlay. `state` is the shared store state
 * (regionFilter, yearStart, yearEnd, showSeais, timeScale); `seaisByBoxId`
 * is js/data.js's index.
 *
 * ISSUE-005: six boxes have no start_year (illegible "c. [BCE]" labels on
 * the source poster). Rather than inventing a coordinate for them the way
 * js/app.js's filteredBoxes() uses Number.NEGATIVE_INFINITY for *sort order*
 * only, this places their bar's start at the left edge of whatever range is
 * currently in view (`approxStart: true`; renderTimeline draws a dashed
 * edge) -- an honest "starts sometime before this," not a fabricated date.
 *
 * Phase 5.5 (docs/timescaleRequirement.md): x-positions are no longer
 * plain linear. `scale` (built here, once, from the current
 * [domainStart, domainEnd, timeScale]) is the single source every
 * time-based element in this view goes through -- box bars, SEAI markers,
 * and axis ticks alike -- per that doc's "Shared Scale" requirement ("do
 * not mix linear placement for some elements with semantic placement for
 * others"). `ticks` is generated in calendar time first (candidate year
 * values), then each is run through the same `scale` -- not the other way
 * around -- per that doc's "Tick Generation" requirement.
 */
export function buildTimelineLayout(boxes, seaisByBoxId, state) {
  const { regionFilter, yearStart, yearEnd, showSeais, timeScale } = state;
  const domainStart = yearStart;
  const domainEnd = yearEnd;
  const scale = semanticTimeScale({ tMin: domainStart, tMax: domainEnd, scaler: timeScale ?? 0 });

  const rows = boxes
    .filter((b) => regionFilter === "all" || b.region_group === regionFilter)
    .map((b) => {
      const approxStart = b.start_year == null;
      const effectiveStart = approxStart ? domainStart : b.start_year;
      const end = b.end_year ?? domainEnd;
      return { box: b, effectiveStart, end, approxStart };
    })
    // Drop boxes entirely outside the visible year range (rather than
    // drawing an off-canvas or zero-width bar for them).
    .filter((r) => r.end >= domainStart && r.effectiveStart <= domainEnd)
    .sort((a, b) => a.effectiveStart - b.effectiveStart || a.end - b.end);

  const rowIndexByBoxId = new Map(rows.map((r, i) => [r.box.box_id, i]));

  // SEAIs without a numeric year (one, as of this dataset -- a text-only
  // year_label like "Natural landmark") are silently skipped here rather
  // than mis-plotted -- same "don't fabricate a coordinate" reasoning as
  // approxStart above.
  const seaiMarkers = showSeais
    ? rows.flatMap((r) => {
        const seais = seaisByBoxId.get(r.box.box_id) || [];
        return seais
          .filter((s) => typeof s.year === "number" && s.year >= domainStart && s.year <= domainEnd)
          .map((s) => ({ seai: s, box_id: r.box.box_id, year: s.year }));
      })
    : [];

  const ticks = timeTicks(domainStart, domainEnd).map((year) => ({ year, x: scale.yearToX(year) }));

  return { domainStart, domainEnd, scale, rows, rowIndexByBoxId, seaiMarkers, ticks };
}

/**
 * Render `layout` (from buildTimelineLayout) into `container` (a DOM
 * element) using the D3 UMD build already loaded as `window.d3` (see
 * index.html). Clicking a bar calls `onSelectBox(boxId)`.
 *
 * `state.linkHighlightBoxIds` (Phase 5, docs/IMPLEMENTATION_PLAN.md): an
 * optional Set of box_ids to mark with the `.link-endpoint` class -- js/app.js
 * fills this in from the selected alluvial link's source/target when one is
 * selected, so choosing a link anywhere still lights something up here even
 * though the timeline has no link geometry of its own to select.
 *
 * The container carries `role="img"` like js/sankey.js's #alluvial, but
 * deliberately has no hidden fallback list of its own: unlike the Sankey
 * links (which had no other accessible representation at all before
 * Milestone 4), every box drawn here is already in the box list panel,
 * which is fully keyboard-operable and drives the same shared
 * `selectedBoxId` -- see index.html's timeline-note paragraph.
 *
 * Phase 5.5: the axis is drawn by hand (a `<line class="domain">` plus one
 * `<g class="tick">` per `layout.ticks` entry) instead of `d3.axisBottom`,
 * which assumes an invertible D3 scale object -- `layout.scale` is a plain
 * `{ yearToX, xToYear, exponent }` (js/timescale.js), not one. Class names
 * match what `d3.axisBottom` would have produced so css/history.css's
 * existing `.timeline-axis .domain`/`.tick line`/`.tick text` rules still
 * apply unchanged.
 */
export function renderTimeline(container, layout, state, { onSelectBox }) {
  if (typeof window === "undefined" || !window.d3) {
    throw new Error("D3 is not loaded (expected window.d3 on the page)");
  }
  const d3 = window.d3;
  const { rows, rowIndexByBoxId, seaiMarkers, scale, ticks } = layout;

  d3.select(container).selectAll("*").remove();

  if (rows.length === 0) {
    d3.select(container).append("p").attr("class", "timeline-empty").text("No boxes in this year range/region.");
    return;
  }

  const rowHeight = 20;
  const margin = { top: 8, right: 16, bottom: 28, left: 8 };
  const width = Math.max(320, container.clientWidth || 800);
  const innerWidth = width - margin.left - margin.right;
  const height = margin.top + margin.bottom + rows.length * rowHeight;

  // A box's real start/end may fall outside the currently filtered range
  // (e.g. the Roman Empire when zoomed into 1000-1500); clamp the drawn bar
  // to the visible plot area instead of letting it run off-canvas. (This
  // also absorbs the rare floating-point overshoot at exactly domainStart/
  // domainEnd -- scale.yearToX there is exactly 0/1, but a tick generated a
  // hair past domainEnd by timeTicks' loop bound could land at e.g. 1.0000001.)
  const xClamped = (year) => Math.min(innerWidth, Math.max(0, scale.yearToX(year) * innerWidth));

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const axisGroup = plot
    .append("g")
    .attr("class", "timeline-axis")
    .attr("transform", `translate(0,${rows.length * rowHeight})`);

  axisGroup.append("line").attr("class", "domain").attr("x1", 0).attr("x2", innerWidth).attr("y1", 0.5).attr("y2", 0.5);

  const tickSel = axisGroup
    .selectAll("g.tick")
    .data(ticks, (d) => d.year)
    .join("g")
    .attr("class", "tick")
    .attr("transform", (d) => `translate(${xClamped(d.year)},0)`);
  tickSel.append("line").attr("y2", 6);
  tickSel
    .append("text")
    .attr("y", 9)
    .attr("dy", "0.71em")
    .attr("text-anchor", "middle")
    .text((d) => formatTickYear(d.year));

  const rowSel = plot
    .selectAll("g.timeline-row")
    .data(rows, (d) => d.box.box_id)
    .join("g")
    .attr("class", "timeline-row")
    .attr("transform", (_, i) => `translate(0,${i * rowHeight})`)
    .style("cursor", "pointer")
    .on("click", (_event, d) => onSelectBox(d.box.box_id));

  const linkHighlightBoxIds = state.linkHighlightBoxIds || null;
  rowSel
    .append("rect")
    .attr(
      "class",
      (d) =>
        "timeline-bar" +
        (d.box.box_id === state.selectedBoxId ? " selected" : "") +
        (linkHighlightBoxIds?.has(d.box.box_id) ? " link-endpoint" : "") +
        (d.approxStart ? " approx-start" : "")
    )
    .attr("x", (d) => xClamped(d.effectiveStart))
    .attr("y", 2)
    .attr("width", (d) => Math.max(2, xClamped(d.end) - xClamped(d.effectiveStart)))
    .attr("height", rowHeight - 6)
    .attr("fill", (d) => d.box.color_hex || "#888888")
    .append("title")
    .text((d) => `${d.box.box_name} (${d.box.start_label ?? "?"}–${d.box.end_label ?? "?"})`);

  // Diamond markers so SEAIs read as a distinct kind of thing from the boxes
  // themselves by shape, not just by sitting on top of a box's color
  // (AGENTS.md accessibility: color isn't the sole encoding).
  plot
    .selectAll("path.seai-marker")
    .data(seaiMarkers, (d) => `${d.box_id}-${d.year}-${d.seai.name}`)
    .join("path")
    .attr("class", "seai-marker")
    .attr("d", d3.symbol(d3.symbolDiamond, 36))
    .attr("transform", (d) => {
      const i = rowIndexByBoxId.get(d.box_id);
      return `translate(${xClamped(d.year)},${i * rowHeight + rowHeight / 2})`;
    })
    .append("title")
    .text((d) => `${d.seai.name} (${d.seai.year_label ?? d.year})`);
}

// docs/timescaleRequirement.md "Axis Labels and Interpretation": "retain
// BCE/CE labels clearly" -- plain negative numbers (the previous
// d3.format("d") behavior) don't read as history at a glance the way a
// labeled era does, and that matters more now that pixel spacing is
// nonlinear and so more easily misread as proportional to elapsed time.
function formatTickYear(year) {
  const rounded = Math.round(year);
  return rounded < 0 ? `${-rounded} BCE` : `${rounded} CE`;
}
