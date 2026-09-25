"""PyTorch version of the NNUE in engine/src/nnue.cpp (same features and network), batched.

The engine updates its accumulators incrementally; here each position is laid on a grid and all line codes are
computed at once. tests/test_nnue_model.py checks both agree.
"""
from __future__ import annotations

import struct
import sys
from pathlib import Path

import numpy as np
import torch
from torch import nn

sys.path.insert(0, str(Path(__file__).resolve().parent))
from planes import stones_left_before  # noqa: E402

REACH = 5
LINE = 2 * REACH
CODES = 3 ** LINE
CANONICAL = (CODES + 243) // 2
CENTERS = 3
GRID = 72  # positions are laid on a GRID x GRID window around their stones
AXES = ((1, 0), (0, 1), (1, -1))  # (dq, dr), as engine/src/board.hpp kAxes
OFFSETS = [i - REACH if i < REACH else i - REACH + 1 for i in range(LINE)]


def _tables():
    codes = np.arange(CODES)
    digits = np.stack([(codes // 3 ** i) % 3 for i in range(LINE)], axis=1)
    reversed_codes = (digits[:, ::-1] * (3 ** np.arange(LINE))).sum(axis=1)
    canonical = np.full(CODES, -1, dtype=np.int64)
    nxt = 0
    for code in range(CODES):
        twin = reversed_codes[code]
        if twin < code:
            canonical[code] = canonical[twin]
        else:
            canonical[code] = nxt
            nxt += 1
    assert nxt == CANONICAL
    return reversed_codes, canonical


REVERSED, CANONICAL_INDEX = _tables()


def grids(positions: list[list[tuple[int, int]]]) -> tuple[np.ndarray, np.ndarray]:
    """For each position (its stones in order), the state grid seen by X and by O: [B, 2, GRID, GRID] int8 with
    0 empty, 1 the viewer's stone, 2 the other side's; and the side to move (0 X, 1 O). Grid row is r, column q,
    both shifted so the stones sit in the middle. Raises if a position does not fit."""
    out = np.zeros((len(positions), 2, GRID, GRID), dtype=np.int8)
    movers = np.zeros(len(positions), dtype=np.int64)
    for b, moves in enumerate(positions):
        n = len(moves)
        movers[b] = 0 if _player(n) == "X" else 1
        if n == 0:
            continue
        stones = np.asarray(moves, dtype=np.int64).reshape(-1, 2)
        lo, hi = stones.min(axis=0), stones.max(axis=0)
        shift = GRID // 2 - (lo + hi) // 2
        q = stones[:, 0] + shift[0]
        r = stones[:, 1] + shift[1]
        if q.min() < REACH or r.min() < REACH or q.max() >= GRID - REACH or r.max() >= GRID - REACH:
            raise ValueError("position does not fit the grid")
        x_stone = np.array([_player(i) == "X" for i in range(n)])
        out[b, 0, r[x_stone], q[x_stone]] = 1
        out[b, 0, r[~x_stone], q[~x_stone]] = 2
        out[b, 1, r[x_stone], q[x_stone]] = 2
        out[b, 1, r[~x_stone], q[~x_stone]] = 1
    return out, movers


def _player(stone: int) -> str:
    turn = 1 if stone == 0 else (stone - 1) // 2 + 2
    return "X" if turn % 2 == 1 else "O"


def _shift(t: torch.Tensor, dq: int, dr: int) -> torch.Tensor:
    """out[..., r, q] = t[..., r + dr, q + dq], zero where that falls off the grid."""
    out = torch.zeros_like(t)
    h, w = t.shape[-2:]
    rs, re = max(0, -dr), min(h, h - dr)
    qs, qe = max(0, -dq), min(w, w - dq)
    out[..., rs:re, qs:qe] = t[..., rs + dr:re + dr, qs + dq:qe + dq]
    return out


def line_codes(state: torch.Tensor) -> torch.Tensor:
    """Line codes of every cell on each axis: [..., 3, GRID, GRID] (long) from states [..., GRID, GRID]."""
    s = state.long()
    codes = []
    for dq, dr in AXES:
        code = torch.zeros_like(s)
        for i, off in enumerate(OFFSETS):
            code += _shift(s, dq * off, dr * off) * 3 ** i
        codes.append(code)
    return torch.stack(codes, dim=-3)


POOL_SCALE = 1.0 / 32  # per-cell mode: the pooled sum over a few hundred cells, scaled into the MLP's range


class SixNnue(nn.Module):
    """`percell`: apply the clipped ReLU per cell before pooling (as in Rapfi's Mixnet), so cells where lines on
    two axes meet count as more than the sum of their lines. Otherwise (v1) features are summed first."""

    def __init__(self, dim: int = 32, hidden: int = 32, percell: bool = False):
        super().__init__()
        self.dim, self.hidden, self.percell = dim, hidden, percell
        self.table = nn.Embedding(CENTERS * CANONICAL, dim)
        nn.init.normal_(self.table.weight, std=0.01)
        self.bias0 = nn.Parameter(torch.full((dim,), 0.5))
        self.fc1 = nn.Linear(2 * dim + 1, hidden)
        self.fc2 = nn.Linear(hidden, 1)
        self.policy = nn.Linear(dim, 1)
        self.register_buffer("canonical", torch.as_tensor(CANONICAL_INDEX), persistent=False)

    def sums(self, grid: torch.Tensor) -> torch.Tensor:
        """Each viewer's accumulator: [B, 2, dim] from state grids [B, 2, GRID, GRID]."""
        if self.percell:
            return self._cell_sums(grid)
        codes = line_codes(grid)                                    # [B, 2, 3, H, W]
        center = grid.long().unsqueeze(2).expand_as(codes)
        active = (codes != 0) | (center != 0)
        index = center[active] * CANONICAL + self.canonical[codes[active]]
        rows = self.table(index) - self.table.weight[self.canonical[0]]  # minus the all-empty row
        owner = active.nonzero()[:, :2]                              # (batch, viewer) of each active entry
        flat = owner[:, 0] * 2 + owner[:, 1]
        out = torch.zeros(grid.shape[0] * 2, self.dim, device=grid.device, dtype=rows.dtype)
        out.index_add_(0, flat, rows)
        return out.view(grid.shape[0], 2, self.dim)

    def _cell_sums(self, grid: torch.Tensor) -> torch.Tensor:
        """Per-cell mode: the sum over cells of crelu(cell features + bias0), less what an all-empty cell gives."""
        codes = line_codes(grid)                                    # [B, 2, 3, H, W]
        center = grid.long()                                        # [B, 2, H, W]
        active = (codes != 0).any(dim=2) | (center != 0)            # cells that differ from an empty neighbourhood
        where = active.nonzero()                                    # (b, viewer, row, col)
        b, v, r, c = where.unbind(1)
        cell_codes = codes[b, v, :, r, c]                           # [N, 3]
        index = center[b, v, r, c].unsqueeze(1) * CANONICAL + self.canonical[cell_codes]
        feature = self.table(index).sum(dim=1)                      # [N, dim]
        empty = 3 * self.table.weight[self.canonical[0]]
        contrib = torch.clamp(feature + self.bias0, 0, 1) - torch.clamp(empty + self.bias0, 0, 1)
        out = torch.zeros(grid.shape[0] * 2, self.dim, device=grid.device, dtype=contrib.dtype)
        out.index_add_(0, b * 2 + v, contrib)
        return out.view(grid.shape[0], 2, self.dim)

    def value(self, sums: torch.Tensor, mover: torch.Tensor, second: torch.Tensor) -> torch.Tensor:
        """Side to move's value in [-1, 1]. `second`: 1.0 when the mover has two stones to place, else 0.0."""
        idx = torch.arange(len(mover), device=sums.device)
        if self.percell:
            mine = sums[idx, mover] * POOL_SCALE
            theirs = sums[idx, 1 - mover] * POOL_SCALE
        else:
            mine = torch.clamp(sums[idx, mover] + self.bias0, 0, 1)
            theirs = torch.clamp(sums[idx, 1 - mover] + self.bias0, 0, 1)
        h = torch.clamp(self.fc1(torch.cat([mine, theirs, second.unsqueeze(1)], dim=1)), 0, 1)
        return torch.tanh(self.fc2(h).squeeze(1))

    def cell_scores(self, grid: torch.Tensor, mover: torch.Tensor, cells: torch.Tensor) -> torch.Tensor:
        """Policy scores [B, K] for cells [B, K, 2] given as (row, col) in the grid (the mover's view, empty cells)."""
        b = torch.arange(len(mover), device=grid.device)
        state = grid[b, mover]                                       # [B, H, W]
        codes = line_codes(state)                                    # [B, 3, H, W]
        rows, cols = cells[..., 0], cells[..., 1]
        picked = codes[b[:, None, None], torch.arange(3, device=grid.device)[None, None, :], rows[..., None], cols[..., None]]
        feature = self.table(self.canonical[picked]).sum(dim=2)       # empty-centre rows, summed over axes
        return self.policy(torch.clamp(feature + self.bias0, 0, 1)).squeeze(-1)


def second_stone_flags(counts: np.ndarray) -> np.ndarray:
    """1.0 where the side to move has two stones to place (the first of its turn), else 0.0."""
    return np.array([1.0 if stones_left_before(int(n)) == 2 else 0.0 for n in counts], dtype=np.float32)


def export(model: SixNnue, path: Path) -> None:
    """Writes the weights in engine/src/nnue.cpp's format (SIXNNUE1, or SIXNNUE2 for the per-cell model)."""
    def floats(t: torch.Tensor) -> bytes:
        return t.detach().float().cpu().contiguous().numpy().astype("<f4").tobytes()

    with open(path, "wb") as f:
        # Separate tag so a v1-only engine rejects per-cell weights instead of misreading them.
        f.write(b"SIXNNUE2" if model.percell else b"SIXNNUE1")
        f.write(struct.pack("<3i", CANONICAL, model.dim, model.hidden))
        f.write(floats(model.table.weight))
        f.write(floats(model.bias0))
        f.write(floats(model.fc1.weight))
        f.write(floats(model.fc1.bias))
        f.write(floats(model.fc2.weight.view(-1)))
        f.write(floats(model.fc2.bias))
        f.write(floats(model.policy.weight.view(-1)))
        f.write(floats(model.policy.bias))
