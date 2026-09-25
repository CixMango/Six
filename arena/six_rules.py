"""The Six rules in plain Python, so the arena can referee engines independently.

Cross-checked against the TypeScript rules through engine/tests/fixtures/games.txt.
"""
from __future__ import annotations

AXES = ((1, 0), (0, 1), (1, -1))
WIN_LENGTH = 6

Cell = tuple[int, int]


def turn_for_stone(index: int) -> int:
    return 1 if index == 0 else (index - 1) // 2 + 2


def player_for_stone(index: int) -> str:
    return "X" if turn_for_stone(index) % 2 == 1 else "O"


def stones_left_before(index: int) -> int:
    if index == 0:
        return 1
    return 2 if (index - 1) % 2 == 0 else 1


def distance(a: Cell, b: Cell) -> int:
    dq = a[0] - b[0]
    dr = a[1] - b[1]
    return max(abs(dq), abs(dr), abs(dq + dr))


def cells_within(center: Cell, radius: int):
    cq, cr = center
    for dq in range(-radius, radius + 1):
        for dr in range(max(-radius, -dq - radius), min(radius, -dq + radius) + 1):
            yield (cq + dq, cr + dr)


class Game:
    def __init__(self, radius: int = 8):
        self.radius = radius
        self.cells: dict[Cell, str] = {}
        self.moves: list[Cell] = []
        self.coverage: dict[Cell, int] = {}
        self.winner: str | None = None

    @property
    def current(self) -> str:
        return self.winner or player_for_stone(len(self.moves))

    @property
    def turn(self) -> int:
        n = len(self.moves)
        return turn_for_stone(n - 1 if self.winner else n)

    @property
    def stones_left(self) -> int:
        n = len(self.moves)
        return stones_left_before(n - 1) - 1 if self.winner else stones_left_before(n)

    def is_playable(self, cell: Cell) -> bool:
        if cell in self.cells:
            return False
        if not self.moves:
            return distance(cell, (0, 0)) <= self.radius
        return self.coverage.get(cell, 0) > 0

    def place(self, cell: Cell) -> str | None:
        """Places the next stone; returns an error string instead if the move is illegal."""
        if self.winner:
            return "game-over"
        if cell in self.cells:
            return "occupied"
        if not self.is_playable(cell):
            return "out-of-range"
        player = self.current
        self.cells[cell] = player
        self.moves.append(cell)
        for c in cells_within(cell, self.radius):
            self.coverage[c] = self.coverage.get(c, 0) + 1
        for dq, dr in AXES:
            run = 1
            for sign in (1, -1):
                q, r = cell[0] + dq * sign, cell[1] + dr * sign
                while self.cells.get((q, r)) == player:
                    run += 1
                    q += dq * sign
                    r += dr * sign
            if run >= WIN_LENGTH:
                self.winner = player
                break
        return None

    def playable_cells(self) -> list[Cell]:
        if not self.moves:
            return list(cells_within((0, 0), self.radius))
        return [c for c, n in self.coverage.items() if n > 0 and c not in self.cells]
