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

/**
 * Compute which boxes are in view (region + year-range filtered), their bar
 * extents, and which SEAIs to overlay. `state` is the shared store state
 * (regionFilter, yearStart, yearEnd, showSeais); `seaisByBoxId` is
 * js/data.js's index.
 *
 * ISSUE-005: six boxes have no start_year (illegible "c. [BCE]" labels on
 * the source poster). Rather than inventing a coordinate for them the way
 * js/app.js's filteredBoxes() uses Number.NEGATIVE_INFINITY for *sort order*
 * only, this places their bar's start at the left edge of whatever range is
 * currently in view (`approxStart: true`; renderTimeline draws a dashed
 * edge) -- an honest "starts sometime before this," not a fabricated date.
 */
export function buildTimelineLayout(boxes, seaisByBoxId, state) {
  const { regionFilter, yearStart, yearEnd, showSeais } = state;
  const domainStart = yearStart;
  const domainEnd = yearEnd;

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

  return { domainStart, domainEnd, rows, rowIndexByBoxId, seaiMarkers };
}

/**
 * Render `layout` (from buildTimelineLayout) into `container` (a DOM
 * element) using the D3 UMD build already loaded as `window.d3` (see
 * index.html). Clicking a bar calls `onSelectBox(boxId)`.
 *
 * The container carries `role="img"` like js/sankey.js's #alluvial, but
 * deliberately has no hidden fallback list of its own: unlike the Sankey
 * links (which had no other accessible representation at all before
 * Milestone 4), every box drawn here is already in the box list panel,
 * which is fully keyboard-operable and drives the same shared
 * `selectedBoxId` -- see index.html's timeline-note paragraph.
 */
export function renderTimeline(container, layout, state, { onSelectBox }) {
  if (typeof window === "undefined" || !window.d3) {
    throw new Error("D3 is not loaded (expected window.d3 on the page)");
  }
  const d3 = window.d3;
  const { domainStart, domainEnd, rows, rowIndexByBoxId, seaiMarkers } = layout;

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

  const x = d3.scaleLinear().domain([domainStart, domainEnd]).range([0, innerWidth]);
  // A box's real start/end may fall outside the currently filtered range
  // (e.g. the Roman Empire when zoomed into 1000-1500); clamp the drawn bar
  // to the visible plot area instead of letting it run off-canvas.
  const xClamped = (year) => Math.min(innerWidth, Math.max(0, x(year)));

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  plot
    .append("g")
    .attr("class", "timeline-axis")
    .attr("transform", `translate(0,${rows.length * rowHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  const rowSel = plot
    .selectAll("g.timeline-row")
    .data(rows, (d) => d.box.box_id)
    .join("g")
    .attr("class", "timeline-row")
    .attr("transform", (_, i) => `translate(0,${i * rowHeight})`)
    .style("cursor", "pointer")
    .on("click", (_event, d) => onSelectBox(d.box.box_id));

  rowSel
    .append("rect")
    .attr("class", (d) => "timeline-bar" + (d.box.box_id === state.selectedBoxId ? " selected" : "") + (d.approxStart ? " approx-start" : ""))
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
