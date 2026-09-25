"""Network input planes for a position (a recentred crop), plus the 12 hex symmetries.

Must match the C++ engine's planes exactly (checked against shared fixtures). Threat features are computed
inside the network (model.LineWindows).
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "arena"))

from six_rules import player_for_stone, stones_left_before  # noqa: E402

CROP = 25
HALF = CROP // 2
RECENT = 4
PLANES = ("ones", "own", "opponent", "legal", "first_stone", "opponent_last", "second_stone", "radius9")

Cell = tuple[int, int]

# The 12 symmetries of the hex grid about the origin, in axial coordinates:
# six rotations (q, r) -> (-r, q + r) applied k times, each optionally followed by the reflection (q, r) -> (r, q).
def _rotate(q: int, r: int) -> tuple[int, int]:
    return -r, q + r


def transform(cell: Cell, symmetry: int) -> Cell:
    q, r = cell
    for _ in range(symmetry % 6):
        q, r = _rotate(q, r)
    return (r, q) if symmetry >= 6 else (q, r)


def crop_center(moves: list[Cell]) -> Cell:
    """The rounded mean of the last RECENT stones: floor(mean + 1/2) on each axis, in integers."""
    if not moves:
        return 0, 0
    recent = moves[-RECENT:]
    n = len(recent)
    sq = sum(q for q, _ in recent)
    sr = sum(r for _, r in recent)
    return (2 * sq + n) // (2 * n), (2 * sr + n) // (2 * n)


def crop_index(cell: Cell, center: Cell) -> int | None:
    """Flat index of `cell` in the crop around `center` (row from r, column from q), or None outside it."""
    row = cell[1] - center[1] + HALF
    col = cell[0] - center[0] + HALF
    if 0 <= row < CROP and 0 <= col < CROP:
        return row * CROP + col
    return None


_ROWS, _COLS = np.meshgrid(np.arange(CROP), np.arange(CROP), indexing="ij")


def raw_planes(moves: list[Cell], radius: int) -> tuple[np.ndarray, Cell]:
    """Planes (float32, [len(PLANES), CROP, CROP]) for the side about to place stone len(moves), and the crop centre."""
    n = len(moves)
    center = crop_center(moves)
    planes = np.zeros((len(PLANES), CROP, CROP), dtype=np.float32)
    planes[0] = 1.0
    mover = player_for_stone(n)
    second = n > 0 and stones_left_before(n) == 1  # the game's single opening stone is not a second stone

    stones = np.array(moves, dtype=np.int32).reshape(-1, 2)
    rows = stones[:, 1] - center[1] + HALF
    cols = stones[:, 0] - center[0] + HALF
    inside = (rows >= 0) & (rows < CROP) & (cols >= 0) & (cols < CROP)
    owners = np.array([player_for_stone(i) == mover for i in range(n)], dtype=bool)
    planes[1, rows[inside & owners], cols[inside & owners]] = 1.0
    planes[2, rows[inside & ~owners], cols[inside & ~owners]] = 1.0

    # Legal: empty and within `radius` of some stone (of the origin before the first stone).
    q = _COLS - HALF + center[0]
    r = _ROWS - HALF + center[1]
    anchors = stones if n else np.zeros((1, 2), dtype=np.int32)
    dq = q[None] - anchors[:, 0, None, None]
    dr = r[None] - anchors[:, 1, None, None]
    near = (np.maximum(np.maximum(np.abs(dq), np.abs(dr)), np.abs(dq + dr)) <= radius).any(axis=0)
    planes[3] = near & (planes[1] == 0) & (planes[2] == 0)

    if second:
        index = crop_index(moves[n - 1], center)
        if index is not None:
            planes[4].flat[index] = 1.0
    # The opponent's most recent turn: the one or two stones before this turn began.
    turn_start = n - 1 if second else n
    last = [i for i in (turn_start - 2, turn_start - 1) if i >= 0 and player_for_stone(i) != mover]
    for i in last:
        index = crop_index(moves[i], center)
        if index is not None:
            planes[5].flat[index] = 1.0
    planes[6] = 1.0 if second else 0.0
    planes[7] = 1.0 if radius == 9 else 0.0
    return planes, center
