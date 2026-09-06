// Wiring: load data, hold shared state, render. This is the "small subset"
// slice from AGENTS.md's Scope control -- a sortable/filterable list of
// Boxes with click-to-select and an inspector panel, plus (Phase 3) a small
// alluvial/Sankey succession prototype over data/links.json. Not yet the
// full timeline view (docs/IMPLEMENTATION_PLAN.md Phase 4).

import { loadAllData, regionGroups } from "./data.js";
import { createStore } from "./state.js";
import { renderSankey } from "./sankey.js";

const TODO_URL = "https://en.wikipedia.org/wiki/Time_management#Implementation_of_goals";

const els = {
  status: document.getElementById("status"),
  summary: document.getElementById("summary"),
  regionFilter: document.getElementById("region-filter"),
  boxList: document.getElementById("box-list"),
  inspector: document.getElementById("inspector-content"),
  alluvial: document.getElementById("alluvial"),
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
  });

  els.regionFilter.addEventListener("change", () => {
    store.set({ regionFilter: els.regionFilter.value, selectedBoxId: null, selectedLinkId: null });
  });

  try {
    renderSankey(
      els.alluvial,
      { links: data.links, boxesById: data.boxesById },
      {
        onSelectBox: (boxId) => store.set({ selectedBoxId: boxId, selectedLinkId: null }),
        onSelectLink: (link) => store.set({ selectedLinkId: link.link_id, selectedBoxId: null }),
      }
    );
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
