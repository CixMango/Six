"""netmatch: two networks in one sixmatch process (skipped until sixmatch is built)."""
from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ARENA = Path(__file__).resolve().parents[1]
ROOT = ARENA.parent
sys.path.insert(0, str(ARENA))

from six_rules import Game  # noqa: E402

BUILDS = [ROOT / "engine" / "build" / name / "sixmatch.exe" for name in ("release", "dev")]
TINY = ROOT / "engine" / "tests" / "fixtures" / "tiny.onnx"


@unittest.skipUnless(any(p.exists() for p in BUILDS), "sixmatch isn't built")
class NetMatch(unittest.TestCase):
    def test_plays_paired_legal_games_and_writes_a_summary(self):
        import netmatch
        os.environ.setdefault("SIX_MATCH", str(next(p for p in BUILDS if p.exists())))
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            code = netmatch.main([str(TINY), str(TINY), "--movetime", "20", "--pairs", "2", "--concurrency", "2",
                                  "--max-stones", "80", "--cpu", "--set-b", "reuseTree=0", "--out", str(out)])
            self.assertEqual(code, 0)
            summary = json.loads((out / "summary.json").read_text(encoding="utf-8"))
            self.assertEqual(summary["pairs"], 2)
            self.assertEqual(summary["wins"] + summary["losses"] + summary["draws"], 4)
            self.assertEqual(summary["forfeits"], 0)
            self.assertIn("reuseTree=0", summary["engineB"])
            for index in range(4):
                replay = json.loads((out / f"game-{index:04d}.json").read_text(encoding="utf-8"))
                game = Game(8)
                for q, r in replay["moves"]:
                    self.assertIsNone(game.place((q, r)))
                # Each pair plays one opening twice with the sides swapped.
                a_is_x = index % 2 == 0
                self.assertEqual(replay["players"]["X"]["name"] == summary["engineA"][:40], a_is_x)

    def test_one_side_can_be_given_its_own_time_per_turn(self):
        import netmatch
        os.environ.setdefault("SIX_MATCH", str(next(p for p in BUILDS if p.exists())))
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            code = netmatch.main([str(TINY), str(TINY), "--movetime-a", "60", "--movetime-b", "20", "--pairs", "1",
                                  "--concurrency", "1", "--max-stones", "60", "--cpu", "--out", str(out)])
            self.assertEqual(code, 0)
            summary = json.loads((out / "summary.json").read_text(encoding="utf-8"))
            self.assertIn("60ms", summary["engineA"])
            self.assertIn("20ms", summary["engineB"])
            think = summary["secondsPerTurn"]
            self.assertGreater(think[summary["engineA"]], think[summary["engineB"]])


if __name__ == "__main__":
    unittest.main()
