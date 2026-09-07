// Wiring: load data, hold shared state, render. This is the "small subset"
// slice from AGENTS.md's Scope control -- a sortable/filterable list of
// Boxes with click-to-select and an inspector panel, a small alluvial/Sankey
// succession prototype over data/links.json (Phase 3), a first D3
// timeline view (Phase 4), and cross-panel selection sync between the two
// plus the box list/alluvial list (Phase 5). Box width in the timeline is
// not yet population-based (Population is still a scaffold -- see
// ISSUE-003).

import { loadAllData, regionGroups } from "./data.js";
import { createStore } from "./state.js";
import { renderSankey, applySankeySelection, applySankeyTimeScale } from "./sankey.js";
import { buildTimelineLayout, renderTimeline } from "./timeline.js";

const TODO_URL = "https://en.wikipedia.org/wiki/Time_management#Implementation_of_goals";

const els = {
  status: document.getElementById("status"),
  summary: document.getElementById("summary"),
  regionFilter: document.getElementById("region-filter"),
  boxList: document.getElementById("box-list"),
  inspector: document.getElementById("inspector-content"),
  alluvial: document.getElementById("alluvial"),
  alluvialList: document.getElementById("alluvial-list"),
  timeline: document.getElementById("timeline"),
  yearStart: document.getElementById("year-start"),
  yearEnd: document.getElementById("year-end"),
  showSeais: document.getElementById("show-seais"),
  timeScale: document.getElementById("time-scale"),
};

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("status-error", isError);
}

function renderSummary(data) {
  els.summary.textContent =
    `${data.boxes.length} boxes • ${data.seais.length} SEAIs • ` +
    `${data.population.length} population rows • ${data.regions.length} region-country rows`;
}

function populateRegionFilter(boxes) {
  const groups = regionGroups(boxes);
  els.regionFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All regions";
  els.regionFilter.appendChild(allOption);
  for (const group of groups) {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    els.regionFilter.appendChild(option);
  }
}

// A handful of boxes (ISSUE-005: illegible "c. [BCE]" prehistory labels on
// the source poster) have a null start_year but a real end_year. Falling
// back to end_year for the sort key would misfile them next to boxes whose
// *start* date matches that number -- e.g. an Indigenous Era box ending in
// 1607 would sort next to 16th-century boxes instead of near other
// prehistoric-start entities. Sort those to the front instead.
function filteredBoxes(data, state) {
  return data.boxes
    .filter((b) => state.regionFilter === "all" || b.region_group === state.regionFilter)
    .slice()
    .sort((a, b) => {
      const ay = a.start_year ?? Number.NEGATIVE_INFINITY;
      const by = b.start_year ?? Number.NEGATIVE_INFINITY;
      return ay - by;
    });
}

function renderList(data, state) {
  const boxes = filteredBoxes(data, state);
  els.boxList.innerHTML = "";

  if (boxes.length === 0) {
    const empty = document.createElement("li");
    empty.className = "box-empty";
    empty.textContent = "No boxes match this filter.";
    els.boxList.appendChild(empty);
    return;
  }

  for (const box of boxes) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "box-item";
    button.setAttribute("aria-pressed", String(box.box_id === state.selectedBoxId));
    if (box.box_id === state.selectedBoxId) button.classList.add("selected");

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.backgroundColor = box.color_hex || "transparent";
    swatch.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "box-label";
    label.textContent = `${box.box_name} (${box.start_label ?? "?"}–${box.end_label ?? "?"})`;

    button.append(swatch, label);
    button.addEventListener("click", () => {
      store.set({
        selectedBoxId: box.box_id === store.get().selectedBoxId ? null : box.box_id,
        selectedLinkId: null,
      });
    });

    li.appendChild(button);
    els.boxList.appendChild(li);
  }
}

