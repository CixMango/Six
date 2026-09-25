import sys
import tempfile
import unittest
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "trainer"))

from grow_net import grow, grow_checkpoint  # noqa: E402
from model import HexNet, NetConfig, load_checkpoint, save_checkpoint  # noqa: E402
from planes import CROP, PLANES, raw_planes  # noqa: E402

SMALL = NetConfig(channels=32, blocks=4, pool_blocks=(1, 3), pool_channels=8, head_channels=8, value_hidden=16)


def trained(config: NetConfig = SMALL) -> HexNet:
    """A network with weights and batch-norm statistics that are anything but default."""
    torch.manual_seed(7)
    model = HexNet(config)
    model.train()
    for _ in range(3):
        model(torch.rand(6, len(PLANES), CROP, CROP) * 2 - 1, aux=True)
    for parameter in model.parameters():
        parameter.data.add_(torch.randn_like(parameter) * 0.05)
    return model.eval()


class GrowNet(unittest.TestCase):
    def test_a_wider_network_plays_exactly_the_same(self):
        model = trained()
        grown = grow(model, NetConfig(**{**SMALL.to_dict(), "channels": 48})).eval()
        planes = torch.from_numpy(raw_planes([(0, 0), (1, -1), (1, 0), (2, -2)], 8)[0]).unsqueeze(0)
        for before, after in zip(model(planes, aux=True), grown(planes, aux=True)):
            self.assertLess(float((before - after).abs().max()), 1e-5)

    def test_a_deeper_network_plays_exactly_the_same(self):
        model = trained()
        grown = grow(model, NetConfig(**{**SMALL.to_dict(), "blocks": 7, "pool_blocks": (1, 3, 5)})).eval()
        planes = torch.rand(3, len(PLANES), CROP, CROP)
        for before, after in zip(model(planes, aux=True), grown(planes, aux=True)):
            self.assertLess(float((before - after).abs().max()), 1e-5)
        self.assertGreater(sum(p.numel() for p in grown.parameters()), sum(p.numel() for p in model.parameters()))

    def test_wider_and_deeper_at_once_and_the_new_weights_can_still_learn(self):
        model = trained()
        config = NetConfig(**{**SMALL.to_dict(), "channels": 48, "blocks": 6, "pool_blocks": (1, 3, 5)})
        grown = grow(model, config).eval()
        planes = torch.rand(2, len(PLANES), CROP, CROP)
        self.assertLess(float((model(planes)[0] - grown(planes)[0]).abs().max()), 1e-5)
        # One training step moves the added width and depth off their starting values.
        grown.train()
        new_block = grown.blocks[5].bn2.weight
        widened = grown.stem.weight[SMALL.channels:]
        before = (new_block.detach().clone(), widened.detach().clone())
        optimizer = torch.optim.SGD(grown.parameters(), lr=0.5)
        for _ in range(3):
            optimizer.zero_grad()
            sum(o.float().mean() for o in grown(planes, aux=True)).backward()
            optimizer.step()
        self.assertFalse(torch.allclose(before[0], grown.blocks[5].bn2.weight))
        self.assertFalse(torch.allclose(before[1], grown.stem.weight[SMALL.channels:]))

    def test_the_checkpoint_round_trip_keeps_the_architecture_and_the_play(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "small.pt"
            out = Path(tmp) / "grown" / "net.pt"
            save_checkpoint(source, trained(), {"metrics": {"loss": 1.5}})
            difference = grow_checkpoint(source, out, blocks=6, channels=48, pool_blocks=(1, 3, 5))
            self.assertLess(difference, 1e-5)
            grown, extra = load_checkpoint(out)
            self.assertEqual((grown.config.blocks, grown.config.channels), (6, 48))
            self.assertEqual(extra["grownFrom"], str(source))
            self.assertEqual(extra["metrics"], {"loss": 1.5})

    def test_it_refuses_a_shape_it_cannot_transfer(self):
        model = trained()
        with self.assertRaises(ValueError):
            grow(model, NetConfig(**{**SMALL.to_dict(), "channels": 16}))
        with self.assertRaises(ValueError):
            grow(model, NetConfig(**{**SMALL.to_dict(), "pool_channels": 16}))
        with self.assertRaises(ValueError):
            grow(model, NetConfig(**{**SMALL.to_dict(), "blocks": 6, "pool_blocks": (2, 3)}))


if __name__ == "__main__":
    unittest.main()
