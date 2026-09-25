import json
import random
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))

import nnue_model as nm  # noqa: E402

TOOL = ROOT / "engine" / "build" / "release" / "sixnnue.exe"


def hex_distance(a, b):
    dq, dr = a[0] - b[0], a[1] - b[1]
    return max(abs(dq), abs(dr), abs(dq + dr))


def makes_six(moves, cell, player) -> bool:
    mine = {m for i, m in enumerate(moves) if nm._player(i) == player} | {cell}
    for dq, dr in nm.AXES:
        run = 1
        for sign in (1, -1):
            k = 1
            while (cell[0] + sign * dq * k, cell[1] + sign * dr * k) in mine:
                run += 1
                k += 1
        if run >= 6:
            return True
    return False


def random_position(rng: random.Random, stones: int) -> list[tuple[int, int]]:
    """A legal unfinished position: stones near earlier ones, never completing six in a row."""
    moves = [(0, 0)]
    while len(moves) < stones:
        base = rng.choice(moves)
        cell = (base[0] + rng.randint(-3, 3), base[1] + rng.randint(-3, 3))
        if cell not in moves and hex_distance(cell, base) <= 3 and not makes_six(moves, cell, nm._player(len(moves))):
            moves.append(cell)
    return moves


def python_eval(model: nm.SixNnue, moves):
    grid, mover = nm.grids([moves])
    g = torch.as_tensor(grid)
    sums = model.sums(g)
    second = torch.as_tensor(nm.second_stone_flags(np.array([len(moves)])))
    value = model.value(sums, torch.as_tensor(mover), second)
    # Policy cells: every empty cell within 2 of the last stone, sorted by (q, r), as the tool prints them.
    last = moves[-1]
    cells = sorted((last[0] + dq, last[1] + dr) for dq in range(-2, 3) for dr in range(-2, 3)
                   if hex_distance((last[0] + dq, last[1] + dr), last) <= 2 and (last[0] + dq, last[1] + dr) not in moves)
    stones = np.asarray(moves)
    lo, hi = stones.min(axis=0), stones.max(axis=0)
    shift = nm.GRID // 2 - (lo + hi) // 2
    rc = torch.as_tensor([[[c[1] + shift[1], c[0] + shift[0]] for c in cells]])
    scores = model.cell_scores(g, torch.as_tensor(mover), rc)[0]
    return float(value[0]), sums[0].detach().numpy(), dict(zip(cells, scores.detach().numpy().tolist()))


class Features(unittest.TestCase):
    def test_line_codes_match_the_engines_definition(self):
        grid, _ = nm.grids([[(0, 0), (1, 0)]])  # X at the centre, O one step along axis 0
        codes = nm.line_codes(torch.as_tensor(grid))[0]  # [2 viewers, 3 axes, H, W]
        stones = np.array([(0, 0), (1, 0)])
        shift = nm.GRID // 2 - (stones.min(axis=0) + stones.max(axis=0)) // 2
        r0, q0 = 0 + shift[1], 0 + shift[0]
        self.assertEqual(int(codes[0, 0, r0, q0]), 2 * 3 ** 5)   # X's view: O's stone one step ahead
        self.assertEqual(int(codes[1, 0, r0, q0]), 1 * 3 ** 5)   # O's view: its own stone
        # The cell (2, 0) sees O one step behind it and X two steps behind.
        self.assertEqual(int(codes[0, 0, r0, q0 + 2]), 2 * 3 ** 4 + 1 * 3 ** 3)

    def test_an_empty_neighbourhood_adds_nothing_so_a_lone_far_cell_does_not_count(self):
        model = nm.SixNnue(dim=4, hidden=4)
        sums = model.sums(torch.zeros(1, 2, nm.GRID, nm.GRID, dtype=torch.int8))
        self.assertTrue(torch.allclose(sums, torch.zeros_like(sums)))


@unittest.skipUnless(TOOL.exists(), "engine tool sixnnue not built")
class AgreesWithTheEngine(unittest.TestCase):
    def test_the_per_cell_model_matches_the_engine_exactly(self):
        self.test_value_sums_and_policy_match_the_engine_exactly(percell=True)

    def test_value_sums_and_policy_match_the_engine_exactly(self, percell=False):
        torch.manual_seed(0)
        model = nm.SixNnue(dim=8, hidden=8, percell=percell)
        with torch.no_grad():
            model.table.weight.normal_(0, 0.1)
            model.bias0.normal_(0.5, 0.1)
        rng = random.Random(3)
        positions = [random_position(rng, n) for n in (1, 2, 5, 12, 25, 40)]
        with tempfile.TemporaryDirectory() as tmp:
            weights = Path(tmp) / "w.nnue"
            nm.export(model, weights)
            text = "\n".join("8 " + " ".join(f"{q} {r}" for q, r in p) for p in positions) + "\n"
            out = subprocess.run([str(TOOL), str(weights)], input=text, capture_output=True, text=True, check=True).stdout
        for moves, line in zip(positions, out.strip().splitlines()):
            parts = line.split()
            value = float(parts[0])
            sums = np.array([float(x) for x in parts[1:1 + 2 * model.dim]]).reshape(2, model.dim)
            policy = {tuple(int(v) for v in p.split(":")[0].split(",")): float(p.split(":")[1]) for p in parts[1 + 2 * model.dim:]}
            py_value, py_sums, py_policy = python_eval(model, moves)
            self.assertAlmostEqual(value, py_value, places=4, msg=f"value, {len(moves)} stones")
            np.testing.assert_allclose(sums, py_sums, atol=1e-4, err_msg=f"sums, {len(moves)} stones")
            self.assertEqual(sorted(policy), sorted(py_policy))
            for cell in policy:
                self.assertAlmostEqual(policy[cell], py_policy[cell], places=4, msg=f"policy {cell}")


if __name__ == "__main__":
    unittest.main()