// Text/keyboard alternative to the Plotly Sankey diagram (visually hidden
// by default, see css/history.css .visually-hidden's :focus-within
// exception). Plotly's own SVG hit-targets are mouse-driven with no
// tabindex, so this is the only way a keyboard/screen-reader user can
// browse or select a link at all -- it's populated from data/links.json
// directly, independent of whether Plotly itself loaded (see the
// try/catch around renderSankey below).
function renderAlluvialList(data) {
  if (!els.alluvialList) return;
  els.alluvialList.innerHTML = "";
  for (const link of data.links) {
    const source = data.boxesById.get(link.source_box_id);
    const target = data.boxesById.get(link.target_box_id);
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.linkId = link.link_id;
    button.setAttribute("aria-pressed", "false");
    button.textContent =
      `${source?.box_name ?? link.source_box_id} → ${target?.box_name ?? link.target_box_id} ` +
      `(${link.year ?? "?"}, ${link.relation_type ?? "?"})`;
    button.addEventListener("click", () => {
      store.set({ selectedLinkId: link.link_id, selectedBoxId: null });
    });
    li.appendChild(button);
    els.alluvialList.appendChild(li);
  }
}

// Phase 5: the buttons above are built once (the link list itself never
// changes), so selection is synced separately here on every state change,
// the same "build once, toggle a class on change" split renderList() uses
// for the box list's own .selected state.
function renderAlluvialListSelection(state) {
  if (!els.alluvialList) return;
  for (const button of els.alluvialList.querySelectorAll("button")) {
    const isSelected = button.dataset.linkId === state.selectedLinkId;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("selected", isSelected);
  }
}

// Re-derives the layout and re-draws the whole SVG on every state change
// (region/year filter, SEAI toggle, box selection) -- the dataset is small
// enough (198 boxes) that a full redraw is simpler than diffing, matching
// renderList()'s same full-redraw approach above.
//
// Phase 5: a selected link (data.linksById, not part of the shared store
// itself -- the store only knows the id) is resolved here to its two
// endpoint box_ids and passed through as state.linkHighlightBoxIds, so
// selecting a link anywhere still shows something on the timeline even
// though the timeline has no link geometry of its own to select. Deriving
// this here (not in timeline.js) keeps timeline.js ignorant of Links, the
// same separation buildTimelineLayout already has from data.js's indices.
function renderTimelineView(data, state) {
  if (!els.timeline) return;
  try {
    const layout = buildTimelineLayout(data.boxes, data.seaisByBoxId, state);
    const link = state.selectedLinkId ? data.linksById.get(state.selectedLinkId) : null;
    const linkHighlightBoxIds = link ? new Set([link.source_box_id, link.target_box_id]) : null;
    renderTimeline(
      els.timeline,
      layout,
      { ...state, linkHighlightBoxIds },
      { onSelectBox: (boxId) => store.set({ selectedBoxId: boxId, selectedLinkId: null }) }
    );
  } catch (err) {
    // D3 failing to load (e.g. offline, CDN blocked) shouldn't take down
    // the rest of the page -- same reasoning as the try/catch around
    // renderSankey in main() below.
    els.timeline.textContent = `Timeline unavailable: ${err.message}`;
  }
}

// Phase 5: `sankeyInfo` is only set once renderSankey() has actually
// resolved (see main() below) -- until then this is a no-op, since
// Plotly.restyle needs the trace to already exist. A restyle failure is
// swallowed rather than surfaced through els.alluvial.textContent like
// renderSankey's own try/catch does: losing the selection *highlight* isn't
// the same failure as losing the diagram itself, and clobbering an already-
// rendered chart with an error message over a cosmetic sync issue would be
// worse than just leaving the highlight stale.
let sankeyInfo = null;
function renderSankeySelection(data, state) {
  if (!sankeyInfo || !els.alluvial) return;
  try {
    applySankeySelection(els.alluvial, { links: data.links, boxIds: sankeyInfo.boxIds }, state);
  } catch (err) {
    console.warn("Sankey selection sync failed:", err);
  }
}

