import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))

import nnue_data  # noqa: E402
import nnue_train  # noqa: E402


def game(i):
    # A short legal game, shifted so games differ (and some land in validation).
    base = [(0, 0), (1, 0), (1, 1), (-1, 0), (0, -1), (2, -1), (3, -2), (0, 2), (-1, 2), (4, -3), (-2, 3)]
    return {"radius": 8, "winner": "X" if i % 2 else "O", "moves": [(q + i % 5, r - i % 3) for q, r in base]}


class Training(unittest.TestCase):
    def test_the_per_cell_model_learns_too(self):
        self.test_a_short_run_learns_and_writes_engine_weights(extra=["--percell"])

    def test_a_short_run_learns_and_writes_engine_weights(self, extra=()):
        with tempfile.TemporaryDirectory() as tmp:
            data, out = Path(tmp) / "data", Path(tmp) / "out"
            data.mkdir()
            games = [game(i) for i in range(120)]
            rows = {k: [] for k in ("game", "n", "value", "result", "cells", "probs")}
            for g, record in enumerate(games):
                for n in range(1, len(record["moves"])):
                    rows["game"].append(g)
                    rows["n"].append(n)
                    rows["value"].append(0.5 if nnue_data.result_for_mover(record["winner"], n) > 0 else -0.5)
                    rows["result"].append(nnue_data.result_for_mover(record["winner"], n))
                    nxt = record["moves"][n]
                    rows["cells"].append([nxt] + [(99, 99)] * 3)
                    rows["probs"].append([1.0, 0, 0, 0])
            nnue_data.save_chunk(data / "chunk-0000.npz", games, {
                "game": np.array(rows["game"], np.int32), "n": np.array(rows["n"], np.int16),
                "value": np.array(rows["value"], np.float16), "result": np.array(rows["result"], np.int8),
                "cells": np.array(rows["cells"], np.int16), "probs": np.array(rows["probs"], np.float16)})
            with unittest.mock.patch.object(nnue_train, "pause_reason", lambda: None):
                code = nnue_train.main(["--data", str(data), "--out", str(out), "--device", "cpu", "--dim", "8",
                                        "--hidden", "8", "--epochs", "4", "--batch", "64", "--workers", "1",
                                        "--eval-every", "10", *extra])
            self.assertEqual(code, 0)
            self.assertTrue((out / "six.nnue").exists())
            first, last = [__import__("json").loads(l) for l in (out / "metrics.jsonl").read_text().splitlines()][::len(
                (out / "metrics.jsonl").read_text().splitlines()) - 1][:2]
            self.assertLess(last["value_mse"], first["value_mse"])


if __name__ == "__main__":
    unittest.main()
