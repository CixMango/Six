import { describe, expect, it } from 'vitest';
import type { Hex } from '../src/shared/hex.ts';
import { fromHtttx, looksLikeHtttx, toHtttx } from '../src/shared/notation.ts';

const h = (q: number, r: number): Hex => ({ q, r });

describe('HTTTX', () => {
  it("matches HeXO's own parser on its example", () => {
    // HeXO's test: version[1]; 1. [0,1][1,-1]; 2. [1,0][-1,0]; 3. [2,0][-4,0]; gives these cells in its (x, y),
    // which are our (q, r).
    const moves = fromHtttx('version[1]; 1. [0,1][1,-1]; 2. [1,0][-1,0]; 3. [2,0][-4,0];');
    expect(moves).toEqual([h(0, 0), h(1, -1), h(0, 1), h(1, 0), h(-1, 0), h(2, 0), h(-4, 0)]);
  });

  it('round-trips a game, and moves it so the first stone is at the centre', () => {
    const game = [h(0, 0), h(0, -1), h(0, -2), h(1, 0), h(2, -1), h(-3, 2)];
    expect(fromHtttx(toHtttx(game))).toEqual(game);
    const shifted = game.map((m) => h(m.q + 3, m.r - 2));
    expect(toHtttx(shifted)).toBe(toHtttx(game));
    expect(toHtttx([h(0, 0), h(1, 0), h(2, 0), h(3, 0)])).toBe('version[1];\n1. [1,0][2,0];\n2. [3,0];\n');
    expect(fromHtttx('version[1];\n1. [1,0][2,0];\n2. [3,0];\n')).toEqual([h(0, 0), h(1, 0), h(2, 0), h(3, 0)]);
  });

  it('rejects bad text with a reason', () => {
    expect(() => fromHtttx('version[2]; 1. [1,0];')).toThrow(/version 1/);
    expect(() => fromHtttx('version[1]; 2. [1,0][2,0];')).toThrow(/turn 1/);
    expect(() => fromHtttx('version[1]; 1. [1,0]; 2. [3,0][4,0];')).toThrow(/two stones/);
    expect(() => fromHtttx('version[1]; 1. [0,0][1,0];')).toThrow(/legal/);
    expect(looksLikeHtttx('  version[1]; 1. [1,0];')).toBe(true);
    expect(looksLikeHtttx('https://hexo.did.science/sandbox/x')).toBe(false);
  });
});

describe('import box', () => {
  it('tells a HeXO link, HTTTX text and a replay file apart, and refuses anything else', async () => {
    const { parseGameText } = await import('../src/shared/gameImport.ts');
    const { buildReplay } = await import('../src/shared/replay.ts');
    const { Game } = await import('../src/shared/rules.ts');
    expect(parseGameText('https://hexo.did.science/sandbox/ldqa40j').kind).toBe('hexo');
    expect(parseGameText('version[1]; 1. [1,0][2,0];')).toEqual({ kind: 'htttx', moves: [h(0, 0), h(1, 0), h(2, 0)] });
    const seat = { name: 'A', kind: 'human' as const };
    const record = buildReplay({ game: Game.fromMoves([h(0, 0), h(1, 0)], 8), mode: 'bot', players: { X: seat, O: seat }, resignedBy: null });
    const parsed = parseGameText(JSON.stringify(record));
    expect(parsed.kind === 'replay' && parsed.record.moves).toEqual([[0, 0], [1, 0]]);
    expect(() => parseGameText('hello')).toThrow(/HeXO link or HTTTX/);
    expect(() => parseGameText('{ not json')).toThrow(/valid replay/);
  });
});
