"""Recording rival match results for the dashboard."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ARENA = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ARENA))

import record_rival  # noqa: E402

SUMMARY = {
    "engineA": "HexNet gen-0013/net 2000ms", "engineB": "Strix 256 sims live strong", "radius": 8,
    "pairs": 6, "wins": 12, "losses": 0, "draws": 0, "forfeits": 0, "pentanomial": [0, 0, 0, 0, 6],
    "elo": 2400.0, "eloLow": 2400.0, "eloHigh": 2400.0,
}


class RecordRival(unittest.TestCase):
    def test_records_a_match_and_replaces_its_own_earlier_entry(self):
        with tempfile.TemporaryDirectory() as tmp:
            runs = Path(tmp) / "runs"
            run_dir = Path(tmp) / "data" / "arena" / "20260915-184000-hexnet-vs-strix"
            run_dir.mkdir(parents=True)
            summary = run_dir / "summary.json"
            summary.write_text(json.dumps(SUMMARY), encoding="utf-8")
            entry = record_rival.record(summary, note="shared the GPU with self-play", runs=runs)
            self.assertEqual((entry["wins"], entry["losses"], entry["generation"]), (12, 0, 13))
            self.assertEqual(entry["rival"], "Strix 256 sims live strong")
            self.assertEqual(entry["note"], "Shared the GPU with self-play")
            # A sweep is recomputed into an honest one-sided bound, not the +-2400 the old summary holds.
            self.assertEqual(entry["eloHigh"], None)
            self.assertTrue(0 < entry["eloLow"] < entry["elo"] < 1000)
            record_rival.record(summary, runs=runs)  # same run recorded again
            saved = json.loads((runs / "rivals.json").read_text(encoding="utf-8"))
            self.assertEqual(len(saved), 1)
            self.assertNotIn("note", saved[0])

    def test_keeps_the_newest_results_in_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            runs = Path(tmp) / "runs"
            for i in range(record_rival.KEEP + 3):
                run_dir = Path(tmp) / "data" / "arena" / f"run-{i:03d}"
                run_dir.mkdir(parents=True)
                summary = run_dir / "summary.json"
                summary.write_text(json.dumps(dict(SUMMARY, wins=i)), encoding="utf-8")
                record_rival.record(summary, runs=runs)
            saved = json.loads((runs / "rivals.json").read_text(encoding="utf-8"))
            self.assertEqual(len(saved), record_rival.KEEP)
            self.assertEqual(saved[-1]["wins"], record_rival.KEEP + 2)
            self.assertEqual([e["when"] for e in saved], sorted(e["when"] for e in saved))


if __name__ == "__main__":
    unittest.main()
