import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { hexKey, type Hex } from '../src/shared/hex.ts';
import { Game, otherPlayer } from '../src/shared/rules.ts';
import { threatWindows } from '../src/shared/tactics.ts';
import { chooseTurn } from '../src/shared/bots/rookie.ts';

const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
};

function play(moves: Array<[number, number]>): Game {
  return Game.fromMoves(moves.map(([q, r]) => ({ q, r })), 9);
}

describe('Rookie bot', () => {
  it('opens with a single playable stone', () => {
    const g = new Game(9);
    const turn = chooseTurn(g, { level: 3, random: seeded(1) });
    expect(turn).toHaveLength(1);
    expect(g.isPlayable(turn[0]!.q, turn[0]!.r)).toBe(true);
  });

  it('takes a win that needs two stones', () => {
    // X has four in a row; it is X's turn with two stones.
    const g = play([[0, 0], [0, 3], [1, 3], [1, 0], [2, 0], [5, 5], [5, 6], [3, 0], [-4, 6], [-5, 7], [-5, 8]]);
    expect([g.current, g.stonesLeft]).toEqual(['X', 2]);
    for (const level of [1, 3, 5]) {
      const probe = g.clone();
      for (const cell of chooseTurn(probe, { level, random: seeded(level) })) probe.place(cell.q, cell.r);
      expect(probe.winner).toBe('X');
    }
  });

  it('blocks an open four so the opponent has no two-stone win left', () => {
    // O has four in a row; X to move with two stones.
    const g = play([[0, 2], [0, 0], [1, 0], [5, 5], [5, 6], [2, 0], [3, 0], [-3, 6], [-4, 7]]);
    expect([g.current, g.stonesLeft]).toEqual(['O', 2]);
    g.place(6, -3);
    g.place(7, -4);
    expect([g.current, g.stonesLeft]).toEqual(['X', 2]);
    expect(threatWindows(g, 'O').length).toBeGreaterThan(0);
    for (const level of [3, 5]) {
      const probe = g.clone();
      for (const cell of chooseTurn(probe, { level, random: seeded(level) })) probe.place(cell.q, cell.r);
      expect(threatWindows(probe, 'O')).toEqual([]);
    }
  });

  it('always returns distinct legal stones for the rest of the turn (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 40 }), fc.integer({ min: 1, max: 5 }), fc.nat(), (choices, level, seed) => {
        const g = new Game(9);
        for (const c of choices) {
          if (g.winner) break;
          const cells = g.playableCells().filter((h) => g.moves.length === 0 || g.moves.some((s) => Math.max(Math.abs(s.q - h.q), Math.abs(s.r - h.r), Math.abs(s.q + s.r - h.q - h.r)) <= 2));
          const pick = cells[c % cells.length]!;
          g.place(pick.q, pick.r);
        }
        if (g.winner) return;
        const before = g.stonesLeft;
        const mover = g.current;
        const untouched = JSON.stringify(g.snapshot());
        const turn: Hex[] = chooseTurn(g, { level, random: seeded(seed) });
        expect(JSON.stringify(g.snapshot())).toBe(untouched);
        expect(turn.length).toBeGreaterThanOrEqual(1);
        expect(turn.length).toBeLessThanOrEqual(before);
        expect(new Set(turn.map((h) => hexKey(h.q, h.r))).size).toBe(turn.length);
        const probe = g.clone();
        for (const cell of turn) {
          const res = probe.place(cell.q, cell.r);
          expect(res.ok).toBe(true);
        }
        // A shorter turn is only allowed when it already won.
        if (turn.length < before) expect(probe.winner).toBe(mover);
        expect(probe.winner === otherPlayer(mover)).toBe(false);
      }),
      { numRuns: 40 },
    );
  });
});
