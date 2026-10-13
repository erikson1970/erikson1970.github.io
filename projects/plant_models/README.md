# Plant models

Interactive, browser-only thermal plant models. Served at
`erikson1970.github.io/projects/plant_models/`.

## Contents

```text
index.html            section page linking the models below
counterflow-hx/       v1.0  single counterflow heat exchanger (rating / sizing, reversible flows)
hx-tank-loop-v2/      v2.0  cooler + recuperator + stratified storage tank with sample valve
hx-tank-loop-v3/      v3.1  adds a third exchanger, 300 °C inlet, cooler/recuperator order switch
pwr-plant-v4/         v4.0  single-loop PWR plant: kinetics, RCPs, pressurizer, steam, electric, seawater
pwr-plant-v5/         v5.0  six-group kinetics, xenon, rods, SG level, sampling/charging, four panels
pwr-plant-v5-1/       v5.1  v5.0 plus a loop electric plant (vital/non-vital buses, MGs, DC bus, battery)
```

Each model's `index.html` is one self-contained file: HTML, CSS and JavaScript
inline, Google Fonts as the only external load. No build step, no backend.

## Where the pages come from

The models were developed in the separate `Energy-Flow` working folder
(`visualization/*.html`) and copied here, each wrapped in a full HTML document
with a breadcrumb back to this section. Older versions are kept so the
progression stays visible.

All plant values are generic, textbook-scale figures chosen for teaching; the
PWR models use no real plant's design data.
