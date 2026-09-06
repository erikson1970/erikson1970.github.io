#!/usr/bin/env python3
"""Validate source/*.xlsx without writing anything to data/.

Useful as a fast pre-commit check on the workbook alone. build_data.py runs
the same validation before it writes JSON; this script exists for the case
where you just want the report. See docs/IMPLEMENTATION_PLAN.md Phase 1.

Usage:
    python3 tools/validate_data.py
    python3 tools/validate_data.py --source source/world_history_chart_dataset_v2.xlsx
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import wh_data  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default="source/world_history_chart_dataset_v2.xlsx")
    args = parser.parse_args()

    source_path = Path(args.source)
    if not source_path.exists():
        print(f"error: source workbook not found: {source_path}", file=sys.stderr)
        return 1

    tables = wh_data.load_workbook(str(source_path))
    report = wh_data.validate_all(tables)

    counts = {name: len(rows) for name, rows in tables.items()}
    print(f"loaded: {counts}")
    for w in report.warnings:
        print(f"warning: {w}")
    for e in report.errors:
        print(f"error: {e}")
    print(f"{len(report.warnings)} warning(s), {len(report.errors)} error(s)")

    if not report.ok:
        print("VALIDATION FAILED")
        return 1

    print("VALIDATION OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
