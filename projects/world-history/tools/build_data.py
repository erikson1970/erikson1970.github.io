#!/usr/bin/env python3
"""Build data/*.json from source/*.xlsx.

Build-time only -- nothing in this script or its output requires a server.
See docs/IMPLEMENTATION_PLAN.md Phase 1.

Usage:
    python3 tools/build_data.py
    python3 tools/build_data.py --source source/world_history_chart_dataset_v2.xlsx --out data

Exits non-zero and writes nothing if validation finds any ERROR-level problem
(see tools/wh_data.py for the severity policy). Warnings are printed but do
not block the build.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import wh_data  # noqa: E402

# Maps sheet name -> output filename. BoxSegments isn't in the workbook yet
# (see docs/DATA_MODEL.md #6) so it isn't produced here.
OUTPUTS = {
    "Boxes": "boxes.json",
    "SEAIs": "seais.json",
    "Population": "population.json",
    "Regions": "regions.json",
    "Links": "links.json",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default="source/world_history_chart_dataset_v2.xlsx")
    parser.add_argument("--out", default="data")
    args = parser.parse_args()

    source_path = Path(args.source)
    if not source_path.exists():
        print(f"error: source workbook not found: {source_path}", file=sys.stderr)
        return 1

    tables = wh_data.load_workbook(str(source_path))
    report = wh_data.validate_all(tables)

    for w in report.warnings:
        print(f"warning: {w}", file=sys.stderr)
    for e in report.errors:
        print(f"error: {e}", file=sys.stderr)

    counts = {name: len(rows) for name, rows in tables.items()}
    print(f"loaded: {counts}", file=sys.stderr)
    print(f"{len(report.warnings)} warning(s), {len(report.errors)} error(s)", file=sys.stderr)

    if not report.ok:
        print("build FAILED: fix the error(s) above before data/*.json is regenerated", file=sys.stderr)
        return 1

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    for sheet_name, filename in OUTPUTS.items():
        out_path = out_dir / filename
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(tables[sheet_name], f, indent=2, ensure_ascii=False, sort_keys=False)
            f.write("\n")
        print(f"wrote {out_path} ({len(tables[sheet_name])} rows)", file=sys.stderr)

    print("build OK", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
