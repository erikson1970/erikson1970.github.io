# data/

Generated output only. Everything here is produced by `tools/build_data.py`
from `source/*.xlsx` and must be reproducible from it. Do not hand-edit files
in this directory — fix the workbook or the build script instead, then
regenerate:

```
python3 tools/build_data.py
```

Current outputs: `boxes.json`, `seais.json`, `population.json`, `regions.json`.
Later: `links.json`, `box-segments.json` once those tables exist in the
workbook (see `docs/DATA_MODEL.md` #5–#6).
