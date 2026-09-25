import random
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))
sys.path.insert(0, str(ROOT / "arena"))

from model import (AUX_PREFIXES, AXES, DERIVED_COUNTS, HexConv, HexNet, LineWindows, NetConfig,  # noqa: E402
                   load_checkpoint, save_checkpoint)
from planes import CROP, HALF, PLANES, raw_planes  # noqa: E402
from six_rules import Game, player_for_stone  # noqa: E402
from test_planes import fixture_games  # noqa: E402


def brute_force_derived(game: Game, center, mover):
    """Cells in windows with exactly k of a side's stones and none of the other's, over windows that lie inside the crop."""
    expected = np.zeros((2 * len(DERIVED_COUNTS), CROP, CROP), dtype=np.float32)
    for row in range(CROP):
        for col in range(CROP):
            for dq, dr in AXES:
                cells = [(col + i * dq, row + i * dr) for i in range(6)]
                if not all(0 <= c < CROP and 0 <= r < CROP for c, r in cells):
                    continue
                owners = [game.cells.get((c - HALF + center[0], r - HALF + center[1])) for c, r in cells]
                for side, who in enumerate((mover, "O" if mover == "X" else "X")):
                    mine = sum(1 for o in owners if o == who)
                    theirs = sum(1 for o in owners if o and o != who)
                    if theirs == 0 and mine in DERIVED_COUNTS:
                        plane = side * len(DERIVED_COUNTS) + DERIVED_COUNTS.index(mine)
                        for c, r in cells:
                            expected[plane, r, c] = 1.0
    return expected


class DerivedPlanes(unittest.TestCase):
    def test_line_windows_match_brute_force_away_from_the_crop_edge(self):
        windows = LineWindows()
        rng = random.Random(11)
        checked = 0
        for game in fixture_games():
            replay = Game(game["radius"])
            for n, move in enumerate(game["moves"]):
                if rng.random() < 0.05:
                    planes, center = raw_planes(game["moves"][:n], game["radius"])
                    got = windows(torch.from_numpy(planes[None, 1:2]), torch.from_numpy(planes[None, 2:3]))[0].numpy()
                    want = brute_force_derived(replay, center, player_for_stone(n))
                    # Windows reaching past the crop see its outside as empty, so compare only cells 5+ from the edge.
                    inner = (slice(None), slice(5, CROP - 5), slice(5, CROP - 5))
                    self.assertTrue(np.array_equal(got[inner], want[inner]), f"game position {n}")
                    checked += 1
                replay.place(move)
                if replay.winner:
                    break
        self.assertGreater(checked, 100)


class Network(unittest.TestCase):
    def test_hex_conv_ignores_non_neighbours(self):
        conv = HexConv(1, 1)
        with torch.no_grad():
            conv.weight.fill_(1.0)
        x = torch.zeros(1, 1, 5, 5)
        x[0, 0, 1, 1] = 1.0  # up-left of the centre: not a hex neighbour
        self.assertEqual(conv(x)[0, 0, 2, 2].item(), 0.0)
        x[0, 0, 1, 3] = 1.0  # up-right: (q+1, r-1), a neighbour
        self.assertEqual(conv(x)[0, 0, 2, 2].item(), 1.0)

    def test_shapes_and_strict_checkpoint_round_trip(self):
        config = NetConfig(channels=16, blocks=2, pool_blocks=(1,), pool_channels=8, head_channels=8, value_hidden=16)
        model = HexNet(config).eval()
        planes = torch.from_numpy(np.stack([raw_planes([(0, 0), (1, 0), (2, -1)], 8)[0]] * 3))
        policy, opponent, value, score = model(planes)
        self.assertEqual(policy.shape, (3, CROP * CROP))
        self.assertEqual(opponent.shape, (3, CROP * CROP))
        self.assertEqual(value.shape, (3, 2))
        self.assertEqual(score.shape, (3,))
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "net.pt"
            save_checkpoint(path, model, {"step": 7})
            loaded, extra = load_checkpoint(path)
            self.assertEqual(extra["step"], 7)
            self.assertEqual(loaded.config, config)
            self.assertTrue(torch.allclose(loaded.eval()(planes)[0], policy))


    def test_auxiliary_heads_train_but_stay_out_of_the_default_outputs(self):
        config = NetConfig(channels=16, blocks=2, pool_blocks=(1,), pool_channels=8, head_channels=8, value_hidden=16)
        model = HexNet(config).eval()
        planes = torch.from_numpy(np.stack([raw_planes([(0, 0), (1, 0), (2, -1)], 8)[0]] * 3))
        self.assertEqual(len(model(planes)), 4)
        outputs = model(planes, aux=True)
        self.assertEqual(len(outputs), 6)
        future, short_value = outputs[4], outputs[5]
        self.assertEqual(future.shape, (3, config.future_planes, CROP * CROP))
        self.assertEqual(short_value.shape, (3,))
        # A fresh future head predicts sparse placements.
        self.assertTrue(torch.all(torch.sigmoid(future) < 0.05))

    def test_checkpoints_without_auxiliary_heads_still_load(self):
        config = NetConfig(channels=16, blocks=2, pool_blocks=(1,), pool_channels=8, head_channels=8, value_hidden=16)
        model = HexNet(config).eval()
        state = {k: v for k, v in model.state_dict().items() if not k.startswith(AUX_PREFIXES)}
        old_config = {k: v for k, v in config.to_dict().items() if k != "future_planes"}
        planes = torch.from_numpy(raw_planes([(0, 0), (1, 0), (2, -1)], 8)[0][None])
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "old.pt"
            torch.save({"format": "hexnet-1", "config": old_config, "state": state}, path)
            loaded, _ = load_checkpoint(path)
            self.assertTrue(torch.allclose(loaded.eval()(planes)[0], model(planes)[0]))
            # Anything else missing is still an error.
            del state["stem.weight"]
            torch.save({"format": "hexnet-1", "config": old_config, "state": state}, path)
            with self.assertRaises(RuntimeError):
                load_checkpoint(path)

if __name__ == "__main__":
    unittest.main()
