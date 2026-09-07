// Committed, repeatable test for js/timescale.js -- the pure semantic-zoom
// time scale (Phase 5.5, docs/timescaleRequirement.md). Covers exactly the
// checks that doc's own "Validation" section calls out: boundary
// conditions, monotonicity, round-trip, zoom behavior, and slider behavior.
// Run with: node js/timescale.test.mjs

import { semanticTimeScale, timeTicks } from "./timescale.js";

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error("FAIL:", msg);
  } else {
    console.log("ok:", msg);
  }
}
function approx(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

// -- Boundary conditions --
for (const scaler of [-2, -1, 0, 1, 2]) {
  const scale = semanticTimeScale({ tMin: -3000, tMax: 2026, scaler });
  assert(approx(scale.yearToX(-3000), 0), `yearToX(tMin) == 0 at s=${scaler}`);
  assert(approx(scale.yearToX(2026), 1), `yearToX(tMax) == 1 at s=${scaler}`);
}

// -- Monotonicity, across viewport sizes and the full slider range, and
// including years outside [tMin, tMax] (a box's real dates can run past
// either edge of the currently visible window -- see js/timeline.js's
// xClamped) --
const windows = [
  [-3000, 2026],
  [0, 2026],
  [1800, 2026],
  [1990, 2000],
  [500, 500 + 1e-6], // near-degenerate: still must not throw/NaN
];
for (const [tMin, tMax] of windows) {
  for (const scaler of [-2, -1, 0, 0.5, 1, 2]) {
    const scale = semanticTimeScale({ tMin, tMax, scaler });
    const years = [tMin - 500, tMin, tMin + (tMax - tMin) / 3, (tMin + tMax) / 2, tMax - 1, tMax, tMax + 500];
    for (let i = 1; i < years.length; i++) {
      const t1 = years[i - 1];
      const t2 = years[i];
      if (t1 >= t2) continue; // near-degenerate window can collapse two sample points
      const x1 = scale.yearToX(t1);
      const x2 = scale.yearToX(t2);
      assert(
        Number.isFinite(x1) && Number.isFinite(x2) && x1 < x2,
        `yearToX monotonic: t1=${t1} < t2=${t2} => x1=${x1} < x2=${x2} (window [${tMin},${tMax}], s=${scaler})`
      );
    }
  }
}

// -- Round trip (representative years, including outside [tMin, tMax]) --
{
  const scale = semanticTimeScale({ tMin: -3000, tMax: 2026, scaler: 0 });
  for (const t of [-3000, -2500, -1000, 0, 537, 1000, 1800, 1990, 2026, -4000, 2100]) {
    const roundTripped = scale.xToYear(scale.yearToX(t));
    assert(approx(roundTripped, t, 1e-6), `xToYear(yearToX(${t})) ≈ ${t}, got ${roundTripped}`);
  }
}

// -- Zoom behavior: at s=0, M=3000 -> p=0.5; M -> 0 -> p -> 1 --
assert(approx(semanticTimeScale({ tMin: 0, tMax: 3000, scaler: 0 }).exponent(), 0.5), "M=3000, s=0 => p=0.5");
assert(semanticTimeScale({ tMin: 0, tMax: 1, scaler: 0 }).exponent() > 0.99, "M near 0 => p near 1 (linear)");

// -- Slider behavior: s decreases -> p increases (more linear); s increases
// -> p decreases (recent history gets more room) --
{
  const M = 6000;
  const pByScaler = [-2, -1, 0, 1, 2].map((s) => semanticTimeScale({ tMin: 0, tMax: M, scaler: s }).exponent());
  for (let i = 1; i < pByScaler.length; i++) {
    assert(pByScaler[i] < pByScaler[i - 1], `p strictly decreases as s increases (index ${i}: ${pByScaler[i]} < ${pByScaler[i - 1]})`);
  }
}

// -- Coordinate stability: exponent depends only on [tMin, tMax, s], not on
// anything else -- trivially true here since the function signature has no
// other inputs, but assert the two scale instances agree exactly. --
{
  const a = semanticTimeScale({ tMin: -500, tMax: 1500, scaler: 1 });
  const b = semanticTimeScale({ tMin: -500, tMax: 1500, scaler: 1 });
  assert(a.exponent() === b.exponent(), "same [tMin,tMax,s] => same exponent");
  assert(a.yearToX(537) === b.yearToX(537), "same [tMin,tMax,s] => same yearToX for a given year");
}

// -- timeTicks: calendar-time-first tick generation --
{
  const ticks = timeTicks(-3000, 2026);
  assert(ticks.length > 0, "timeTicks produces at least one tick for a real span");
  assert(ticks.every((t) => t >= -3000 && t <= 2026), "every tick falls within [tMin, tMax]");
  for (let i = 1; i < ticks.length; i++) {
    assert(ticks[i] > ticks[i - 1], "ticks are strictly increasing");
  }
  const narrowTicks = timeTicks(1990, 2000);
  assert(narrowTicks.length > 0, "timeTicks handles a narrow span without throwing");
  assert(timeTicks(500, 500).length === 1, "zero-width span falls back to a single tick, not a crash/empty array");

  // docs/DATA_MODEL.md: "There is no attempt to model a historical year
  // zero" -- a span whose calendar-arithmetic ticks would otherwise land
  // exactly on 0 (the app's own default -3000..2026 view is exactly this
  // case) must not produce one; there's no real calendar year to label it
  // with (council review gatekeeper finding -- js/timeline.js's
  // formatTickYear was rendering it as "0 CE").
  assert(!ticks.includes(0), "timeTicks never includes year 0 (no historical year zero)");
  assert(!timeTicks(-500, 500).includes(0), "a span straddling 0 at a smaller interval still excludes it");
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll assertions passed.");
