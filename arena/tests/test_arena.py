"""Arena tests: rules against the TypeScript fixtures, statistics, and a real engine game.

Run: py -3.12 -m unittest discover -s arena/tests
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ARENA = Path(__file__).resolve().parents[1]
ROOT = ARENA.parent
sys.path.insert(0, str(ARENA))

from engines import parse_spec  # noqa: E402
from match import play_game  # noqa: E402
from openings import openings  # noqa: E402
from six_rules import Game  # noqa: E402
from sprt import elo_estimate, llr, sprt_bounds  # noqa: E402


def cell_hash(q: int, r: int) -> int:
    return ((q * 73856093) & 0xFFFFFFFF) ^ ((r * 19349663) & 0xFFFFFFFF)


class RulesMatchFixtures(unittest.TestCase):
    def test_every_fixture_position(self):
        fixtures = ROOT / "engine" / "tests" / "fixtures" / "games.txt"
        game = Game(9)
        checked = 0
        for line in fixtures.read_text(encoding="utf-8").splitlines():
            if not line or line.startswith("#"):
                continue
            words = line.split()
            if words[0] == "game":
                game = Game(int(words[2]))
                continue
            facts = words[1:]
            if words[0] == "stone":
                self.assertIsNone(game.place((int(words[1]), int(words[2]))))
                facts = words[3:]
            expected = dict(f.split("=", 1) for f in facts)
            playable = game.playable_cells()
            total = 0
            for q, r in playable:
                total = (total + cell_hash(q, r)) & 0xFFFFFFFF
            self.assertEqual(str(len(playable)), expected["playable"])
            self.assertEqual(str(total), expected["sum"])
            self.assertEqual(game.winner or "-", expected["winner"])
            self.assertEqual(game.current, expected["current"])
            self.assertEqual(str(game.turn), expected["turn"])
            self.assertEqual(str(game.stones_left), expected["left"])
            checked += 1
        self.assertGreater(checked, 20000)


class Specs(unittest.TestCase):
    def test_hexnnue_runs_the_alpha_beta_engine_with_nnue_weights(self):
        spec = parse_spec("hexnnue:2000:runs/nnue/v1/six.nnue,nnueOrdering=0")
        self.assertIn("--nnue", spec.command)
        self.assertTrue(spec.command[spec.command.index("--nnue") + 1].endswith("six.nnue"))
        self.assertEqual(spec.go, "go movetime 2000")
        self.assertEqual(spec.setup, ["setoption nnueOrdering 0"])
        self.assertIn("NNUE", spec.label)


class Statistics(unittest.TestCase):
    def test_even_results_give_zero_elo_and_no_evidence_for_a_gain(self):
        penta = [5, 20, 50, 20, 5]
        self.assertAlmostEqual(elo_estimate(penta).elo, 0.0, places=6)
        self.assertLess(llr(penta, 0, 50), 0)

    def test_a_clearly_stronger_engine_accepts_h1(self):
        penta = [2, 8, 40, 60, 90]
        lower, upper = sprt_bounds()
        self.assertGreater(llr(penta, 0, 50), upper)
        self.assertGreater(elo_estimate(penta).low, 0)

    def test_a_few_lopsided_pairs_are_not_enough_to_stop(self):
        lower, upper = sprt_bounds()
        for penta in ([0, 0, 0, 0, 2], [0, 0, 0, 0, 4], [3, 0, 0, 0, 0]):
            self.assertTrue(lower < llr(penta, 0, 30) < upper, penta)

    def test_book_openings_are_legal_turn_starts_without_fours(self):
        from openings import DEFAULT_BOOK
        from make_book import holds_four
        lines = openings(300, 5, DEFAULT_BOOK)
        self.assertEqual(lines, openings(300, 5, DEFAULT_BOOK))
        for moves in lines:
            game = Game(8)
            for m in moves:
                self.assertIsNone(game.place(m))
                self.assertFalse(holds_four(game, m), moves)
            self.assertEqual(game.stones_left, 2)

    def test_openings_are_legal_and_reproducible(self):
        self.assertEqual(openings(10, 7), openings(10, 7))
        for moves in openings(40):
            game = Game(8)
            for m in moves:
                self.assertIsNone(game.place(m))
            self.assertEqual((game.current, game.stones_left), ("X", 2))


@unittest.skipUnless((ROOT / "engine" / "build" / "release" / "sixengine.exe").exists(), "engine not built")
class RealGame(unittest.TestCase):
    def test_hexbot_plays_itself_to_a_legal_finish(self):
        spec = parse_spec("hexbot-depth:1")
        outcome = play_game(spec, spec, openings(1)[0], 8, 200)
        self.assertIn(outcome.reason, ("six", "length"), outcome.detail)
        replay = Game(8)
        for m in outcome.moves:
            self.assertIsNone(replay.place(m))
        self.assertEqual(replay.winner, outcome.winner)

    def test_a_setting_reaches_the_search_that_plays(self):
        """rootThreatNodes belongs to both searches; the network's is the one that plays when a net is loaded."""
        from engines import engine_exe
        from protocol import EngineClient

        tiny = ROOT / "engine" / "tests" / "fixtures" / "tiny.onnx"
        if not tiny.exists():
            self.skipTest("no fixture network")
        engine = EngineClient([str(engine_exe()), "--net", str(tiny), "--cpu"], "sixengine", cwd=str(ROOT))
        try:
            engine.handshake(timeout=120)
            engine.send("setoption rootThreatNodes 12345")
            engine.send("setoption cpuct 1234")
            engine.send("options")
            options = {}
            while True:
                line = engine.wait_for("", 60.0)
                if line == "optionsdone":
                    break
                if line.startswith("option "):
                    _, name, value = line.split()
                    self.assertNotIn(name, options, "a setting is reported twice")
                    options[name] = int(value)
            self.assertEqual(options["rootThreatNodes"], 12345)
            self.assertEqual(options["cpuct"], 1234)
            self.assertIn("secondStoneShare", options)
        finally:
            engine.close()


if __name__ == "__main__":
    unittest.main()
