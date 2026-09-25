import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fromHexoGame, fromHexoSandbox, hexoApiPath, parseHexoLink } from '../src/shared/hexoImport.ts';
import { Game } from '../src/shared/rules.ts';

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

describe('HeXO links', () => {
  it('reads sandbox and finished-game links, and nothing else', () => {
    expect(parseHexoLink('https://hexo.did.science/sandbox/ldqa40j')).toEqual({ kind: 'sandbox', id: 'ldqa40j' });
    expect(parseHexoLink(' https://hexo.did.science/games/72a66720-d345-4f5e-ad41-c294f94b6a83/ ')).toEqual({
      kind: 'game', id: '72a66720-d345-4f5e-ad41-c294f94b6a83',
    });
    expect(parseHexoLink('https://evil.example/sandbox/ldqa40j')).toBeNull();
    expect(parseHexoLink('https://hexo.did.science/leaderboard')).toBeNull();
    expect(parseHexoLink('not a link')).toBeNull();
    expect(hexoApiPath({ kind: 'sandbox', id: 'ldqa40j' })).toBe('/api/sandbox-positions/ldqa40j');
    expect(hexoApiPath({ kind: 'game', id: 'abc' })).toBe('/api/finished-games/abc');
  });
});

describe('HeXO import', () => {
  it('turns a shared sandbox position into our moves, in turn order', () => {
    const g = fromHexoSandbox(fixture('hexo-sandbox.json'));
    expect(g.moves).toHaveLength(11);
    expect(g.moves[0]).toEqual({ q: 0, r: 0 });
    expect(g.moves[1]).toEqual({ q: -2, r: 2 });
    expect(g.names).toEqual({ X: 'Player 1', O: 'Player 2' });
    expect(Game.fromMoves(g.moves, 8).current).toBe('X'); // HeXO said player 1 is to move
    expect(g.swapColors).toBe(false); // player 1 (yellow X on HeXO) opened, as our X does
  });

  it('turns a finished game into our moves, with the names and the result', () => {
    const g = fromHexoGame(fixture('hexo-game.json'));
    expect(g.moves).toHaveLength(37);
    expect(g.names).toEqual({ X: 'Guest C812', O: 'Guest 419F' });
    expect(Game.fromMoves(g.moves, 8).winner).toBe('X'); // won by six in a row, as HeXO recorded
    expect(g.gaveUp).toBeNull();
    // Guest C812 opened, but was HeXO's colour 1 (light blue, O): shown swapped to keep them blue.
    expect(g.swapColors).toBe(true);
  });

  it('refuses stones out of turn order', () => {
    const cells = [
      { x: 0, y: 0, player: 'player-1', moveId: 1 },
      { x: 1, y: 0, player: 'player-1', moveId: 2 },
    ];
    expect(() => fromHexoSandbox({ gamePosition: { cells } })).toThrow(/turn order/);
  });

  it('keeps a sandbox player 2 opening in blue', () => {
    const cells = [{ x: 0, y: 0, player: 'player-2', moveId: 1 }, { x: 1, y: 0, player: 'player-1', moveId: 2 }];
    const g = fromHexoSandbox({ gamePosition: { cells } });
    expect(g.swapColors).toBe(true);
    expect(g.names).toEqual({ X: 'Player 2', O: 'Player 1' });
  });
});
