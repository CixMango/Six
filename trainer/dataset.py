"""Training rows from HexBot self-play (`arena/datagen.py`), the HeXO human corpus, and network self-play.

HexBot and human games: one row per stone. The first stone of a turn targets both cells of the turn (0.5 each,
since order within a turn doesn't matter); the second stone targets the remaining cell. HexBot rows carry the
turn's search score. Network self-play: rows only where a full search ran, targeting its improved policy, with its
value as the score target. The value target is always the game result from the mover's side.

KataGo-style auxiliary targets: future occupancy (cells each side fills in the next few stones) and, for network
self-play, short-term value (exponentially weighted later search values and the result).
"""
from __future__ import annotations

import hashlib
import json
import math
import random
import sys
from dataclasses import dataclass, field, replace
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset

from planes import CROP, crop_center, crop_index, raw_planes, transform

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "arena"))

from six_rules import Game, distance, player_for_stone, stones_left_before  # noqa: E402

WIN_SCORE = 1_000_000
FUTURE_HORIZONS = (6, 20)   # stones ahead (this one included) whose placements the future-occupancy target marks
SHORT_VALUE_HORIZON = 12.0  # stones: the short-term value's weights fall by 1/e about this often
SCORE_SCALE = 600.0


@dataclass
class GameRecord:
    moves: list[tuple[int, int]]
    radius: int
    winner: str | None
    source: str                      # "selfplay" (HexBot), "human" or "rl" (network self-play)
    first_row: int = 1               # rows before this index (random or forced opening stones) are not trained on
    scores: dict[int, int] = field(default_factory=dict)  # turn's first stone index -> search score for the mover
    weight: float = 1.0
    checked: bool = False            # the source file was already validated on an earlier run (see load_rl)
    path: Path | None = None
    # Network self-play: stone index -> (search value, improved policy as rows of (q, r, probability)). Loaded
    # records store the policy as a float32 array since each DataLoader worker gets a pickled copy of every record.
    searched: dict[int, tuple[float, np.ndarray | list[tuple[int, int, float]]]] = field(default_factory=dict)
    # Network self-play: stone index -> KL divergence of the search's policy from the network's prior.
    surprise: dict[int, float] = field(default_factory=dict)

    def row_indices(self):
        return sorted(self.searched) if self.source == "rl" else range(self.first_row, len(self.moves))

    @property
    def validation(self) -> bool:
        """5% of games, chosen by their moves, so every row of a game lands on the same side."""
        digest = hashlib.md5(json.dumps(self.moves).encode()).digest()
        return digest[0] % 20 == 0


def replays_legally(record: GameRecord) -> bool:
    game = Game(record.radius)
    for m in record.moves:
        if game.place(m):
            return False
    return game.winner == record.winner or (record.winner is None and game.winner is None)


def load_selfplay(paths: list[Path]) -> list[GameRecord]:
    records = []
    for path in paths:
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                g = json.loads(line)
            except json.JSONDecodeError:
                continue  # a line cut short when a run was stopped mid-write
            scores = {t["at"]: t["score"] for t in g["turns"] if t.get("score") is not None}
            records.append(GameRecord([tuple(m) for m in g["moves"]], g["radius"], g["winner"], "selfplay",
                                      first_row=max(1, g["opening"]), scores=scores))
    return records


def validation_stamp(path: Path) -> str:
    stat = path.stat()
    return f"{stat.st_size}:{stat.st_mtime_ns}"


def load_rl(paths: list[Path]) -> list[GameRecord]:
    """Network self-play games. Records from files whose size and mtime match the folder's .validated.json get
    `checked=True`, so the caller can skip replaying them (replaying a large window costs more than training)."""
    checked: dict[Path, dict] = {}
    for path in paths:
        folder = checked.setdefault(path.parent, {})
        if not folder:
            try:
                folder.update(json.loads((path.parent / ".validated.json").read_text(encoding="utf-8")))
            except (OSError, ValueError):
                pass
    records = []
    for path in paths:
        known = checked[path.parent]
        trusted = known.get(path.name) == validation_stamp(path)
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                g = json.loads(line)
            except json.JSONDecodeError:
                continue
            searched = {r["at"]: (float(r["value"]), np.asarray(r["policy"], dtype=np.float32).reshape(-1, 3))
                        for r in g["rows"]}
            surprise = {r["at"]: float(r["kl"]) for r in g["rows"] if "kl" in r}
            if searched:
                records.append(GameRecord([tuple(m) for m in g["moves"]], g["radius"], g["winner"], "rl",
                                          searched=searched, surprise=surprise, checked=trusted, path=path))
    return records


