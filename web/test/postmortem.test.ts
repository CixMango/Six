import { describe, expect, it } from 'vitest';
import { Game, type Player } from '../src/shared/rules.ts';
import { postmortem } from '../src/shared/postmortem.ts';

function play(turns: number[][][], radius = 9): Game {
  const game = new Game(radius);
  for (const turn of turns) {
    for (const [q, r] of turn) {
      const result = game.place(q!, r!);
      if (!result.ok) throw new Error(`illegal stone ${q},${r}: ${result.error}`);
      if (result.won) return game;
    }
  }
  return game;
}

// Filler turns for the idle side, spread out so they never make four.
const IDLE = [
  [[0, -5], [2, -5]],
  [[4, -5], [6, -5]],
  [[0, -7], [2, -7]],
  [[4, -7], [6, -7]],
];

describe('why a game ended', () => {
  it('says nothing about a game still being played', () => {
    expect(postmortem(play([[[0, 0]], IDLE[0]!]))).toBeNull();
  });

  it('names the two attacks a side could not both answer', () => {
    // Yellow builds two lines of three, turns both into fours on turn 9, and Blue has two stones for four holes.
    const game = play([
      [[0, 0]],
      IDLE[0]!,
      [[1, 0], [0, 6]],
      IDLE[1]!,
      [[2, 0], [1, 6]],
      IDLE[2]!,
      [[2, 6], [5, -3]],
      IDLE[3]!,
      [[3, 0], [3, 6]],
      [[4, 0], [-1, 0]], // Blue kills one line completely
      [[4, 6], [5, 6]], // and Yellow finishes the other
    ]);
    const report = postmortem(game);
    expect(report).not.toBeNull();
    expect(report!.winner).toBe('X' satisfies Player);
    expect(report!.headline).toContain('two lines at once');
    expect(report!.why[0]!.turn).toBe(10);
    expect(report!.why[0]!.text).toBe(
      'By turn 10, Yellow was one move from six on two separate lines. '
        + 'Blue had two stones to block with and would have needed four.',
    );
  });

  it('names the four a side left standing', () => {
    const game = play([
      [[0, 0]],
      IDLE[0]!,
      [[1, 0], [2, 0]],
      IDLE[1]!,
      [[3, 0], [4, 0]], // Yellow has five in a row: both ends win it
      IDLE[2]!, // Blue blocks neither
      [[5, 0], [-1, 0]],
    ]);
    const report = postmortem(game);
    expect(report!.why[0]!.turn).toBe(6);
    expect(report!.why[0]!.text).toContain('one move from six on turn 6');
    expect(report!.headline).toContain('left open');
  });

  it('names the four that actually ended it, not the first one that was let go', () => {
    const game = play([
      [[0, 0]],
      IDLE[0]!,
      [[1, 0], [2, 0]],
      IDLE[1]!,
      [[3, 0], [0, 3]], // Yellow has four on r=0
      IDLE[2]!, // Blue lets it stand, and Yellow doesn't take it
      [[1, 3], [2, 3]],
      [[4, 0], [-1, 0]], // now Blue blocks that one
      [[3, 3], [7, -3]], // Yellow has four on r=3
      IDLE[3]!, // Blue lets this one stand too
      [[4, 3], [5, 3]],
    ]);
    const report = postmortem(game)!;
    expect(report.why[0]!.turn).toBe(10);
  });

  it('names a win the loser had and did not take', () => {
    const game = play([
      [[0, 0]],
      [[0, -5], [1, -5]],
      [[1, 0], [2, 0]],
      [[2, -5], [3, -5]], // Blue has four in a row of its own
      [[3, 0], [4, 0]], // Yellow has five
      [[7, -7], [9, -7]], // Blue could have played (4,-5) and (5,-5) for six
      [[5, 0], [-1, 0]],
    ]);
    const report = postmortem(game);
    expect(report!.why[0]!.text).toContain('could have finished six on turn 6');
  });

  it('counts the turns the loser spent answering a threat', () => {
    const game = play([
      [[0, 0]],
      IDLE[0]!,
      [[1, 0], [2, 0]],
      IDLE[1]!,
      [[3, 0], [4, 0]],
      IDLE[2]!,
      [[5, 0], [-1, 0]],
    ]);
    const report = postmortem(game)!;
    expect(report.turnsUnderThreat).toBe(1);
    expect(report.stones).toBe(game.moves.length);
    expect(report.turn).toBe(game.turn);
  });
});
