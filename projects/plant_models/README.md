# Plant models

Interactive, browser-only thermal plant models. Served at
`erikson1970.github.io/projects/plant_models/`.

## Contents

```text
index.html            section page linking the models below
counterflow-hx/       v1.0  single counterflow heat exchanger (rating / sizing, reversible flows)
hx-tank-loop-v2/      v2.0  cooler + recuperator + stratified storage tank with sample valve
hx-tank-loop-v3/      v3.1  adds a third exchanger, 300 °C inlet, cooler/recuperator order switch
power-generation/     section: nuclear plants (PWR v4, v5, v5.2, v6), famous failures (RBMK), fictional plants
pwr-plant-v4/ v5/ v5-1/ v5-2/, rbmk-1986/   redirect stubs to their new homes under power-generation/
einstein-refrigerator/
                      v1.2  heat-driven refrigeration: Einstein–Szilard, diffusion, LiBr, NH3–water, adsorption
car-exhaust-ac/        v1.0  exhaust-driven absorption car air conditioner with cabin load model
```

Each model's `index.html` is one self-contained file: HTML, CSS and JavaScript
inline, Google Fonts as the only external load. No build step, no backend.

## Where the pages come from

The models were developed in the separate `Energy-Flow` working folder
(`visualization/*.html`) and copied here, each wrapped in a full HTML document
with a breadcrumb back to this section. Older versions are kept so the
progression stays visible.

All plant values are generic, textbook-scale figures chosen for teaching,
derived from published, publicly available sources. The RBMK model's scope
was set by a three-lens expert council (neutronics, thermal-hydraulics,
accident sequence) and it stops at the first steam explosion.
