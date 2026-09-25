import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))

import nnue_data  # noqa: E402
from planes import CROP, crop_center, crop_index  # noqa: E402

GAME = {"radius": 8, "winner": "O",
        "moves": [[0, 0], [1, 0], [1, 1], [-1, 0], [0, -1], [2, -1], [3, -2], [0, 2], [-1, 2]]}


class Positions(unittest.TestCase):
    def test_positions_are_every_non_final_stone_count_and_seeded(self):
        a = nnue_data.pick_positions(len(GAME["moves"]), share=1.0, seed=7)
        self.assertEqual(a, list(range(1, len(GAME["moves"]))))
        self.assertEqual(nnue_data.pick_positions(9, share=0.5, seed=3), nnue_data.pick_positions(9, share=0.5, seed=3))

    def test_result_is_from_the_movers_view(self):
        # Stone 1 is O's (O moves on turn 2), stone 3 is X's.
        self.assertEqual(nnue_data.result_for_mover("O", 1), 1)
        self.assertEqual(nnue_data.result_for_mover("O", 3), -1)
        self.assertEqual(nnue_data.result_for_mover(None, 3), 0)


class Labels(unittest.TestCase):
    def test_policy_top_cells_are_legal_and_map_back_to_board_cells(self):
        moves = [tuple(m) for m in GAME["moves"][:5]]
        center = crop_center(moves)
        target = (2, 2)
        logits = np.full((1, CROP * CROP), -10.0, dtype=np.float32)
        logits[0, crop_index(target, center)] = 5.0
        logits[0, crop_index((0, 0), center)] = 9.0  # occupied: must never be chosen
        value_logits = np.array([[2.0, 0.0]], dtype=np.float32)
        planes, _ = nnue_data.planes_for(moves, 8)
        labels = nnue_data.labels_from_outputs(logits, value_logits, planes[None], [center], k=4)
        cells, probs, value = labels["cells"][0], labels["probs"][0], labels["value"][0]
        self.assertEqual(tuple(cells[0]), target)
        self.assertNotIn((0, 0), [tuple(c) for c in cells])
        self.assertAlmostEqual(float(probs.sum()), 1.0, places=2)
        self.assertAlmostEqual(float(value), np.tanh(1.0), places=3)


class Chunks(unittest.TestCase):
    def test_a_chunk_round_trips(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "chunk-0000.npz"
            games = [GAME, dict(GAME, winner="X")]
            rows = {"game": np.array([0, 1], np.int32), "n": np.array([3, 5], np.int16),
                    "value": np.array([0.5, -0.25], np.float16), "result": np.array([1, -1], np.int8),
                    "cells": np.zeros((2, 4, 2), np.int16), "probs": np.full((2, 4), 0.25, np.float16)}
            nnue_data.save_chunk(path, games, rows)
            back = nnue_data.load_chunk(path)
            self.assertEqual(back["moves"][1][:5], [tuple(m) for m in GAME["moves"][:5]])
            self.assertEqual(list(back["radius"]), [8, 8])
            self.assertEqual(list(back["n"]), [3, 5])
            self.assertAlmostEqual(float(back["value"][1]), -0.25)


if __name__ == "__main__":
    unittest.main()
