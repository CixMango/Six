"""Hex-masked ResNet with in-graph threat features, global pooling, and policy, opponent-policy, value and score
heads, plus training-only future-occupancy and short-term value heads. Checkpoints store their `NetConfig`.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass

import torch
import torch.nn.functional as F
from torch import nn

from planes import CROP, PLANES

AXES = ((1, 0), (0, 1), (1, -1))
WINDOW = 6
# Derived planes: for own then opponent stones, cells in windows holding exactly 3, 4 or 5 of that side and none of the other.
DERIVED_COUNTS = (3, 4, 5)
# Training-only heads; checkpoints without them load with these freshly initialized.
AUX_PREFIXES = ("future_", "short_value_")


@dataclass
class NetConfig:
    channels: int = 96
    blocks: int = 10
    pool_blocks: tuple[int, ...] = (3, 7)  # indices of blocks with global pooling
    pool_channels: int = 32
    head_channels: int = 32
    value_hidden: int = 64
    crop: int = CROP
    future_planes: int = 4  # future-occupancy head outputs (own and opponent per horizon; see dataset.FUTURE_HORIZONS)

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(values: dict) -> "NetConfig":
        values = dict(values)
        values["pool_blocks"] = tuple(values["pool_blocks"])
        return NetConfig(**values)


class LineWindows(nn.Module):
    """Marks cells lying in some six-cell line window whose counts satisfy a condition, using fixed convolutions."""

    def __init__(self):
        super().__init__()
        size = 2 * (WINDOW - 1) + 1
        count = torch.zeros(len(AXES), 1, size, size)
        spread = torch.zeros(len(AXES), 1, size, size)
        c = WINDOW - 1
        for a, (dq, dr) in enumerate(AXES):
            for i in range(WINDOW):
                count[a, 0, c + i * dr, c + i * dq] = 1.0  # window starting here
                spread[a, 0, c - i * dr, c - i * dq] = 1.0  # windows containing here
        self.register_buffer("count_kernel", count, persistent=False)
        self.register_buffer("spread_kernel", spread, persistent=False)

    def counts(self, plane: torch.Tensor) -> torch.Tensor:
        """[B, 1, H, W] stones -> [B, 3, H, W] stones in the window starting at each cell, per axis."""
        return F.conv2d(plane, self.count_kernel, padding=WINDOW - 1)

    def forward(self, own: torch.Tensor, opp: torch.Tensor) -> torch.Tensor:
        own_counts = self.counts(own)
        opp_counts = self.counts(opp)
        planes = []
        for mine, theirs in ((own_counts, opp_counts), (opp_counts, own_counts)):
            for k in DERIVED_COUNTS:
                starts = ((mine > k - 0.5) & (mine < k + 0.5) & (theirs < 0.5)).to(own.dtype)
                cells = F.conv2d(starts, self.spread_kernel, padding=WINDOW - 1, groups=len(AXES))
                planes.append((cells.amax(dim=1, keepdim=True) > 0.5).to(own.dtype))
        return torch.cat(planes, dim=1)


class HexConv(nn.Conv2d):
    """3×3 convolution over the six hex neighbours: in (row = r, column = q) layout the (-1, -1) and (+1, +1) corners aren't adjacent."""

    def __init__(self, in_channels: int, out_channels: int, bias: bool = False):
        super().__init__(in_channels, out_channels, 3, padding=1, bias=bias)
        mask = torch.ones(1, 1, 3, 3)
        mask[0, 0, 0, 0] = 0.0
        mask[0, 0, 2, 2] = 0.0
        self.register_buffer("mask", mask, persistent=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return F.conv2d(x, self.weight * self.mask, self.bias, padding=1)


def global_pool(x: torch.Tensor) -> torch.Tensor:
    return torch.cat([x.mean(dim=(2, 3)), x.amax(dim=(2, 3))], dim=1)


class ResBlock(nn.Module):
    def __init__(self, channels: int, pool_channels: int = 0):
        super().__init__()
        self.pool_channels = pool_channels
        self.conv1 = HexConv(channels, channels)
        self.bn1 = nn.BatchNorm2d(channels - pool_channels)
        if pool_channels:
            self.pool_bn = nn.BatchNorm2d(pool_channels)
            self.pool_fc = nn.Linear(2 * pool_channels, channels - pool_channels)
        self.conv2 = HexConv(channels - pool_channels, channels)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        y = self.conv1(x)
        if self.pool_channels:
            regular, pooled = y[:, : -self.pool_channels], y[:, -self.pool_channels :]
            bias = self.pool_fc(global_pool(F.relu(self.pool_bn(pooled))))
            y = regular + bias[:, :, None, None]
        y = F.relu(self.bn1(y))
        y = self.bn2(self.conv2(y))
        return F.relu(x + y)


class HexNet(nn.Module):
    """Input [B, len(PLANES), crop, crop]. Returns policy logits [B, crop²], opponent-policy logits [B, crop²],
    value logits [B, 2] (mover wins, mover loses) and a score estimate in [-1, 1] [B]."""

    def __init__(self, config: NetConfig):
        super().__init__()
        self.config = config
        c = config.channels
        inputs = len(PLANES) + 2 * len(DERIVED_COUNTS)
        self.windows = LineWindows()
        self.stem = HexConv(inputs, c)
        self.stem_bn = nn.BatchNorm2d(c)
        self.blocks = nn.ModuleList(
            ResBlock(c, config.pool_channels if i in config.pool_blocks else 0) for i in range(config.blocks)
        )
        h = config.head_channels
        self.policy_conv = HexConv(c, h)
        self.policy_bn = nn.BatchNorm2d(h)
        self.policy_out = nn.Conv2d(h, 2, 1)
        self.value_conv = nn.Conv2d(c, h, 1, bias=False)
        self.value_bn = nn.BatchNorm2d(h)
        self.value_fc = nn.Linear(2 * h, config.value_hidden)
        self.value_out = nn.Linear(config.value_hidden, 3)
        self.future_conv = HexConv(c, h)
        self.future_bn = nn.BatchNorm2d(h)
        self.future_out = nn.Conv2d(h, config.future_planes, 1)
        self.short_value_out = nn.Linear(config.value_hidden, 1)
        # Aux heads start quiet: sparse placements, and no gradient into the trunk at first.
        nn.init.zeros_(self.future_out.weight)
        nn.init.constant_(self.future_out.bias, -5.0)
        nn.init.zeros_(self.short_value_out.weight)
        nn.init.zeros_(self.short_value_out.bias)

    def forward(self, planes: torch.Tensor, aux: bool = False):
        derived = self.windows(planes[:, 1:2], planes[:, 2:3])
        x = F.relu(self.stem_bn(self.stem(torch.cat([planes, derived], dim=1))))
        for block in self.blocks:
            x = block(x)
        p = self.policy_out(F.relu(self.policy_bn(self.policy_conv(x)))).flatten(2)
        hidden = F.relu(self.value_fc(global_pool(F.relu(self.value_bn(self.value_conv(x))))))
        v = self.value_out(hidden)
        if not aux:
            return p[:, 0], p[:, 1], v[:, :2], torch.tanh(v[:, 2])
        future = self.future_out(F.relu(self.future_bn(self.future_conv(x)))).flatten(2)
        short_value = torch.tanh(self.short_value_out(hidden)).squeeze(1)
        return p[:, 0], p[:, 1], v[:, :2], torch.tanh(v[:, 2]), future, short_value


def save_checkpoint(path, model: HexNet, extra: dict | None = None) -> None:
    torch.save({"format": "hexnet-1", "config": model.config.to_dict(), "state": model.state_dict(), **(extra or {})}, path)


def load_checkpoint(path, device="cpu") -> tuple[HexNet, dict]:
    data = torch.load(path, map_location=device, weights_only=False)
    if data.get("format") != "hexnet-1":
        raise ValueError(f"{path} is not a hexnet-1 checkpoint")
    model = HexNet(NetConfig.from_dict(data["config"]))
    missing, unexpected = model.load_state_dict(data["state"], strict=False)
    missing = [key for key in missing if not key.startswith(AUX_PREFIXES)]
    if missing or unexpected:
        raise RuntimeError(f"{path} doesn't match its network: missing {missing}, unexpected {unexpected}")
    return model.to(device), data