def remember_validated(paths: list[Path]) -> None:
    """Records each file's size and mtime in its folder's .validated.json."""
    for folder in {path.parent for path in paths}:
        note = folder / ".validated.json"
        try:
            known = json.loads(note.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            known = {}
        for path in paths:
            if path.parent == folder:
                known[path.name] = validation_stamp(path)
        try:
            note.write_text(json.dumps(known), encoding="utf-8")
        except OSError:
            pass  # only a cache


def load_corpus(path: Path) -> list[GameRecord]:
    records = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        g = json.loads(line)
        winner = "X" if g["winner"] == 1 else "O"
        records.append(GameRecord([tuple(m) for m in g["moves"]], 8, winner, "human"))
    return records


def turn_cells(moves: list[tuple[int, int]], start: int) -> list[tuple[int, int]]:
    """The stones of the turn beginning at `start` (one or two)."""
    cells = [moves[start]]
    if start > 0 and start + 1 < len(moves) and player_for_stone(start + 1) == player_for_stone(start):
        cells.append(moves[start + 1])
    return cells


def in_range(stones: list[tuple[int, int]], cell: tuple[int, int], radius: int) -> bool:
    anchors = stones or [(0, 0)]
    return any(distance(s, cell) <= radius for s in anchors)


def turn_start(n: int) -> int:
    return n if n == 0 or stones_left_before(n) == 2 else n - 1


def short_term_value(game: GameRecord, n: int, horizon: float = SHORT_VALUE_HORIZON) -> float | None:
    """For network self-play: the search values at row `n` and later rows, weighted (1-λ)λ^k by distance k and seen
    from the mover at `n`, with the weight λ^(stones left) on the result when the game finished. None otherwise."""
    if game.source != "rl" or n not in game.searched:
        return None
    lam = 1.0 - 1.0 / horizon
    mover = player_for_stone(n)
    total = 0.0
    weights = 0.0
    for m, (value, _) in game.searched.items():
        if m >= n:
            w = (1.0 - lam) * lam ** (m - n)
            total += w * (value if player_for_stone(m) == mover else -value)
            weights += w
    if game.winner is not None:
        w = lam ** (len(game.moves) - n)
        total += w * (1.0 if game.winner == mover else -1.0)
        weights += w
    return total / weights


def surprise_weight(game: GameRecord, n: int) -> float:
    """KataGo's policy surprise weighting: half of a game's row weight is spread evenly and half in proportion to
    how far the search moved from the network's prior (KL divergence), so the average stays 1 within a game."""
    if n not in game.surprise:
        return 1.0
    mean = sum(game.surprise.values()) / len(game.surprise)
    return 0.5 + 0.5 * game.surprise[n] / mean if mean > 1e-6 else 1.0


def future_occupancy(moves: list[tuple[int, int]], n: int, center, finished: bool):
    """[2 per horizon, crop²] planes of the cells the mover, then the opponent, fill in stones n..n+horizon-1, and
    whether each horizon is known (an unfinished record may stop before it)."""
    future = np.zeros((2 * len(FUTURE_HORIZONS), CROP * CROP), dtype=np.float32)
    mover = player_for_stone(n)
    for h, horizon in enumerate(FUTURE_HORIZONS):
        for j in range(n, min(len(moves), n + horizon)):
            index = crop_index(moves[j], center)
            if index is not None:
                future[2 * h + (0 if player_for_stone(j) == mover else 1), index] = 1.0
    known = [finished or n + horizon <= len(moves) for horizon in FUTURE_HORIZONS]
    return future, known


def squash(score: int) -> float:
    if abs(score) >= WIN_SCORE // 2:
        return 1.0 if score > 0 else -1.0
    return math.tanh(score / SCORE_SCALE)


def compact(game: GameRecord) -> GameRecord:
    """The record with its moves and scores as small arrays (Python tuples and dicts cost ~10x the bytes)."""
    keys = np.fromiter(game.scores.keys(), dtype=np.int32, count=len(game.scores))
    values = np.fromiter(game.scores.values(), dtype=np.int32, count=len(game.scores))
    at = np.fromiter(game.surprise.keys(), dtype=np.int32, count=len(game.surprise))
    kl = np.fromiter(game.surprise.values(), dtype=np.float32, count=len(game.surprise))
    return replace(game, moves=np.asarray(game.moves, dtype=np.int16).reshape(-1, 2), scores=(keys, values),
                   surprise=(at, kl))


def expand(game: GameRecord) -> GameRecord:
    """Undoes `compact` for one use."""
    keys, values = game.scores
    at, kl = game.surprise
    return replace(game, moves=[(int(q), int(r)) for q, r in game.moves.tolist()],
                   scores=dict(zip(keys.tolist(), values.tolist())), surprise=dict(zip(at.tolist(), kl.tolist())))


class RowDataset(Dataset):
    """Rows (game, stone index) whose unaugmented policy targets fall inside the crop.

    Each DataLoader worker gets a pickled copy, so records are kept compact and rows are a numpy array.
    """

    def __init__(self, games: list[GameRecord], augment: bool):
        self.augment = augment
        self.games: list[GameRecord] = []
        rows: list[tuple[int, int]] = []
        self.skipped = 0
        for g_index, game in enumerate(games):
            for n in game.row_indices():
                if self._targets(game, n, 0) is None:
                    self.skipped += 1
                else:
                    rows.append((g_index, n))
            self.games.append(compact(game))
        self.rows = np.asarray(rows, dtype=np.int32).reshape(-1, 2)

    def __len__(self) -> int:
        return len(self.rows)

    def row_of(self, g_index: int, n: int) -> int:
        found = np.flatnonzero((self.rows[:, 0] == g_index) & (self.rows[:, 1] == n))
        if len(found) == 0:
            raise ValueError(f"no row for game {g_index}, stone {n}")
        return int(found[0])

    @staticmethod
    def _targets(game: GameRecord, n: int, symmetry: int):
        moves = [transform(m, symmetry) for m in game.moves] if symmetry else game.moves
        prefix = moves[:n]
        center = crop_center(prefix)
        t = turn_start(n)
        if game.source == "rl":
            # The search's policy, minus any cells outside the crop (rows losing much of it are skipped).
            _, policy = game.searched[n]
            targets = []
            for q, r, p in policy:
                cell = (int(q), int(r))
                index = crop_index(transform(cell, symmetry) if symmetry else cell, center)
                if index is not None:
                    targets.append((index, float(p)))
            if sum(p for _, p in targets) < 0.9:
                return None
            return prefix, center, targets, t
        cells = turn_cells(moves, t)
        # A turn's second cell may be in range only through its first; before the first it isn't a legal target.
        wanted = [c for c in cells if in_range(prefix, c, game.radius)] if n == t else cells[1:]
        if not wanted:
            return None
        indices = [crop_index(c, center) for c in wanted]
        if any(i is None for i in indices):
            return None
        return prefix, center, [(index, 1.0 / len(indices)) for index in indices], t

    def __getitem__(self, i: int):
        g_index, n = (int(x) for x in self.rows[i])
        game = expand(self.games[g_index])
        symmetry = random.randrange(12) if self.augment else 0
        targets = self._targets(game, n, symmetry)
        if targets is None:
            symmetry = 0
            targets = self._targets(game, n, 0)
        prefix, center, weighted, t = targets
        moves = [transform(m, symmetry) for m in game.moves] if symmetry else game.moves

        planes, _ = raw_planes(prefix, game.radius)
        policy = np.zeros(CROP * CROP, dtype=np.float32)
        total = sum(p for _, p in weighted)
        for index, p in weighted:
            policy[index] += p / total

        opponent = np.zeros(CROP * CROP, dtype=np.float32)
        next_start = t + (1 if t == 0 else 2)
        opponent_known = False
        if next_start < len(moves):
            next_indices = [crop_index(c, center) for c in turn_cells(moves, next_start)]
            inside = [index for index in next_indices if index is not None]
            for index in inside:
                opponent[index] += 1.0 / len(inside)
            opponent_known = bool(inside)

        mover = player_for_stone(n)
        value = -1 if game.winner is None else (0 if game.winner == mover else 1)
        if game.source == "rl":
            score_value, score_known = float(game.searched[n][0]), True
        else:
            score = game.scores.get(t)
            score_value, score_known = (squash(score), True) if score is not None else (0.0, False)
        future, future_known = future_occupancy(moves, n, center, game.winner is not None)
        short_value = short_term_value(game, n)
        return {
            "planes": torch.from_numpy(planes),
            "policy": torch.from_numpy(policy),
            "opponent": torch.from_numpy(opponent),
            "opponent_known": torch.tensor(opponent_known),
            "value": torch.tensor(value),
            "score": torch.tensor(score_value, dtype=torch.float32),
            "score_known": torch.tensor(score_known),
            "future": torch.from_numpy(future.reshape(-1, CROP, CROP)),
            "future_known": torch.tensor(future_known),
            "short_value": torch.tensor(0.0 if short_value is None else short_value, dtype=torch.float32),
            "short_value_known": torch.tensor(short_value is not None),
            "weight": torch.tensor(game.weight * surprise_weight(game, n), dtype=torch.float32),
            "human": torch.tensor(game.source == "human"),
        }
