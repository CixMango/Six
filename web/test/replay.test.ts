import { describe, expect, it } from 'vitest';
import { Game } from '../src/shared/rules.ts';
import { buildReplay, summarize, validateReplay } from '../src/shared/replay.ts';

const players = {
  X: { name: 'Levi', kind: 'human' as const },
  O: { name: 'Rookie 3', kind: 'bot' as const, bot: 'rookie:3' },
};

function wonGame(): Game {
  // X builds (0..5, 0); O plays harmlessly on row 3.
  const moves: Array<[number, number]> = [
    [0, 0], [0, 3], [1, 3], [1, 0], [2, 0], [3, 3], [4, 3], [3, 0], [4, 0], [-3, 3], [-4, 3], [5, 0],
  ];
  return Game.fromMoves(moves.map(([q, r]) => ({ q, r })), 9);
}

describe('replays', () => {
  it('round-trips a finished game through JSON and validation', () => {
    const game = wonGame();
    expect(game.winner).toBe('X');
    const record = buildReplay({ game, mode: 'bot', players, resignedBy: null, now: new Date('2026-09-14T20:00:00Z'), id: 'r1' });
    const parsed = validateReplay(JSON.parse(JSON.stringify(record)));
    expect(parsed).toEqual(record);
    expect(parsed.result).toEqual({ winner: 'X', reason: 'six' });
    expect(summarize(parsed)).toMatchObject({ id: 'r1', stones: 12, turns: 7, winner: 'X', reason: 'six', radius: 9 });
  });

  it('records resignations and unfinished games', () => {
    const game = Game.fromMoves([{ q: 0, r: 0 }, { q: 1, r: 1 }], 8);
    const resigned = buildReplay({ game, mode: 'online', players, resignedBy: 'O', id: 'r2' });
    expect(resigned.result).toEqual({ winner: 'X', reason: 'resign' });
    const open = buildReplay({ game, mode: 'analysis', players, resignedBy: null, id: 'r3' });
    expect(open.result).toEqual({ winner: null, reason: 'unfinished' });
    expect(validateReplay(open).radius).toBe(8);
  });

  it('rejects records whose moves are illegal or whose result lies', () => {
    const record = buildReplay({ game: wonGame(), mode: 'bot', players, resignedBy: null, id: 'r4' });
    expect(() => validateReplay({ ...record, moves: [...record.moves, [9, 9]] })).toThrow(/illegal/);
    expect(() => validateReplay({ ...record, moves: record.moves.slice(0, -1) })).toThrow(/result/);
    expect(() => validateReplay({ ...record, result: { winner: 'O', reason: 'six' } })).toThrow(/result/);
    expect(() => validateReplay({ ...record, format: 'nope' })).toThrow(/format/);
    expect(() => validateReplay({ ...record, id: '../etc/passwd' })).toThrow(/id/);
    expect(() => validateReplay({ ...record, radius: 3 })).toThrow(/radius/);
  });
});

describe('swapped colours', () => {
  it('survive saving and loading, and are left out when not set', async () => {
    const { buildReplay, validateReplay } = await import('../src/shared/replay.ts');
    const { Game } = await import('../src/shared/rules.ts');
    const seat = { name: 'A', kind: 'human' as const };
    const game = Game.fromMoves([{ q: 0, r: 0 }], 8);
    const swapped = buildReplay({ game, mode: 'hexo', players: { X: seat, O: seat }, resignedBy: null, swapColors: true });
    expect(validateReplay(JSON.parse(JSON.stringify(swapped))).swapColors).toBe(true);
    const plain = buildReplay({ game, mode: 'bot', players: { X: seat, O: seat }, resignedBy: null });
    expect('swapColors' in validateReplay(JSON.parse(JSON.stringify(plain)))).toBe(false);
  });
});
