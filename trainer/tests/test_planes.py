import json
import random
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))
sys.path.insert(0, str(ROOT / "arena"))

from planes import CROP, HALF, PLANES, crop_center, crop_index, raw_planes, transform  # noqa: E402
from six_rules import AXES, Game, player_for_stone  # noqa: E402

FIXTURES = ROOT / "engine" / "tests" / "fixtures" / "games.txt"


def fixture_games():
    games, current = [], None
    for line in FIXTURES.read_text(encoding="utf-8").splitlines():
        words = line.split()
        if not words or words[0].startswith("#"):
            continue
        if words[0] == "game":
            current = {"radius": int(words[2]), "moves": []}
            games.append(current)
        elif words[0] == "stone" and current is not None:
            current["moves"].append((int(words[1]), int(words[2])))
    return games


class Symmetries(unittest.TestCase):
    def test_twelve_distinct_maps_that_keep_distance_and_lines(self):
        cells = [(1, 0), (2, -1), (0, 3), (-2, 5)]
        images = {tuple(transform(c, s) for c in cells) for s in range(12)}
        self.assertEqual(len(images), 12)
        for s in range(12):
            self.assertEqual(transform((0, 0), s), (0, 0))
            for dq, dr in AXES:
                image = transform((dq, dr), s)
                self.assertIn(image, [a for a in AXES] + [(-a, -b) for a, b in AXES])

    def test_a_win_stays_a_win_under_every_symmetry(self):
        game = fixture_games()[0]
        for s in range(12):
            original, mapped = Game(game["radius"]), Game(game["radius"])
            for m in game["moves"]:
                self.assertIsNone(original.place(m))
                self.assertIsNone(mapped.place(transform(m, s)))
            self.assertEqual(original.winner, mapped.winner)


class RawPlanes(unittest.TestCase):
    def test_centre_rounds_half_up_including_negatives(self):
        self.assertEqual(crop_center([(0, 0), (1, 0)]), (1, 0))
        self.assertEqual(crop_center([(0, 0), (-1, 0)]), (0, 0))
        # Only the last four count: mean -3.5 rounds up to -3.
        self.assertEqual(crop_center([(5, 5), (-3, -3), (-3, -3), (-4, -4), (-4, -4)]), (-3, -3))

    def test_planes_match_the_rules_on_fixture_positions(self):
        rng = random.Random(3)
        checked = 0
        for game in fixture_games():
            replay = Game(game["radius"])
            for n in range(len(game["moves"])):
                if rng.random() < 0.15:
                    moves = game["moves"][:n]
                    planes, center = raw_planes(moves, game["radius"])
                    mover = player_for_stone(n)
                    for row in range(CROP):
                        for col in range(CROP):
                            cell = (col - HALF + center[0], row - HALF + center[1])
                            owner = replay.cells.get(cell)
                            self.assertEqual(planes[1, row, col], 1.0 if owner == mover else 0.0)
                            self.assertEqual(planes[2, row, col], 1.0 if owner and owner != mover else 0.0)
                            self.assertEqual(planes[3, row, col], 1.0 if replay.is_playable(cell) else 0.0)
                    self.assertEqual(planes[6, 0, 0], 1.0 if n > 0 and replay.stones_left == 1 else 0.0)
                    checked += 1
                replay.place(game["moves"][n])
                if replay.winner:
                    break
        self.assertGreater(checked, 500)

    def test_turn_markers(self):
        moves = [(0, 0), (1, 0), (2, 0), (0, 1)]  # X, O O, then X's first stone of turn 3
        planes, center = raw_planes(moves, 8)
        marked = lambda p: sorted(i for i in range(CROP * CROP) if planes[p].flat[i])
        self.assertEqual(marked(4), [crop_index((0, 1), center)])
        self.assertEqual(marked(5), sorted([crop_index((1, 0), center), crop_index((2, 0), center)]))
        planes, center = raw_planes(moves[:3], 9)  # X to start turn 3: O's turn was the last
        self.assertEqual(planes[4].sum(), 0)
        self.assertEqual(marked(5), sorted([crop_index((1, 0), center), crop_index((2, 0), center)]))
        self.assertEqual(planes[7, 3, 3], 1.0)
        self.assertEqual(len(PLANES), planes.shape[0])


if __name__ == "__main__":
    unittest.main()
