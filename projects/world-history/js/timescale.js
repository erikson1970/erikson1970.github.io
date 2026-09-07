// Phase 5.5 (docs/IMPLEMENTATION_PLAN.md; full spec docs/timescaleRequirement.md):
// a reusable, pure "semantic zoom" time scale. Every time-based visual
// element sharing one view (js/timeline.js's box bars/SEAIs/ticks,
// js/sankey.js's node placement, and later Phase 6's population knot
// points) must go through this same module -- no element computing its own
// separate linear normalization -- so a given [tMin, tMax, s] always puts a
// given year at the same normalized x everywhere it's drawn.
//
// No D3/DOM/Plotly dependency -- Node-testable on its own, see
// timescale.test.mjs.

/**
 * Build a scale for the visible window [tMin, tMax] at scale parameter
 * `scaler` (the doc's `s`, range [-2, 2], default 0 -- "Ancient detail /
 * Recent detail"). Returns `yearToX`/`xToYear`/`exponent`, matching the
 * shape docs/timescaleRequirement.md's "Implementation Guidance" suggests.
 *
 * p = 1 / (1 + (M/3000) * 2^s)   -- the multiplicative form the spec
 *                                   requires (never the additive
 *                                   `1/(1+M/3000+s)`, which can hit a
 *                                   zero/negative denominator for valid s)
 * x = 1 - (a/M)^p                -- a = tMax - t, M = tMax - tMin
 *
 * `M` is clamped to a small positive epsilon internally so a degenerate
 * zero-width view (yearStart === yearEnd, which js/app.js's own guard
 * allows) can't divide by zero -- every date still maps to a finite,
 * monotonic (if extreme) x instead of NaN.
 *
 * The `a >= 0` (t <= tMax) branch already covers t < tMin too (a > M just
 * makes the ratio > 1, still a well-defined positive base for a fractional
 * exponent), which is why boxes that start before the current viewport
 * don't need special-casing. t > tMax needs its own branch purely to avoid
 * raising a *negative* base to a fractional power (NaN) -- it mirrors the
 * same shape on the other side of x = 1 so the whole function stays
 * monotonic and continuous across the boundary.
 */
export function semanticTimeScale({ tMin, tMax, scaler = 0 }) {
  const M = Math.max(0, tMax - tMin);
  const s = Math.min(2, Math.max(-2, scaler));
  const p = 1 / (1 + (M / 3000) * Math.pow(2, s));
  const safeM = M > 0 ? M : 1e-9;

  function yearToX(t) {
    const a = tMax - t;
    if (a >= 0) return 1 - Math.pow(a / safeM, p);
    return 1 + Math.pow(-a / safeM, p);
  }

  function xToYear(x) {
    if (x <= 1) return tMax - safeM * Math.pow(Math.max(0, 1 - x), 1 / p);
    return tMax + safeM * Math.pow(x - 1, 1 / p);
  }

  return { yearToX, xToYear, exponent: () => p };
}

// Candidate tick intervals (years), covering everything from decade-scale
// zoom-ins to the app's full -3000..2026 default span. Roughly matches
// docs/timescaleRequirement.md's "Tick Generation" example table (a
// 5000-year view landing on 500/1000-year ticks, etc.) without hardcoding
// its exact numbers -- "exact tick-selection logic may be tuned for
// readability" per that section.
const TICK_INTERVALS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000];

/**
 * Candidate tick years for the visible span [tMin, tMax], targeting ~10
 * ticks. Generated in calendar time first (docs/timescaleRequirement.md
 * "Tick Generation": "do not generate evenly spaced screen ticks and infer
 * calendar years afterward") -- the caller runs each year through the same
 * `semanticTimeScale` the rest of the view uses to get its screen position.
 */
export function timeTicks(tMin, tMax) {
  const span = tMax - tMin;
  if (!(span > 0)) return [tMin];
  const target = span / 10;
  const interval = TICK_INTERVALS.find((c) => c >= target) ?? TICK_INTERVALS[TICK_INTERVALS.length - 1];
  const first = Math.ceil(tMin / interval) * interval;
  const ticks = [];
  for (let t = first; t <= tMax + 1e-9; t += interval) {
    // docs/DATA_MODEL.md: "There is no attempt to model a historical year
    // zero" -- every real box/SEAI year in this dataset is a nonzero
    // integer (negative BCE, positive CE), so a tick landing on the
    // interval arithmetic's year 0 (any span whose bounds straddle it, at
    // an interval that divides evenly into it -- true for every interval
    // in TICK_INTERVALS, so this hits the app's own default -3000..2026
    // view) doesn't correspond to any calendar year this app's BCE/CE
    // convention can label (council review gatekeeper finding: it was
    // rendering as "0 CE", which isn't a real year under that convention).
    // Simplest correct fix is to just not draw a tick there; the
    // neighboring ticks on either side still anchor the axis.
    if (t !== 0) ticks.push(t);
  }
  return ticks;
}
