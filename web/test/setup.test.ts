import { describe, expect, it } from 'vitest';
import { Game, type Setup } from '../src/shared/rules.ts';
import { lineWindows } from '../src/shared/tactics.ts';

const row = (player: 'X' | 'O', r: number, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ q: from + i, r, player }));

describe('set-up positions', () => {
  it('holds any stones, with the side to move and stones left chosen', () => {
    const xs = Array.from({ length: 12 }, (_, q) => ({ q, r: 3 * (q % 2), player: 'X' as const }));
    const setup: Setup = { stones: [...xs, ...row('O', 10, 0, 2)], toMove: 'O', stonesLeft: 1 };
    const game = new Game(8, setup);
    expect(game.stones).toHaveLength(15);
    expect(game.moves).toHaveLength(0);
    expect(game.stoneAt(4, 0)).toBe('X');
    expect(game.current).toBe('O');
    expect(game.stonesLeft).toBe(1);
    expect(game.winner).toBeNull();
  });

  it('a six already on the board ends the game', () => {
    const game = new Game(8, { stones: row('O', 0, 0, 5), toMove: 'X', stonesLeft: 2 });
    expect(game.winner).toBe('O');
    expect(game.winLine).toHaveLength(6);
    expect(game.stonesLeft).toBe(0);
    expect(game.place(0, 1)).toEqual({ ok: false, error: 'game-over' });
  });

  it('play goes on from the chosen side, and undo stops at the set-up stones', () => {
    const game = new Game(8, { stones: [{ q: 0, r: 0, player: 'X' }, { q: 2, r: 0, player: 'O' }], toMove: 'O', stonesLeft: 1 });
    expect(game.isPlayable(8, 0)).toBe(true);
    expect(game.place(1, 1)).toEqual({ ok: true, won: false });
    expect(game.stoneAt(1, 1)).toBe('O');
    expect(game.current).toBe('X');
    expect(game.stonesLeft).toBe(2);
    expect(game.ownerOfMove(0)).toBe('O');
    game.undo();
    game.undo();
    expect(game.stones).toHaveLength(2);
    expect(game.current).toBe('O');
  });

  it('every side and stone count', () => {
    for (const toMove of ['X', 'O'] as const) {
      for (const stonesLeft of [1, 2] as const) {
        const game = new Game(8, { stones: [{ q: 0, r: 0, player: 'O' }], toMove, stonesLeft });
        expect([game.current, game.stonesLeft, game.isSecondStone]).toEqual([toMove, stonesLeft, stonesLeft === 1]);
      }
    }
    const opening = new Game(8, { stones: [], toMove: 'X', stonesLeft: 1 });
    expect(opening.isSecondStone).toBe(false);
    expect(opening.isPlayable(8, 0)).toBe(true);
  });

  it('refuses overlapping stones', () => {
    expect(() => new Game(8, { stones: [{ q: 0, r: 0, player: 'X' }, { q: 0, r: 0, player: 'O' }], toMove: 'X', stonesLeft: 2 })).toThrow();
  });

  it('threat windows see the set-up stones', () => {
    const game = new Game(8, { stones: row('O', 0, 0, 3), toMove: 'X', stonesLeft: 2 });
    expect(lineWindows(game).some((w) => w.counts.O === 4)).toBe(true);
  });

  it('clone and fromMoves keep the set-up', () => {
    const setup: Setup = { stones: [{ q: 0, r: 0, player: 'X' }], toMove: 'X', stonesLeft: 2 };
    const game = Game.fromMoves([{ q: 1, r: 0 }, { q: 2, r: 0 }], 8, setup);
    expect(game.clone().stones).toHaveLength(3);
    expect(game.clone().current).toBe('O');
  });
});
