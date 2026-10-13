# HVAC stuff

Home heating and cooling analyses. Served at
`erikson1970.github.io/projects/HVAC-stuff/`.

## Contents

```text
index.html                  section page
ground-source-heat-pump/    Ground loop home model (Wellesley, MA)
```

`ground-source-heat-pump/index.html` is one self-contained file (Google Fonts
is the only external load). It models monthly heating, cooling and hot-water
loads from degree days, a vertical bore field with line-source superposition
over 20 years, installed cost, and a 20-year cost and performance comparison
against the current oil/propane boiler with window AC and against an
air-source heat pump refit.

The page was developed in the separate `Energy-Flow` working folder
(`visualization/gshp_home_model.html`) and copied here with a breadcrumb added.
Its Wellesley degree-day table is an estimate from nearby stations, and its
incentive defaults (Mass Save rebates, no federal 25D credit after 2025) were
checked in October 2026; both are editable on the page.
