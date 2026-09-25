import { existsSync } from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { Game } from '../src/shared/rules.ts';
import { EngineProcess } from '../src/server/engineProcess.ts';

const EXE = path.resolve(import.meta.dirname, '../../engine/build/release/sixengine.exe');
const haveEngine = existsSync(EXE);

describe.skipIf(!haveEngine)('HexBot engine over the Six engine protocol', () => {
  const engine = new EngineProcess(EXE);
  afterAll(() => engine.close());

  it('opens with a single legal stone', async () => {
    const cells = await engine.bestTurn([], 9, 200);
    expect(cells).toHaveLength(1);
    expect(new Game(9).isPlayable(cells[0]!.q, cells[0]!.r)).toBe(true);
  });

  it('completes six when it can', async () => {
    const moves: Array<[number, number]> = [[0, 0], [3, 3], [4, 3], [1, 0], [2, 0], [-3, 3], [-4, 3], [3, 0], [9, -9], [-5, 3], [-6, 4]];
    const game = Game.fromMoves(moves.map(([q, r]) => ({ q, r })), 9);
    const cells = await engine.bestTurn(game.moves, 9, 300);
    for (const c of cells) game.place(c.q, c.r);
    expect(game.winner).toBe('X');
  });

  it('answers queued requests in order, each for its own position', async () => {
    const a = engine.bestTurn([{ q: 0, r: 0 }], 8, 150);
    const b = engine.bestTurn([], 9, 150);
    const [first, second] = await Promise.all([a, b]);
    expect(first).toHaveLength(2);
    expect(second).toHaveLength(1);
  });
});
