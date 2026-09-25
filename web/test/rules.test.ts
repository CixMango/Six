import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { hexDistance, hexKey, hexesWithin, LINE_AXES, type Hex } from '../src/shared/hex.ts';
import { Game, playerForStone, stonesLeftBefore, type Player } from '../src/shared/rules.ts';

const origin = { q: 0, r: 0 };

// Brute-force playable set, for cross-checking.
function brutePlayable(game: Game): Set<string> {
  const stones = game.moves;
  const centers = stones.length === 0 ? [origin] : stones;
  const out = new Set<string>();
  for (const c of centers) {
    for (const h of hexesWithin(c, game.radius)) {
      if (game.stoneAt(h.q, h.r) === undefined) out.add(hexKey(h.q, h.r));
    }
  }
  return out;
}

function bruteHasSix(board: Map<string, Player>, player: Player): boolean {
  for (const [key, p] of board) {
    if (p !== player) continue;
    const [q, r] = key.split(',').map(Number) as [number, number];
    for (const a of LINE_AXES) {
      let ok = true;
      for (let i = 0; i < 6; i++) {
        if (board.get(hexKey(q + a.q * i, r + a.r * i)) !== player) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
  }
  return false;
}

const randomGame = (radius: 8 | 9, maxStones: number) =>
  fc.array(fc.nat(), { minLength: 0, maxLength: maxStones }).map((choices) => {
    const game = new Game(radius);
    const snapshots: Array<{ game: Game }> = [];
    for (const choice of choices) {
      if (game.winner) break;
      // Bias toward cells near existing stones so lines actually form.
      const cells = game.playableCells().filter(
        (h) => game.moves.length === 0 || game.moves.some((s) => hexDistance(s, h) <= 2),
      );
      const pick = cells[choice % cells.length]!;
      game.place(pick.q, pick.r);
      snapshots.push({ game: game.clone() });
    }
    return { game, snapshots };
  });

describe('turn structure', () => {
  it('X places 1 stone on turn 1, then each player places 2', () => {
    const expected: Array<[Player, number]> = [
      ['X', 1],
      ['O', 2], ['O', 1],
      ['X', 2], ['X', 1],
      ['O', 2], ['O', 1],
    ];
    expected.forEach(([player, left], i) => {
      expect(playerForStone(i)).toBe(player);
      expect(stonesLeftBefore(i)).toBe(left);
    });
  });

  it('a fresh game starts with X to move, turn 1, 1 stone left, no winner', () => {
    const g = new Game(9);
    expect(g.current).toBe('X');
    expect(g.turn).toBe(1);
    expect(g.stonesLeft).toBe(1);
    expect(g.winner).toBeNull();
    expect(g.lastMove).toBeNull();
  });

  it('after every completed turn the mover has exactly one more stone', () => {
    fc.assert(
      fc.property(randomGame(9, 40), ({ snapshots }) => {
        for (const { game } of snapshots) {
          if (game.winner || game.stonesLeft !== (game.moves.length === 0 ? 1 : 2)) continue;
          const counts = { X: 0, O: 0 };
          for (const m of game.moves) counts[game.stoneAt(m.q, m.r)!]++;
          const justMoved: Player = game.current === 'X' ? 'O' : 'X';
          const other = game.current;
          expect(counts[justMoved]).toBe(counts[other] + 1);
        }
      }),
      { numRuns: 60 },
    );
  });
});

describe('playable area', () => {
  it('empty board: every cell within the radius of the center (271 for 9, 217 for 8)', () => {
    expect(new Game(9).playableCells()).toHaveLength(271);
    expect(new Game(8).playableCells()).toHaveLength(217);
  });

  it('after the opening stone at the center: 270 playable for radius 9, 216 for radius 8', () => {
    const g9 = new Game(9);
    g9.place(0, 0);
    expect(g9.playableCells()).toHaveLength(270);
    const g8 = new Game(8);
    g8.place(0, 0);
    expect(g8.playableCells()).toHaveLength(216);
  });

  it('rejects taken cells and cells beyond the radius without using a stone', () => {
    const g = new Game(9);
    expect(g.place(10, 0)).toEqual({ ok: false, error: 'out-of-range' });
    expect(g.place(0, 0)).toEqual({ ok: true, won: false });
    expect(g.place(0, 0)).toEqual({ ok: false, error: 'occupied' });
    expect(g.place(10, 0)).toEqual({ ok: false, error: 'out-of-range' });
    expect(g.stonesLeft).toBe(2);
    expect(g.current).toBe('O');
    expect(g.place(9, 0)).toEqual({ ok: true, won: false });
  });

  it('the second stone may use space the first stone just opened', () => {
    const g = new Game(9);
    g.place(0, 0);
    g.place(9, 0); // O's first stone at the edge
    expect(g.isPlayable(18, 0)).toBe(true);
    expect(g.place(18, 0)).toEqual({ ok: true, won: false });
  });

  it('always matches the brute-force definition', () => {
    for (const radius of [8, 9] as const) {
      fc.assert(
        fc.property(randomGame(radius, 30), ({ snapshots }) => {
          for (const { game } of snapshots) {
            const got = new Set(game.playableCells().map((h) => hexKey(h.q, h.r)));
            expect(got).toEqual(brutePlayable(game));
          }
        }),
        { numRuns: 25 },
      );
    }
  });
});

describe('winning', () => {
  const playSequence = (moves: Hex[], radius = 9) => {
    const g = new Game(radius);
    for (const m of moves) {
      const res = g.place(m.q, m.r);
      if (!res.ok) throw new Error(`illegal ${m.q},${m.r}: ${res.error}`);
    }
    return g;
  };

  it('spec example: an O stone at one end does not stop six', () => {
    // X: (-3,0) (-2,0) (-1,0) (1,0) (2,0); O at (3,0); X completes at (0,0).
    const g = playSequence([
      { q: -3, r: 0 },               // X
      { q: 3, r: 0 }, { q: 5, r: 5 }, // O
      { q: -2, r: 0 }, { q: -1, r: 0 }, // X
      { q: 5, r: 4 }, { q: 4, r: 5 }, // O
      { q: 1, r: 0 }, { q: 2, r: 0 }, // X
      { q: -5, r: 6 }, { q: -6, r: 6 }, // O
    ]);
    expect(g.current).toBe('X');
    expect(g.place(0, 0)).toEqual({ ok: true, won: true });
    expect(g.winner).toBe('X');
    expect(g.winLine?.map((h) => hexKey(h.q, h.r)).sort()).toEqual(
      ['-3,0', '-2,0', '-1,0', '0,0', '1,0', '2,0'].sort(),
    );
  });

  it('a win on the first stone of a turn ends the game immediately', () => {
    const g = playSequence([
      { q: 0, r: 0 },
      { q: 0, r: 3 }, { q: 1, r: 3 },
      { q: 0, r: -1 }, { q: 0, r: -2 },
      { q: 2, r: 3 }, { q: 3, r: 3 },
      { q: 0, r: -3 }, { q: 0, r: -4 },
      { q: -3, r: 4 }, { q: -4, r: 5 },
    ]);
    expect(g.place(0, -5)).toEqual({ ok: true, won: true });
    expect(g.winner).toBe('X');
    expect(g.stonesLeft).toBe(1);
    expect(g.place(5, 5)).toEqual({ ok: false, error: 'game-over' });
  });

  it('a win on the second stone freezes the turn state, like the spec pseudocode', () => {
    // O completes six on the second stone of turn 6.
    const g = playSequence([
      { q: 0, r: 0 },
      { q: 0, r: 5 }, { q: 1, r: 5 },
      { q: -3, r: 0 }, { q: -4, r: 2 },
      { q: 2, r: 5 }, { q: 3, r: 5 },
      { q: -6, r: 1 }, { q: 4, r: -3 },
      { q: 4, r: 5 },
    ]);
    expect([g.current, g.turn, g.stonesLeft]).toEqual(['O', 6, 1]);
    expect(g.place(5, 5)).toEqual({ ok: true, won: true });
    expect([g.winner, g.current, g.turn, g.stonesLeft]).toEqual(['O', 'O', 6, 0]);
    g.undo();
    expect([g.winner, g.current, g.turn, g.stonesLeft]).toEqual([null, 'O', 6, 1]);
  });

  it('lines longer than six win, along all three axes', () => {
    for (const axis of LINE_AXES) {
      const g = new Game(9);
      // X builds along the axis, skipping index 3; O plays far off-line.
      const xs = [0, 1, 2, 4, 5, 6].map((i) => ({ q: axis.q * i, r: axis.r * i }));
      const os = [[-4, 7], [-5, 7], [-4, 8], [-5, 8], [-6, 8], [-6, 9]].map(([q, r]) => ({ q: q!, r: r! }));
      g.place(xs[0]!.q, xs[0]!.r);
      let xi = 1;
      let oi = 0;
      while (xi < xs.length) {
        g.place(os[oi]!.q, os[oi]!.r); oi++;
        g.place(os[oi]!.q, os[oi]!.r); oi++;
        g.place(xs[xi]!.q, xs[xi]!.r); xi++;
        if (xi < xs.length) { g.place(xs[xi]!.q, xs[xi]!.r); xi++; }
      }
      expect(g.winner).toBeNull();
      // X still has the second stone of this turn; filling the gap makes seven.
      expect([g.current, g.stonesLeft]).toEqual(['X', 1]);
      expect(g.place(axis.q * 3, axis.r * 3)).toEqual({ ok: true, won: true });
      expect(g.winLine).toHaveLength(7);
    }
  });

  it('winner matches a brute-force six-in-a-row scan after every stone', () => {
    fc.assert(
      fc.property(randomGame(9, 80), ({ snapshots }) => {
        for (const { game } of snapshots) {
          const board = new Map<string, Player>();
          for (const m of game.moves) board.set(hexKey(m.q, m.r), game.stoneAt(m.q, m.r)!);
          const xSix = bruteHasSix(board, 'X');
          const oSix = bruteHasSix(board, 'O');
          expect(game.winner === 'X').toBe(xSix);
          expect(game.winner === 'O').toBe(oSix);
        }
      }),
      { numRuns: 60 },
    );
  });
});

describe('history', () => {
  it('undo restores the exact previous state, and replaying moves reproduces the game', () => {
    fc.assert(
      fc.property(randomGame(9, 50), ({ game, snapshots }) => {
        const rebuilt = Game.fromMoves(game.moves, 9);
        expect(rebuilt.snapshot()).toEqual(game.snapshot());
        for (let i = snapshots.length - 1; i > 0; i--) {
          game.undo();
          expect(game.snapshot()).toEqual(snapshots[i - 1]!.game.snapshot());
          expect(game.playableCells().length).toBe(snapshots[i - 1]!.game.playableCells().length);
        }
      }),
      { numRuns: 40 },
    );
  });

  it('fromMoves rejects an illegal record', () => {
    expect(() => Game.fromMoves([{ q: 0, r: 0 }, { q: 0, r: 0 }], 9)).toThrow(/occupied/);
    expect(() => Game.fromMoves([{ q: 0, r: 0 }, { q: 12, r: 0 }], 9)).toThrow(/out-of-range/);
  });
});