// Phase 5.5: kept as its own function/subscribe entry, separate from
// renderSankeySelection above, rather than merged into it -- position
// (this) and selection-highlight (that) are different concerns, and
// keeping them apart avoids touching the already-reviewed Milestone 6
// selection code for this milestone (see js/sankey.js's
// applySankeyTimeScale comment for the fuller reasoning).
function renderSankeyTimeScale(data, state) {
  if (!sankeyInfo || !els.alluvial) return;
  try {
    applySankeyTimeScale(els.alluvial, { boxIds: sankeyInfo.boxIds, boxesById: data.boxesById }, state);
  } catch (err) {
    console.warn("Sankey time-scale sync failed:", err);
  }
}

function renderInspector(data, state) {
  if (state.selectedLinkId) {
    renderLinkInspector(data, state.selectedLinkId);
    return;
  }

  const boxId = state.selectedBoxId;
  if (!boxId) {
    els.inspector.innerHTML = "<p>Select a box, or a node/link in the alluvial diagram, to see details.</p>";
    return;
  }

  const box = data.boxesById.get(boxId);
  if (!box) {
    els.inspector.innerHTML = "<p>Selected box not found.</p>";
    return;
  }

  const seais = data.seaisByBoxId.get(boxId) || [];
  const urlLine =
    box.url && box.url !== TODO_URL
      ? `<p><a href="${escapeAttr(box.url)}">Wikipedia</a></p>`
      : "<p>Wikipedia: not yet added (placeholder).</p>";

  const seaiList = seais.length
    ? `<ul>${seais.map((s) => `<li>${escapeHtml(s.name)} (${escapeHtml(String(s.year_label ?? s.year ?? "?"))})</li>`).join("")}</ul>`
    : "<p>None recorded.</p>";

  els.inspector.innerHTML = `
    <h2>${escapeHtml(box.box_name)}</h2>
    <p>${escapeHtml(box.start_label ?? "?")}–${escapeHtml(box.end_label ?? "?")}</p>
    <p>Region: ${escapeHtml(box.region_group ?? "?")} — Span: ${escapeHtml(box.span ?? "?")}</p>
    <p>Confidence: ${escapeHtml(box.confidence ?? "?")}</p>
    ${box.notes ? `<p>Notes: ${escapeHtml(box.notes)}</p>` : ""}
    ${urlLine}
    <h3>SEAIs (${seais.length})</h3>
    ${seaiList}
  `;
}

