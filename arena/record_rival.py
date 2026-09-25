"""Records a finished rival match in runs/rl/rivals.json, which the training dashboard shows.

  py -3.12 arena/record_rival.py data/arena/<run>/summary.json
  py -3.12 arena/record_rival.py data/arena/<run>/summary.json --note "shared the GPU with self-play"
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sprt import elo_estimate, elo_json  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
RUNS = Path(os.environ.get("SIX_RL_RUNS", ROOT / "runs" / "rl"))
KEEP = 40  # newest results kept


def generation_of(label: str) -> int | None:
    match = re.search(r"gen-(\d{4})", label)
    return int(match.group(1)) if match else None


def record(summary_path: Path, note: str = "", runs: Path = RUNS) -> dict:
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    # Recompute from the pair counts: older summaries hold sweeps pinned to the end of the Elo scale.
    estimate = elo_estimate(summary["pentanomial"]) if summary.get("pentanomial") else None
    elo = {k: elo_json(v) for k, v in (("elo", estimate.elo), ("eloLow", estimate.low), ("eloHigh", estimate.high))} \
        if estimate else {k: summary[k] for k in ("elo", "eloLow", "eloHigh")}
    entry = {
        "when": datetime.fromtimestamp(summary_path.stat().st_mtime).isoformat(timespec="seconds"),
        "ours": summary["engineA"],
        "generation": generation_of(summary["engineA"]),
        "rival": summary["engineB"],
        "pairs": summary["pairs"],
        "wins": summary["wins"],
        "losses": summary["losses"],
        "draws": summary["draws"],
        "forfeits": summary["forfeits"],
        **elo,
        "run": summary_path.parent.name,
    }
    if note:
        entry["note"] = note[0].upper() + note[1:] if note[0].islower() and not note[:2].isupper() else note
    path = runs / "rivals.json"
    try:
        existing = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        existing = []
    existing = [e for e in existing if e.get("run") != entry["run"]] + [entry]
    existing.sort(key=lambda e: e["when"])
    runs.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(existing[-KEEP:], indent=2), encoding="utf-8")
    return entry


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("summary", type=Path)
    parser.add_argument("--note", default="")
    args = parser.parse_args()
    entry = record(args.summary, args.note)
    print(json.dumps(entry, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
