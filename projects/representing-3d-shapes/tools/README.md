# Build tools

The Python pipeline that produces `../index.html`. Build-time only; nothing
here runs in the browser. Run everything from this directory.

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

python run_all.py            # walks, spirals, slice loops, crossing rule -> results.json, viewer.json
python page_data.py          # -> artifact_data.json (what the page embeds)
python sizes.py              # mesh / Draco baselines -> sizes.json, draco/*.drc
python precision.py          # float32 / float16 / fixed-point wire encodings -> precision.json
python sampling.py           # point-sampling speed -> sampling.json
python build_page.py site ../index.html
```

`run_all.py`, `sizes.py` and `precision.py` accept aircraft names
(`A319 B17 PD808 Simple KingAir`) to redo only those.

| File | Role |
|---|---|
| `core.py` | mesh loading and normalization, the coverage metric, 3D Fourier series, loop splicing |
| `walk.py` | approach 1: steered surface walk |
| `spiral.py` | approach 2: plane-dominant spirals |
| `blobs.py` | approach 3: slice loops, greedy selection, the saddle/extremum crossing rule |
| `run_all.py` | runs all three on every aircraft, plus one-chain splices and time locality |
| `sizes.py` | STL / GLB / Draco / decimated-mesh baselines |
| `precision.py` | coefficient encodings and their coverage |
| `sampling.py` | sampling-speed benchmark |
| `declarative.py`, `fit_decl.py` | the parametric A319 behind `../scad/a319.scad` and its fit |
| `page_data.py`, `build_page.py`, `page_template.html` | page assembly |

## Notes

- Three of the five meshes are not in `../stl/` (see `../LICENSES.md`).
  `run_all.py`, `sizes.py`, `precision.py` and `sampling.py` need them for
  the A319, B17 and Simple models: obtain the files and save them as
  `../stl/A319.stl`, `../stl/B17.stl` and
  `../stl/Simple_Airplane_Model_V2.stl`, or pass only `PD808 KingAir`.
  `build_page.py` needs none of them.

- `viewer.json` and `artifact_data.json` are large and regenerable, so they
  are git-ignored; `run_all.py` and `page_data.py` recreate them (about three
  minutes for all five aircraft).
- `results.json`, `sizes.json`, `precision.json`, `sampling.json` and
  `draco/` are the committed outputs the published page was built from.
- The numbers written into the page's prose (ranges across aircraft) live in
  `page_template.html` and are edited by hand from those outputs.
- The OpenSCAD scores in `build_page.py` (`SCAD`) were measured by rendering
  the scripts with the OpenSCAD CLI and scoring them with `sizes.score`; that
  step is not scripted.
- `sampling.py` timings depend on the machine; only their ratios carry over.
- `build_page.py artifact out.html` writes the body-only variant used for the
  claude.ai artifact.
