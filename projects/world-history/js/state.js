// Shared application state. Deliberately tiny: a plain object, a set()
// that merges a patch and notifies subscribers, and nothing else. See
// docs/IMPLEMENTATION_PLAN.md Phase 2 for the field shapes this follows.

const initialState = () => ({
  selectedBoxId: null,
  selectedSeaiId: null,
  // Not in IMPLEMENTATION_PLAN.md Phase 2's suggested shape (that predates
  // Links existing) -- added in Phase 3 so a clicked alluvial-diagram link
  // can drive the same shared inspector as a clicked box.
  selectedLinkId: null,
  regionFilter: "all",
  countryFilter: "all",
  yearStart: -3000,
  yearEnd: 2026,
  widthMode: "equal",
  showSeais: true,
  // Phase 5.5 (docs/timescaleRequirement.md): the semantic-zoom slider's
  // `s`, range [-2, 2], default 0. Shared by the timeline and the Sankey
  // diagram -- see js/timescale.js's semanticTimeScale().
  timeScale: 0,
});

export function createStore() {
  let state = initialState();
  const subscribers = new Set();

  return {
    get: () => state,
    /** Shallow-merge `patch` into state, then notify every subscriber. */
    set(patch) {
      state = { ...state, ...patch };
      for (const fn of subscribers) fn(state);
    },
    /** Call `fn(state)` on every change (and once immediately). Returns an unsubscribe function. */
    subscribe(fn) {
      subscribers.add(fn);
      fn(state);
      return () => subscribers.delete(fn);
    },
  };
}
