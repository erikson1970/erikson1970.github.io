// Alluvial / Sankey prototype (docs/IMPLEMENTATION_PLAN.md Phase 3). Builds a
// Plotly Sankey diagram from the boxes referenced by data/links.json -- a
// small hand-authored subset (the "Mediterranean / Europe" candidate list),
// not the full 198-box dataset. See docs/DATA_MODEL.md #5: "Not every
// chronological adjacency should automatically become a link."
//
// Split into a pure data transform (buildSankeyFigure -- no Plotly/DOM
// dependency, Node-testable) and a rendering function (renderSankey --
// needs a real browser and the Plotly UMD build loaded as window.Plotly).

/**
 * Build a Plotly Sankey `data`/`layout` pair plus the `boxIds` array used to
 * map a clicked node index back to a box_id.
 *
 * Node x-positions are normalized from each box's start_year across the
 * range spanned by the subset, so the diagram reads left-to-right in
 * chronological order regardless of link/node insertion order. This is
 * `arrangement: "fixed"` deliberately: AGENTS.md's "Visualization semantics"
 * says chronology must remain semantically correct and auto-layout must not
 * reorder nodes in a historically misleading way.
 */
export function buildSankeyFigure(links, boxesById) {
  const boxIds = [...new Set(links.flatMap((l) => [l.source_box_id, l.target_box_id]))];
  const boxes = boxIds.map((id) => boxesById.get(id)).filter(Boolean);

  const years = boxes.map((b) => b.start_year).filter((y) => typeof y === "number");
  // Guard against an empty subset (every referenced box has a null
  // start_year, per ISSUE-005): Math.min/max of an empty array is
  // +Infinity/-Infinity, and `-Infinity || 1` is still -Infinity (a truthy
  // value in JS), which would silently produce NaN node x-positions below.
  const minYear = years.length ? Math.min(...years) : 0;
  const maxYear = years.length ? Math.max(...years) : 0;
  const yearSpan = maxYear - minYear || 1;

  // Plotly's fixed arrangement wants x strictly inside (0, 1); clamp away
  // from the edges so the first/last node aren't drawn clipped.
  const clamp = (v) => Math.min(0.98, Math.max(0.02, v));

  const nodeIndex = new Map(boxIds.map((id, i) => [id, i]));
  const nodeLabel = boxIds.map((id) => boxesById.get(id)?.box_name ?? id);
  const nodeColor = boxIds.map((id) => boxesById.get(id)?.color_hex || "#888888");
  const nodeX = boxIds.map((id) => {
    const box = boxesById.get(id);
    const y = box && typeof box.start_year === "number" ? box.start_year : minYear;
    return clamp((y - minYear) / yearSpan);
  });
  // x is meaningful (chronology); y only needs to keep nodes from
  // overlapping, so spread evenly in insertion order.
  const nodeY = boxIds.map((_, i) => 0.05 + (0.9 * i) / Math.max(1, boxIds.length - 1));

  const linkSource = links.map((l) => nodeIndex.get(l.source_box_id));
  const linkTarget = links.map((l) => nodeIndex.get(l.target_box_id));
  // No population estimates are filled in yet (ISSUE-003), so every link in
  // data/links.json uses "weight_basis": "equal" -- ribbon width here is not
  // yet "estimated historical scale" per docs/VISUALIZATION.md View 2, just
  // a placeholder equal weight until Phase 6 fills in population knots.
  const linkValue = links.map(() => 1);
  const linkLabel = links.map((l) => `${l.relation_type} (${l.year})`);

  return {
    boxIds,
    data: [
      {
        type: "sankey",
        orientation: "h",
        arrangement: "fixed",
        node: {
          pad: 24,
          thickness: 18,
          label: nodeLabel,
          color: nodeColor,
          x: nodeX,
          y: nodeY,
        },
        link: {
          source: linkSource,
          target: linkTarget,
          value: linkValue,
          label: linkLabel,
        },
      },
    ],
    layout: {
      font: { size: 12 },
      margin: { l: 8, r: 8, t: 8, b: 8 },
    },
  };
}

/**
 * Render the Sankey figure into `container` (a DOM element) using the
 * Plotly UMD build already loaded as `window.Plotly` (see index.html).
 * Clicking a node calls `onSelectBox(boxId)`; clicking a link calls
 * `onSelectLink(link)` with the matching row from data/links.json.
 *
 * Returns the promise from `Plotly.newPlot` (awaited by the caller) so an
 * asynchronous Plotly failure -- not just a synchronous throw -- is caught
 * by js/app.js's try/catch around this call, instead of becoming an
 * unhandled promise rejection that bypasses the intended fallback message.
 */
export async function renderSankey(container, { links, boxesById }, { onSelectBox, onSelectLink }) {
  if (typeof window === "undefined" || !window.Plotly) {
    throw new Error("Plotly is not loaded (expected window.Plotly on the page)");
  }
  const { data, layout, boxIds } = buildSankeyFigure(links, boxesById);

  // Match the page's light/dark theme (css/history.css defines --bg/--fg on
  // :root) instead of Plotly's opaque-white default, which would otherwise
  // render as a stark white rectangle inside an otherwise dark-themed page.
  const rootStyle = getComputedStyle(document.documentElement);
  const bg = rootStyle.getPropertyValue("--bg").trim() || "#ffffff";
  const fg = rootStyle.getPropertyValue("--fg").trim() || "#1a1a1a";
  layout.paper_bgcolor = bg;
  layout.plot_bgcolor = bg;
  layout.font = { ...layout.font, color: fg };

  await window.Plotly.newPlot(container, data, layout, { displayModeBar: false, responsive: true });

  container.on("plotly_click", (event) => {
    const point = event.points && event.points[0];
    if (!point) return;
    if (point.source && point.target) {
      // Link trace click: Plotly gives {source, target} node objects, plus
      // pointNumber indexing into the link arrays we supplied.
      const link = links[point.pointNumber];
      if (link) onSelectLink(link);
    } else if (point.pointNumber !== undefined) {
      // Node trace click: pointNumber indexes into node.label/x/y/color.
      const boxId = boxIds[point.pointNumber];
      if (boxId) onSelectBox(boxId);
    }
  });
}
