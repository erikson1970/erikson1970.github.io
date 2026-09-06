# data/

Generated output only. Everything here is produced by `tools/build_data.py`
from `source/*.xlsx` and must be reproducible from it. Do not hand-edit files
in this directory — fix the workbook or the build script instead, then
regenerate:

```
python3 tools/build_data.py
```

Current outputs: `boxes.json`, `seais.json`, `population.json`, `regions.json`,
`links.json`. Later: `box-segments.json` once that table exists in the
workbook (see `docs/DATA_MODEL.md` #6).

`links.json` (Phase 3, Milestone 4) is a small hand-authored subset — 7 rows
covering the Roman/Byzantine/Frankish/French/Holy-Roman/Ottoman succession
chain from `docs/IMPLEMENTATION_PLAN.md`'s "Mediterranean / Europe" Phase 3
candidate list — not full coverage of every box in `boxes.json`.