function renderLinkInspector(data, linkId) {
  const link = data.linksById.get(linkId);
  if (!link) {
    els.inspector.innerHTML = "<p>Selected link not found.</p>";
    return;
  }

  const source = data.boxesById.get(link.source_box_id);
  const target = data.boxesById.get(link.target_box_id);
  const urlLine = link.source_url
    ? `<p><a href="${escapeAttr(link.source_url)}">Source</a></p>`
    : "<p>No source recorded.</p>";

  els.inspector.innerHTML = `
    <h2>${escapeHtml(source?.box_name ?? link.source_box_id)} &rarr; ${escapeHtml(target?.box_name ?? link.target_box_id)}</h2>
    <p>${escapeHtml(link.year != null ? String(link.year) : "?")} &mdash; ${escapeHtml(link.relation_type ?? "?")}</p>
    <p>Confidence: ${escapeHtml(link.confidence ?? "?")}</p>
    ${link.notes ? `<p>Notes: ${escapeHtml(link.notes)}</p>` : ""}
    ${urlLine}
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}

let store;

async function main() {
  setStatus("Loading data…");
  let data;
  try {
    data = await loadAllData("data/");
  } catch (err) {
    setStatus(`Failed to load data: ${err.message}`, true);
    return;
  }

  setStatus("");
  renderSummary(data);
  populateRegionFilter(data.boxes);

  store = createStore();
  store.subscribe((state) => {
    renderList(data, state);
    renderInspector(data, state);
    renderTimelineView(data, state);
    renderAlluvialListSelection(state);
    renderSankeySelection(data, state);
    renderSankeyTimeScale(data, state);
  });

  els.regionFilter.addEventListener("change", () => {
    store.set({ regionFilter: els.regionFilter.value, selectedBoxId: null, selectedLinkId: null });
  });

  // Year-range/SEAI controls only affect the timeline view; they intentionally
  // leave selectedBoxId/selectedLinkId alone (unlike the region filter above,
  // which clears selection because it can remove the selected box from the
  // list entirely).
  const initial = store.get();
  els.yearStart.value = initial.yearStart;
  els.yearEnd.value = initial.yearEnd;
  els.showSeais.checked = initial.showSeais;
  if (els.timeScale) els.timeScale.value = initial.timeScale;
  // A reversed range (yearStart > yearEnd) doesn't crash js/timescale.js's
  // semanticTimeScale (M just floors to a near-zero epsilon, per that
  // module's own degenerate-domain guard), but it would draw chronology
  // flowing right-to-left with no warning, which would violate AGENTS.md's
  // "chronology must remain semantically correct" -- so reject it here
  // instead of ever letting it reach the store. Revert the input's own
  // displayed value too, or it would visually disagree with the state it
  // failed to change.
  els.yearStart.addEventListener("change", () => {
    const value = Number(els.yearStart.value);
    const current = store.get();
    if (!Number.isFinite(value) || value > current.yearEnd) {
      els.yearStart.value = current.yearStart;
      return;
    }
    store.set({ yearStart: value });
  });
  els.yearEnd.addEventListener("change", () => {
    const value = Number(els.yearEnd.value);
    const current = store.get();
    if (!Number.isFinite(value) || value < current.yearStart) {
      els.yearEnd.value = current.yearEnd;
      return;
    }
    store.set({ yearEnd: value });
  });
  els.showSeais.addEventListener("change", () => {
    store.set({ showSeais: els.showSeais.checked });
  });
  // Phase 5.5 (docs/timescaleRequirement.md "Zoom Interaction"): recompute
  // continuously while dragging, so this listens on `input` (fires on every
  // drag tick) rather than `change` (fires only on release) like the
  // controls above.
  if (els.timeScale) {
    els.timeScale.addEventListener("input", () => {
      store.set({ timeScale: Number(els.timeScale.value) });
    });
  }

  // Populated from the fetched data directly, independent of whether Plotly
  // itself loads -- this is the accessible fallback, not just a mirror of
  // the chart.
  renderAlluvialList(data);

  try {
    sankeyInfo = await renderSankey(
      els.alluvial,
      { links: data.links, boxesById: data.boxesById },
      store.get(),
      {
        onSelectBox: (boxId) => store.set({ selectedBoxId: boxId, selectedLinkId: null }),
        onSelectLink: (link) => store.set({ selectedLinkId: link.link_id, selectedBoxId: null }),
      }
    );
    // The diagram just rendered with no selection styling applied; if a
    // selection was already made elsewhere while Plotly was still loading
    // (a race the try/catch structure allows, since data-load/render is
    // async), catch it up immediately rather than leaving it unhighlighted
    // until the next unrelated state change. Same reasoning applies to the
    // time scale (Phase 5.5) -- the slider could have moved during load too.
    renderSankeySelection(data, store.get());
    renderSankeyTimeScale(data, store.get());
  } catch (err) {
    // Plotly failing to load (e.g. offline, CDN blocked) shouldn't take
    // down the rest of the page -- the box list/inspector/filter above
    // still work without it.
    els.alluvial.textContent = `Alluvial diagram unavailable: ${err.message}`;
  }
}

main().catch((err) => {
  // Belt-and-suspenders: the data-load try/catch inside main() already
  // handles fetch failures, but a thrown error from rendering itself
  // (e.g. an unexpected data shape) would otherwise surface only as an
  // unhandled-rejection console warning with no user-visible message.
  setStatus(`Unexpected error: ${err.message}`, true);
});
