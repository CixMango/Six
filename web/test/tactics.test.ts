import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { hexKey, LINE_AXES, type Hex } from '../src/shared/hex.ts';
import { Game, otherPlayer, type Player } from '../src/shared/rules.ts';
import { lineWindows, threatWindows, winningMoves, coverThreats } from '../src/shared/tactics.ts';

// Filler stones on r = -7, three apart: reachable, never forming lines, and clear of the test stones' windows.
function makeFiller() {
  let k = 0;
  return (): Hex => ({ q: 3 * k++, r: -7 });
}

function position(xs: Hex[], os: Hex[], radius = 9): Game {
  const g = new Game(radius);
  const queue: Record<Player, Hex[]> = { X: [...xs], O: [...os] };
  const filler = makeFiller();
  let guard = 0;
  while ((queue.X.length || queue.O.length) && guard++ < 500) {
    const next = queue[g.current].shift() ?? filler();
    const res = g.place(next.q, next.r);
    if (!res.ok) throw new Error(`setup failed at ${next.q},${next.r}: ${res.error}`);
  }
  // Continue the filler lattice from where it stopped.
  (g as Game & { filler?: () => Hex }).filler = filler;
  return g;
}

/** Pads with filler until `player` is to move with a full two-stone turn. */
function advanceTo(g: Game, player: Player): Game {
  const filler = (g as Game & { filler?: () => Hex }).filler ?? makeFiller();
  while (!(g.current === player && g.stonesLeft === 2)) {
    const c = filler();
    const res = g.place(c.q, c.r);
    if (!res.ok) throw new Error(`advance failed at ${c.q},${c.r}: ${res.error}`);
  }
  return g;
}

const bruteWindows = (g: Game) => {
  const seen = new Map<string, { x: number; o: number; empties: string[] }>();
  for (const s of g.moves) {
    for (const a of LINE_AXES) {
      for (let k = 0; k < 6; k++) {
        const start = { q: s.q - a.q * k, r: s.r - a.r * k };
        const id = `${hexKey(start.q, start.r)}/${hexKey(a.q, a.r)}`;
        if (seen.has(id)) continue;
        let x = 0;
        let o = 0;
        const empties: string[] = [];
        for (let i = 0; i < 6; i++) {
          const c = { q: start.q + a.q * i, r: start.r + a.r * i };
          const p = g.stoneAt(c.q, c.r);
          if (p === 'X') x++;
          else if (p === 'O') o++;
          else empties.push(hexKey(c.q, c.r));
        }
        seen.set(id, { x, o, empties: empties.sort() });
      }
    }
  }
  return seen;
};

describe('line windows', () => {
  it('enumerates exactly the six-cell windows that touch a stone, with correct counts', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 30 }), (choices) => {
        const g = new Game(9);
        for (const c of choices) {
          if (g.winner) break;
          const cells = g.playableCells().filter((h) => g.moves.length === 0 || g.moves.some((s) => Math.max(Math.abs(s.q - h.q), Math.abs(s.r - h.r), Math.abs(s.q + s.r - h.q - h.r)) <= 2));
          const pick = cells[c % cells.length]!;
          g.place(pick.q, pick.r);
        }
        const got = new Map(
          lineWindows(g).map((w) => [
            `${hexKey(w.start.q, w.start.r)}/${hexKey(w.axis.q, w.axis.r)}`,
            { x: w.counts.X, o: w.counts.O, empties: w.empties.map((e) => hexKey(e.q, e.r)).sort() },
          ]),
        );
        expect(got).toEqual(bruteWindows(g));
      }),
      { numRuns: 40 },
    );
  });
});

describe('winning moves', () => {
  it('finds a one-stone win from five in a window', () => {
    const g = position([{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }, { q: 4, r: 0 }], [{ q: 0, r: 3 }, { q: 1, r: 3 }, { q: 3, r: 3 }, { q: 4, r: 4 }]);
    const wins = winningMoves(g, 'X', 1);
    expect(wins.map((w) => w.map((h) => hexKey(h.q, h.r)).join('|')).sort()).toEqual(['-1,0', '5,0']);
  });

  it('finds two-stone wins from four in a window, and reports them against the opponent too', () => {
    const g = advanceTo(position([{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }], []), 'X');
    const wins = winningMoves(g, 'X', 2);
    expect(wins.map((w) => w.map((h) => hexKey(h.q, h.r)).sort().join('|')).sort()).toEqual(
      ['-1,0|-2,0', '-1,0|4,0', '4,0|5,0'],
    );
    for (const w of wins) {
      const probe = g.clone();
      for (const cell of w) probe.place(cell.q, cell.r);
      expect(probe.winner).toBe('X');
    }
    // The same fours are threats from O's point of view: O must cover them.
    expect(threatWindows(g, 'X')).toHaveLength(3);
    expect(winningMoves(g, 'O', 2)).toEqual([]);
  });
});

describe('threat cover', () => {
  it('a straight four open at both ends has threats that one or two stones can cover', () => {
    const g = position([], [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }]);
    const threats = threatWindows(g, 'O');
    expect(threats.length).toBeGreaterThan(0);
    const cover = coverThreats(threats, 2);
    expect(cover).not.toBeNull();
    expect(cover!.length).toBeLessThanOrEqual(2);
    const covered = new Set(cover!.map((h) => hexKey(h.q, h.r)));
    for (const t of threats) expect(t.empties.some((e) => covered.has(hexKey(e.q, e.r)))).toBe(true);
  });

  it('three separate fours cannot be covered with two stones', () => {
    const g = position([], [
      { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 },
      { q: 0, r: 4 }, { q: 1, r: 4 }, { q: 2, r: 4 }, { q: 3, r: 4 },
      { q: -6, r: 0 }, { q: -6, r: 1 }, { q: -6, r: 2 }, { q: -6, r: 3 },
    ]);
    expect(coverThreats(threatWindows(g, 'O'), 2)).toBeNull();
  });

  it('cover results always hit every threat window (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 60 }), (choices) => {
        const g = new Game(9);
        for (const c of choices) {
          if (g.winner) break;
          const cells = g.playableCells().filter((h) => g.moves.length === 0 || g.moves.some((s) => Math.max(Math.abs(s.q - h.q), Math.abs(s.r - h.r), Math.abs(s.q + s.r - h.q - h.r)) <= 1));
          const pick = cells[c % cells.length]!;
          g.place(pick.q, pick.r);
        }
        for (const p of ['X', 'O'] as const) {
          const threats = threatWindows(g, p);
          for (const budget of [1, 2]) {
            const cover = coverThreats(threats, budget);
            if (!cover) continue;
            expect(cover.length).toBeLessThanOrEqual(budget);
            const set = new Set(cover.map((h) => hexKey(h.q, h.r)));
            for (const t of threats) expect(t.empties.some((e) => set.has(hexKey(e.q, e.r)))).toBe(true);
            expect(threats.every((t) => t.counts[otherPlayer(p)] === 0)).toBe(true);
          }
        }
      }),
      { numRuns: 40 },
    );
  });
});
