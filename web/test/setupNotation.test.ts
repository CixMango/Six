import { describe, expect, it } from 'vitest';
import { Game } from '../src/shared/rules.ts';
import { looksLikeHexoNotation, parseHexoNotation, parseSetup, positionCommand, positionFor, toHexoNotation } from '../src/shared/setup.ts';

const at = (setup: ReturnType<typeof parseHexoNotation>) => new Map(setup.stones.map((s) => [`${s.q},${s.r}`, s.player]));

describe('HeXO notation', () => {
  it('reads a layout with moves (a HeXO sandbox screenshot)', () => {
    const setup = parseHexoNotation('-xxo/.xxo3x/xxo3xx/6x, d @(4, 5) x A0 A1');
    expect(setup.stones).toHaveLength(15);
    const cells = at(setup);
    for (const x of ['2,0', '3,0', '1,1', '2,1', '7,1', '0,2', '1,2', '6,2', '7,2', '6,3', '5,4', '5,5']) expect(cells.get(x)).toBe('X');
    for (const o of ['4,0', '3,1', '2,2']) expect(cells.get(o)).toBe('O');
    // X placed two, so O is next with two.
    expect([setup.toMove, setup.stonesLeft]).toEqual(['O', 2]);
  });

  it('reads a layout alone as X to move with two', () => {
    const setup = parseHexoNotation('xx.o/2o');
    expect(setup.stones).toHaveLength(4);
    expect([setup.toMove, setup.stonesLeft]).toEqual(['X', 2]);
  });

  it('reads moves alone, with X opening at the centre', () => {
    const setup = parseHexoNotation('o A0 A1 x B0');
    expect(setup.stones).toHaveLength(4);
    expect(at(setup).get('0,0')).toBe('X');
    expect([setup.toMove, setup.stonesLeft]).toEqual(['X', 1]);
  });

  it('rejects stones on one cell and unreadable text', () => {
    expect(() => parseHexoNotation('x, @(0, 0) o A0 x A0')).toThrow();
    expect(() => parseHexoNotation('xq')).toThrow();
  });

  it('tells notation from links, HTTTX and replay files', () => {
    expect(looksLikeHexoNotation('-xxo/.xxo3x, d @(4, 5) x A0 A1')).toBe(true);
    expect(looksLikeHexoNotation('xx.o')).toBe(true);
    expect(looksLikeHexoNotation('https://hexo.did.science/sandbox/abc')).toBe(false);
    expect(looksLikeHexoNotation('version[1]; 1. [1,0][2,0];')).toBe(false);
    expect(looksLikeHexoNotation('{"id":"x"}')).toBe(false);
  });

  it('writes positions that read back the same, side to move included', () => {
    const cases = ['-xxo/.xxo3x/xxo3xx/6x, d @(4, 5) x A0 A1', 'xx.o/3o', 'xox/.o, @(0, 0) o A2'];
    for (const text of cases) {
      const setup = parseHexoNotation(text);
      const back = parseHexoNotation(toHexoNotation(new Game(8, setup)));
      expect(back.toMove).toBe(setup.toMove);
      expect(back.stonesLeft).toBe(setup.stonesLeft);
      // Same shape, shifted so it starts at (0, 0).
      const norm = (s: typeof setup) => {
        const q0 = Math.min(...s.stones.map((c) => c.q));
        const r0 = Math.min(...s.stones.map((c) => c.r));
        return s.stones.map((c) => `${c.q - q0},${c.r - r0},${c.player}`).sort();
      };
      expect(norm(back)).toEqual(norm(setup));
    }
  });
});

describe('set-up helpers', () => {
  it('positionFor keeps a game when it is that side to move, else sets it up', () => {
    const game = Game.fromMoves([{ q: 0, r: 0 }, { q: 1, r: 0 }], 8);
    expect(positionFor(game, 'O')).toEqual({ setup: null, moves: [{ q: 0, r: 0 }, { q: 1, r: 0 }] });
    const forX = positionFor(game, 'X');
    expect(forX.moves).toEqual([]);
    expect(forX.setup).toEqual({ stones: [{ q: 0, r: 0, player: 'X' }, { q: 1, r: 0, player: 'O' }], toMove: 'X', stonesLeft: 2 });
  });

  it('positionCommand writes the engine line', () => {
    expect(positionCommand(8, [{ q: 1, r: 2 }], null)).toBe('position radius 8 moves 1 2');
    expect(positionCommand(8, [], { stones: [{ q: 0, r: 0, player: 'X' }], toMove: 'O', stonesLeft: 1 })).toBe(
      'position radius 8 setup x 0 0 tomove o 1',
    );
  });

  it('parseSetup checks what comes over the wire', () => {
    expect(parseSetup(undefined)).toBeNull();
    expect(parseSetup({ stones: [{ q: 0, r: 0, player: 'O' }], toMove: 'X', stonesLeft: 2 })?.stones).toHaveLength(1);
    expect(() => parseSetup({ stones: [{ q: 0.5, r: 0, player: 'O' }], toMove: 'X', stonesLeft: 2 })).toThrow();
    expect(() => parseSetup({ stones: [], toMove: 'Y', stonesLeft: 2 })).toThrow();
  });
});
