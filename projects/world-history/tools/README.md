# tools/

Build-time scripts only. Nothing here runs in production — the deployed site
only ever reads the generated JSON in `data/`.

- `wh_data.py` — shared loading/validation library (workbook -> row dicts,
  the validation rules, and the ERROR/WARNING severity policy). Imported by
  both scripts below; not a CLI itself.
- `build_data.py` — reads `source/*.xlsx`, validates it, and writes
  `data/*.json`. Fails (exit 1, writes nothing) if validation finds any
  ERROR-level problem; warnings are printed but don't block the build.
  ```
  python3 tools/build_data.py
  ```
- `validate_data.py` — same validation as `build_data.py`, but only reports;
  writes nothing. Useful as a quick check on the workbook alone.
  ```
  python3 tools/validate_data.py
  ```

Both accept `--source <path>`; `build_data.py` also accepts `--out <dir>`.
Their default paths are relative to this project directory
(`projects/world-history/`), so run them with that as the working directory:

```
cd projects/world-history
python3 tools/build_data.py
```

Requires `openpyxl` (`pip install -r tools/requirements.txt`).

Run `validate_data.py` (or `build_data.py`, which validates first) after any
edit to the workbook, and regenerate `data/*.json` before committing a
workbook change. `data/*.json` should always be reproducible from
`source/*.xlsx` — if it isn't, that's a bug in these scripts, not something
to hand-patch in `data/`.

See `docs/IMPLEMENTATION_PLAN.md` Phase 1.
