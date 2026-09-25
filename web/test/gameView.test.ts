import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Game } from '../src/shared/rules.ts';
import { validateReplay } from '../src/shared/replay.ts';
import { summarizeTurn, takeBackTarget, threatCallout, turnSummary } from '../src/client/lib/gameView.ts';

const names = { X: 'Levi', O: 'Rookie 3' };
const play = (moves: Array<[number, number]>) => Game.fromMoves(moves.map(([q, r]) => ({ q, r })), 9);

describe('play-by-play', () => {
  it('credits the summary to the side that played the completed turn', () => {
    // O has finished a turn and X is mid-turn: the summary is still O's.
    expect(summarizeTurn(play([[0, 0], [3, 3], [4, 3], [1, 0]]), names)).toEqual({ player: 'O', text: 'Rookie 3 placed two stones' });
  });

  it('summarizes the last completed turn in words, ignoring a turn still in progress', () => {
    expect(turnSummary(new Game(9), names)).toBeNull();
    expect(turnSummary(play([[0, 0]]), names)).toBe('Levi opened the game');
    expect(turnSummary(play([[0, 0], [3, 3]]), names)).toBe('Levi opened the game');
    expect(turnSummary(play([[0, 0], [3, 3], [4, 3]]), names)).toBe('Rookie 3 placed two stones');
    // X builds 0..2 on row 0 over two turns: a line of 3.
    expect(turnSummary(play([[0, 0], [3, 3], [4, 3], [1, 0], [2, 0]]), names)).toBe('Levi built a line of 3');
    // X gets four in a row: a four.
    expect(turnSummary(play([[0, 0], [3, 3], [4, 3], [1, 0], [2, 0], [-3, 3], [-4, 3], [3, 0], [9, -9]]), names)).toBe(
      'Levi made a four',
    );
  });

  it('names a block when the turn removed every open four', () => {
    // O has four on row 0; X covers both ends.
    const g = play([[0, 2], [0, 0], [1, 0], [5, 5], [5, 6], [2, 0], [3, 0], [-1, 0], [4, 0]]);
    expect(turnSummary(g, names)).toBe('Levi blocked Rookie 3’s four');
  });

  it('names a threat two stones cannot stop', () => {
    // X builds two separate fours in one turn.
    const g = play([
      [0, 0], [0, 5], [9, -5],
      [1, 0], [2, 0], [0, 6], [9, -4],
      [0, 3], [1, 3], [0, 7], [8, -4],
      [2, 3], [3, 3], [-6, 6], [-7, 8],
      [3, 0], [4, 3],
    ]);
    expect(g.current).toBe('O');
    expect(turnSummary(g, names)).toBe('Levi made a threat two stones can’t stop');
  });

  it('calls out a line one turn from six only for the side that has to block', () => {
    // O has four in a row; X is to move.
    const g = play([[0, 2], [0, 0], [1, 0], [5, 5], [5, 6], [2, 0], [3, 0]]);
    expect(g.current).toBe('X');
    expect(threatCallout(g, names)).toBe('Rookie 3 is one turn from six. Levi has to block.');
    expect(threatCallout(play([[0, 0], [1, 0], [2, 0]]), names)).toBeNull();
  });

  it('takes back to the start of the player’s most recent turn', () => {
    const g = play([[0, 0], [1, -1], [2, -1], [0, 1]]);
    expect(takeBackTarget(g, 'X')).toBe(3);
    expect(takeBackTarget(g, 'O')).toBe(1);
    expect(takeBackTarget(play([[0, 0], [1, -1]]), 'X')).toBe(0);
    expect(takeBackTarget(new Game(9), 'X')).toBeNull();
  });
});

describe('replay fixtures', () => {
  const dir = path.join(import.meta.dirname, 'fixtures/replays');
  for (const file of readdirSync(dir)) {
    it(`${file} is a valid replay whose id matches its file name`, () => {
      const record = validateReplay(JSON.parse(readFileSync(path.join(dir, file), 'utf8')));
      expect(`${record.id}.json`).toBe(file);
    });
  }
});
