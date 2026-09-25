import { describe, expect, it } from 'vitest';
import type { Hex } from '../src/shared/hex.ts';
import { gameStory, judgeTurn, keyMoments, LABEL_ORDER, LABELS, reviewGame, turnsOf, type PositionFacts } from '../src/shared/review.ts';

const names = { X: 'Levi', O: 'Six' };
const h = (q: number, r: number): Hex => ({ q, r });

const at = (winX: number, best: Hex[] = [], proven: 'X' | 'O' | null = null): PositionFacts => ({ winX, proven, best });

describe('turns of a game', () => {
  it('splits the stones into X opening stone, then two per turn, the last possibly short', () => {
    const moves = [h(0, 0), h(1, 0), h(2, 0), h(0, 1), h(0, 2), h(5, 5)];
    expect(turnsOf(moves).map((t) => [t.mover, t.start, t.stones.length])).toEqual([
      ['X', 0, 1], ['O', 1, 2], ['X', 3, 2], ['O', 5, 1],
    ]);
  });
});

describe('coach review', () => {
  // Stones: X 0,0 | O 1,0 2,0 | X 0,1 0,2 | O 5,5 5,6
  const moves = [h(0, 0), h(1, 0), h(2, 0), h(0, 1), h(0, 2), h(5, 5), h(5, 6)];

  it('labels turns by how much winning chance the mover gave away', () => {
    const facts = [
      at(0.55, [h(0, 0)]),                  // before X's opening: X plays Six's choice
      at(0.55, [h(1, 0), h(2, 0)]),         // before O: O plays Six's choice (O's chance stays 45%)
      at(0.55, [h(9, 9), h(9, 8)]),         // before X: X plays something else and drops to 40%
      at(0.40, [h(7, 7), h(7, 8)]),         // before O: O drops from 60% to 48%
      at(0.52),                             // after the last turn
    ];
    const review = reviewGame(moves, facts, names, null);
    expect(review.turns.map((t) => t.label)).toEqual(['best', 'best', 'mistake', 'mistake']);
    expect(review.turns[2]!.better).toEqual([h(9, 9), h(9, 8)]);
    expect(review.turns[2]!.comment).toMatch(/Levi's chances fell from 55% to 40%/);
    expect(review.turns[0]!.comment).toBeNull();
  });

  it('uses the chess.com bands: excellent, good, inaccuracy, blunder', () => {
    const review = (after: number) =>
      reviewGame([h(0, 0)], [at(0.5, [h(3, 3)]), at(after)], names, null).turns[0]!.label;
    expect(review(0.49)).toBe('excellent');  // lost 1%
    expect(review(0.47)).toBe('good');       // 3%
    expect(review(0.43)).toBe('inaccuracy'); // 7%
    expect(review(0.25)).toBe('blunder');    // 25%
  });

  it('calls a turn that hands the opponent a forced win exactly that, whatever the chances say', () => {
    const facts = [at(0.5, [h(0, 0)]), at(0.5, [h(3, 3), h(3, 4)]), at(0.48, [], 'X')];
    const review = reviewGame([h(0, 0), h(1, 0), h(2, 0)], facts, names, null);
    const turn = review.turns[1]!;
    expect(turn.label).toBe('allowed-win');
    expect(turn.comment).toMatch(/let Levi force a win/);
    expect(turn.better).toEqual([h(3, 3), h(3, 4)]);
  });

  it('knows a missed forced win and a found one', () => {
    const missed = reviewGame([h(0, 0), h(1, 0), h(2, 0)], [at(0.5), at(0.2, [h(4, 4), h(4, 5)], 'O'), at(0.5)], names, null);
    expect(missed.turns[1]!.label).toBe('missed-win');
    expect(missed.turns[1]!.comment).toMatch(/Six had a forced win/);
    const found = reviewGame([h(0, 0), h(1, 0), h(2, 0)], [at(0.5), at(0.5, [h(4, 4)]), at(0.1, [], 'O')], names, null);
    expect(found.turns[1]!.label).toBe('winning');
    expect(found.turns[1]!.comment).toMatch(/Six found a forced win/);
  });

  it('does not blame a player who was already lost, and marks the finishing turn', () => {
    const moves = [h(0, 0), h(1, 0), h(2, 0)];
    const facts = [at(0.5), at(0.95, [h(8, 8)], 'X'), at(1, [], 'X')];
    const lost = reviewGame(moves, facts, names, null).turns[1]!;
    expect(lost.label).toBe('lost');
    expect(lost.comment).toMatch(/already had a forced win/);
    const won = reviewGame(moves, [at(0.5), at(0.5), at(0, [], 'O')], names, 'O').turns[1]!;
    expect(won.label).toBe('six');
    expect(won.rating).toBe(100);
  });

  it('sums each player up: accuracy from the turn ratings, and label counts', () => {
    const facts = [at(0.5, [h(0, 0)]), at(0.5, [h(1, 0), h(2, 0)]), at(0.5)];
    const review = reviewGame([h(0, 0), h(1, 0), h(2, 0)], facts, names, null);
    expect(review.summary.X.accuracy).toBe(100);
    expect(review.summary.O.counts.best).toBe(1);
    expect(review.summary.O.turns).toBe(1);
  });
});

describe('coach tools', () => {
  it("keeps the facts before each turn, and shows the opponent's answer to a flawed turn", () => {
    const facts = [at(0.5, [h(0, 0)]), at(0.5, [h(3, 3), h(3, 4)]), at(0.48, [h(6, 6), h(6, 7)], 'X')];
    const review = reviewGame([h(0, 0), h(1, 0), h(2, 0)], facts, names, null);
    expect(review.turns[1]!.before).toEqual(facts[1]);
    expect(review.turns[1]!.reply).toEqual([h(6, 6), h(6, 7)]);
    expect(review.turns[0]!.reply).toBeNull(); // Six's own choice: nothing to punish
  });

  it('judges a single retried turn the same way as in the review', () => {
    const turn = { mover: 'O' as const, start: 1, stones: [h(3, 3), h(3, 4)] };
    const before = at(0.5, [h(3, 3), h(3, 4)]);
    expect(judgeTurn(turn, before, at(0.5), names, false).label).toBe('best');
    expect(judgeTurn({ ...turn, stones: [h(1, 0), h(2, 0)] }, before, at(0.5, [], 'X'), names, false).label).toBe('allowed-win');
    expect(judgeTurn({ ...turn, stones: [h(1, 0), h(2, 0)] }, before, at(0, [], 'O'), names, true).label).toBe('six');
  });

  it("lists a player's key moments to practise: their flawed turns, not the lost ones", () => {
    const moves = [h(0, 0), h(1, 0), h(2, 0), h(0, 1), h(0, 2), h(5, 5), h(5, 6)];
    const facts = [at(0.5, [h(0, 0)]), at(0.5, [h(1, 0), h(2, 0)]), at(0.55, [h(9, 9), h(9, 8)]), at(0.2, [h(7, 7)], 'O'), at(0.1, [], 'O')];
    const review = reviewGame(moves, facts, names, null);
    expect(review.turns.map((t) => t.label)).toEqual(['best', 'best', 'allowed-win', 'kept-win']);
    expect(keyMoments(review, 'X')).toEqual([2]);
    expect(keyMoments(review, 'O')).toEqual([]);
    expect(keyMoments(review)).toEqual([2]);
  });
});

describe('label meanings', () => {
  it('has one fixed meaning for every label, and the key lists each once', () => {
    expect([...LABEL_ORDER].sort()).toEqual(Object.keys(LABELS).sort());
    for (const l of LABEL_ORDER) expect(LABELS[l].meaning.length).toBeGreaterThan(20);
  });

  it("keeps 'best' for Six's own choice: keeping a forced win going is 'kept the win', even on Six's move", () => {
    const turn = { mover: 'O' as const, start: 1, stones: [h(3, 3), h(3, 4)] };
    const winning = at(0.1, [h(3, 3), h(3, 4)], 'O');
    expect(judgeTurn(turn, winning, at(0, [], 'O'), names, false).label).toBe('kept-win');
    expect(judgeTurn({ ...turn, stones: [h(8, 8), h(8, 9)] }, winning, at(0, [], 'O'), names, false).label).toBe('kept-win');
    expect(judgeTurn(turn, at(0.5, [h(3, 3), h(3, 4)]), at(0.5), names, false).label).toBe('best');
  });

  it('a missed win that also hands the opponent a forced win says so', () => {
    const turn = { mover: 'O' as const, start: 1, stones: [h(8, 8), h(8, 9)] };
    const r = judgeTurn(turn, at(0.1, [h(3, 3), h(3, 4)], 'O'), at(0.9, [], 'X'), names, false);
    expect(r.label).toBe('missed-win');
    expect(r.comment).toMatch(/Levi had a forced win instead/);
  });
});

describe('game story', () => {
  it('names the turning point, a found forced win and the finish', () => {
    const moves = [h(0, 0), h(1, 0), h(2, 0), h(0, 1), h(0, 2)];
    const facts = [at(0.5, [h(0, 0)]), at(0.5, [h(3, 3), h(3, 4)]), at(0.9, [], 'X'), at(1, [], 'X')];
    const review = reviewGame(moves, facts, names, 'X');
    expect(gameStory(review, names, 'X')).toBe(
      'The game turned on turn 2: Six allowed a forced win. Levi finished it with six in a row on turn 3.',
    );
  });

  it('falls back to the biggest swing when nothing was proven', () => {
    const facts = [at(0.5, [h(0, 0)]), at(0.5, [h(3, 3), h(3, 4)]), at(0.62)];
    const review = reviewGame([h(0, 0), h(1, 0), h(2, 0)], facts, names, null);
    expect(gameStory(review, names, null)).toBe(
      "The biggest swing was turn 2: Six's chances fell from 50% to 38%. The game ended before six in a row.",
    );
  });
});
