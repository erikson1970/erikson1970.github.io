# tools/

Build-time scripts only. Nothing here runs in production.

Planned:

- `build_data.py` — reads `source/*.xlsx`, validates it, and writes `data/*.json`.
- `validate_data.py` — standalone validation pass (duplicate IDs, broken foreign keys, malformed years, invalid population ranges, unknown relation types).

See `docs/IMPLEMENTATION_PLAN.md` Phase 1.
