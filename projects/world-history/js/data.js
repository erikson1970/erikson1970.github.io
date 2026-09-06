// Data loading. Fetches the generated JSON in data/ and builds a few
// convenience indices. This module knows nothing about rendering or state --
// see docs/IMPLEMENTATION_PLAN.md Phase 2 ("separate data loading, state
// management, and rendering").

const FILES = {
  boxes: "boxes.json",
  seais: "seais.json",
  population: "population.json",
  regions: "regions.json",
  links: "links.json",
};

/**
 * Load boxes/seais/population/regions/links from `baseUrl` (default
 * "data/") and return { boxes, seais, population, regions, links,
 * boxesById, seaisByBoxId, populationByBoxId, linksByBoxId }.
 */
export async function loadAllData(baseUrl = "data/") {
  const entries = Object.entries(FILES);
  const responses = await Promise.all(
    entries.map(([, filename]) => fetch(baseUrl + filename))
  );

  const tables = {};
  for (let i = 0; i < entries.length; i++) {
    const [key, filename] = entries[i];
    const res = responses[i];
    if (!res.ok) {
      throw new Error(`failed to load ${baseUrl}${filename}: ${res.status} ${res.statusText}`);
    }
    tables[key] = await res.json();
  }

  return { ...tables, ...buildIndices(tables) };
}

function buildIndices({ boxes, seais, population, links }) {
  const boxesById = new Map(boxes.map((b) => [b.box_id, b]));

  const seaisByBoxId = new Map();
  for (const s of seais) {
    if (!seaisByBoxId.has(s.box_id)) seaisByBoxId.set(s.box_id, []);
    seaisByBoxId.get(s.box_id).push(s);
  }

  const populationByBoxId = new Map();
  for (const p of population) {
    if (!populationByBoxId.has(p.box_id)) populationByBoxId.set(p.box_id, []);
    populationByBoxId.get(p.box_id).push(p);
  }

  const linksById = new Map(links.map((l) => [l.link_id, l]));

  // Every box_id that appears as either end of a link, so the alluvial view
  // knows which boxes have link data at all (see js/sankey.js).
  const linksByBoxId = new Map();
  for (const l of links) {
    for (const boxId of [l.source_box_id, l.target_box_id]) {
      if (!linksByBoxId.has(boxId)) linksByBoxId.set(boxId, []);
      linksByBoxId.get(boxId).push(l);
    }
  }

  return { boxesById, seaisByBoxId, populationByBoxId, linksById, linksByBoxId };
}

/** Distinct `region_group` values from Boxes, sorted, for a filter control. */
export function regionGroups(boxes) {
  return [...new Set(boxes.map((b) => b.region_group).filter(Boolean))].sort();
}
