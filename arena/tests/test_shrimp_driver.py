"""Shrimp driver tests: Shrimp's rules against the shared game records, and real turns over the protocol.

Needs a local build in rivals/shrimp; skipped otherwise.
Run: py -3.12 -m unittest discover -s arena/tests -p "test_shrimp*"
"""
from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

ARENA = Path(__file__).resolve().parents[1]
ROOT = ARENA.parent
sys.path.insert(0, str(ARENA))

from engines import parse_spec, shrimp_python  # noqa: E402
from openings import openings  # noqa: E402
from protocol import EngineClient  # noqa: E402
from six_rules import AXES, Game  # noqa: E402

VISITS = 128  # enough for the tactics below, and quick on the CPU

# X to move with an open four on r = 0: (-1,0)(-2,0)(4,0)(5,0) are all empty.
X_CAN_WIN = [(0, 0), (0, -3), (1, -3), (1, 0), (2, 0), (-3, 3), (5, -4), (3, 0), (0, 4), (-4, -1), (6, 2)]
# X to move; O just made an open four on r = 2 and X has no threat of its own.
O_THREATENS = [(0, 0), (0, 2), (1, 2), (3, -3), (-3, 0), (2, 2), (-5, 1), (5, -1), (-2, -2), (3, 2), (4, -5)]


def position(moves: list[tuple[int, int]]) -> Game:
    game = Game(8)
    for cell in moves:
        assert game.place(cell) is None, cell
    return game


def can_win_next_turn(game: Game, player: str) -> bool:
    """Whether `player` has a six-cell window holding four or more of its stones and none of the other side's."""
    for (q, r), owner in game.cells.items():
        if owner != player:
            continue
        for dq, dr in AXES:
            for start in range(-5, 1):
                window = [(q + dq * (start + i), r + dr * (start + i)) for i in range(6)]
                owners = [game.cells.get(c) for c in window]
                if owners.count(player) >= 4 and all(o in (None, player) for o in owners):
                    return True
    return False


@unittest.skipUnless(shrimp_python().exists(), "Shrimp not built in rivals/shrimp")
class ShrimpRules(unittest.TestCase):
    def test_shrimp_engine_agrees_with_the_shared_game_records(self):
        run = subprocess.run([str(shrimp_python()), str(ARENA / "drivers" / "shrimp_driver.py"), "--selftest"],
                             capture_output=True, text=True, timeout=600)
        self.assertEqual(run.returncode, 0, run.stderr[-2000:])
        self.assertIn("radius-8 game records", run.stdout)


@unittest.skipUnless(shrimp_python().exists(), "Shrimp not built in rivals/shrimp")
class ShrimpTurns(unittest.TestCase):
    client: EngineClient

    @classmethod
    def setUpClass(cls):
        spec = parse_spec(f"shrimp:{VISITS}")
        cls.spec = spec
        cls.client = EngineClient(spec.command, spec.label, cwd=str(ROOT), env=spec.env)
        cls.client.handshake(timeout=120)
        cls.client.new_game()

    @classmethod
    def tearDownClass(cls):
        cls.client.close()

    def play(self, moves: list[tuple[int, int]]) -> tuple[Game, list[tuple[int, int]]]:
        game = position(moves)
        needed = game.stones_left
        cells = self.client.best_turn(list(game.moves), 8, self.spec.go, self.spec.move_timeout)
        self.assertTrue(1 <= len(cells) <= needed, cells)
        for cell in cells:
            self.assertIsNone(game.place(cell), f"illegal stone {cell}")
        if not game.winner:
            self.assertEqual(len(cells), needed)
        return game, cells

    def test_plays_a_legal_turn_from_a_book_opening(self):
        game, cells = self.play(openings(1)[0])
        self.assertEqual(len(cells), 2)

    def test_opens_at_the_origin(self):
        _, cells = self.play([])
        self.assertEqual(cells, [(0, 0)])

    def test_takes_a_win(self):
        game, _ = self.play(X_CAN_WIN)
        self.assertEqual(game.winner, "X")

    def test_finishes_a_half_played_winning_turn(self):
        game, cells = self.play(X_CAN_WIN + [(4, 0)])
        self.assertEqual(len(cells), 1)
        self.assertEqual(game.winner, "X")

    def test_blocks_an_open_four(self):
        self.assertTrue(can_win_next_turn(position(O_THREATENS), "O"))
        game, _ = self.play(O_THREATENS)
        self.assertFalse(can_win_next_turn(game, "O"), sorted(c for c, p in game.cells.items() if p == "X"))

    def test_plays_a_position_that_does_not_open_at_the_origin(self):
        shifted = [(q + 3, r - 2) for q, r in X_CAN_WIN]
        game, _ = self.play(shifted)
        self.assertEqual(game.winner, "X")


if __name__ == "__main__":
    unittest.main()
