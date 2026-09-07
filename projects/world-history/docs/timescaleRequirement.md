# Requirement: Semantic Zoom Time Scaling
## Purpose
The timeline must support a nonlinear **semantic zoom** time scale so that very long historical spans allocate more horizontal space to recent history, while shorter visible spans progressively approach ordinary linear time.
The goal is to reduce crowding of recent events in multi-millennial views without making close-up historical views feel geometrically distorted.
## Core Mapping
Let:
- `t` = historical year
- `tMax` = most recent year visible in the current viewport
- `tMin` = earliest year visible in the current viewport
- `M = tMax - tMin` = visible time span in years
- `a = tMax - t` = age of an event relative to the right edge of the viewport
- `s` = user-adjustable scale parameter in the range `[-2, +2]`
Define the semantic zoom exponent as:
```text
p = 1 / (1 + (M / 3000) * 2^s)

Map time into normalized horizontal screen position with:

x = 1 - (a / M)^p

where:

0 <= x <= 1

Interpretation:

* x = 0 corresponds to tMin
* x = 1 corresponds to tMax

Default Behavior

The default slider value shall be:

s = 0

At the default setting:

p = 1 / (1 + M/3000)

This gives approximately:

Visible span	Exponent p	Behavior
50 years	0.984	essentially linear
100 years	0.968	essentially linear
300 years	0.909	mildly nonlinear
1,000 years	0.750	moderate recent-history expansion
3,000 years	0.500	square-root scaling
6,000 years	0.333	strong recent-history expansion

Thus, a 3,000-year visible span naturally uses approximately square-root scaling, while short historical windows relax smoothly toward linear time.

User Control

Provide an interactive slider:

range: -2 to +2
default: 0

The slider modifies the amount of nonlinear compression through the 2^s term.

Expected interpretation:

* negative values → more linear / less recent-history emphasis
* zero → recommended default semantic scaling
* positive values → stronger expansion of recent history

Suggested UI label:

Time compression
Ancient detail  ←  0  →  Recent detail

Alternative labels are acceptable if they communicate the same effect clearly.

Do not expose the raw mathematical parameter unless useful in an advanced/debug mode.

Important Constraint

Do not use this earlier additive formulation:

p = 1 / (1 + M/3000 + s)

because the denominator can reach zero or become negative for valid slider values.

Use the multiplicative form:

p = 1 / (1 + (M/3000) * 2^s)

which remains finite and positive across the required slider range.

Zoom Interaction

The semantic scaling must update dynamically whenever the visible time range changes.

For example:

3000 BCE–2026

should be strongly nonlinear, while zooming into:

1800–2026

should automatically become close to linear.

The transition should be continuous.

If technically practical, animate the layout smoothly while zooming so that historical objects visibly relax toward linear spacing as the viewport narrows.

Avoid abrupt remapping after zoom completion.

Coordinate Stability

The mapping must depend only on:

* current visible time span;
* current slider value.

It must not depend on:

* number of visible SEAIs;
* event density;
* filtering choices;
* population;
* number of boxes shown.

This is intentional.

A historical date should remain at the same screen position for a given:

[tMin, tMax, s]

regardless of which event layers are enabled.

Shared Scale

All time-based visual elements in a view must use the same semantic transform, including:

* historical box start/end coordinates;
* SEAIs;
* architecture/event markers;
* succession transitions;
* Sankey/alluvial node placement where chronology determines x-position;
* population knot points;
* time grid/tick locations.

Do not mix linear placement for some elements with semantic placement for others within the same timeline view.

Axis Labels and Interpretation

Because the timeline is nonlinear, pixel distance must not be presented as proportional elapsed time.

The UI must preserve clear historical-date labeling.

Recommended approaches:

* transform year ticks using the same scale;
* provide sufficiently frequent labeled year ticks;
* optionally show a small linear overview ruler;
* retain BCE/CE labels clearly;
* show exact year/date in hover/selection inspectors.

The interface should make it difficult for a reader to mistake equal screen distance for equal elapsed time.

Tick Generation

Generate tick years in calendar time first, then transform their positions.

Do not generate evenly spaced screen ticks and infer calendar years afterward.

Tick density may adapt to zoom level.

Example candidate intervals:

5000-year view: 500- or 1000-year ticks
2000-year view: 250- or 500-year ticks
500-year view: 50- or 100-year ticks
100-year view: 10- or 20-year ticks

Exact tick-selection logic may be tuned for readability.

Implementation Guidance

Implement the scale as a reusable function/module.

Suggested API shape:

semanticTimeScale({
  tMin,
  tMax,
  scaler
})

which returns functions equivalent to:

yearToX(year)
xToYear(x)
exponent()

An inverse transform should be implemented so that pointer interactions can convert screen position back into historical time.

Given:

x = 1 - (a/M)^p

the inverse is:

a = M * (1 - x)^(1/p)
t = tMax - a

Validation

At minimum, test the following:

Boundary conditions

yearToX(tMin) == 0
yearToX(tMax) == 1

Monotonicity

For:

t1 < t2

require:

yearToX(t1) < yearToX(t2)

for all valid:

M > 0
s in [-2, +2]

Round trip

For representative years:

xToYear(yearToX(t)) ≈ t

within floating-point tolerance.

Zoom behavior

Confirm that, at s = 0:

M = 3000 → p = 0.5

and that:

M → 0 → p → 1

so close-up views become linear.

Slider behavior

Confirm that:

s decreases → p increases → mapping becomes more linear
s increases → p decreases → recent history receives more screen space

Performance

Changing either:

* zoom extent;
* slider value

should update the visualization interactively without reloading the page.

For SVG/D3 rendering, updating only x-related geometry is preferred where possible.

The transform should be inexpensive enough to recompute continuously during slider movement.

Design Intent

This semantic scale is preferred over event-density scaling for the primary timeline because it gives stable geometry.

Event-density scaling may still be explored later as an optional visualization mode, but it must not be the default timeline coordinate system.

The default timeline should prioritize:

1. chronological stability;
2. smooth semantic zoom;
3. readability of recent history;
4. predictable interaction;
5. simple user control.

