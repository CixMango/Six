import { describe, expect, it } from 'vitest';
import { blunderBetween, evaluationFromScore, followProof, idleTurn, PROVEN_SCORE, rateMove, turnStart } from '../src/shared/winChance.ts';
import { Game } from '../src/shared/rules.ts';
import { hexDistance } from '../src/shared/hex.ts';

describe('win chance', () => {
  it('turns the network search value into the chance each side wins', () => {
    // Scores are from the side to move: +500 is 75% for the mover.
    expect(evaluationFromScore(500, 'X', 'six')).toEqual({ winX: 0.75, proven: null });
    expect(evaluationFromScore(500, 'O', 'six')).toEqual({ winX: 0.25, proven: null });
    expect(evaluationFromScore(-1000, 'X', 'six')).toEqual({ winX: 0, proven: null });
  });

  it('marks a forced win the solver proved, for whichever side holds it', () => {
    expect(evaluationFromScore(PROVEN_SCORE, 'O', 'six')).toEqual({ winX: 0, proven: 'O' });
    expect(evaluationFromScore(PROVEN_SCORE - 3, 'X', 'classic')).toEqual({ winX: 1, proven: 'X' });
    expect(evaluationFromScore(-(PROVEN_SCORE - 2), 'X', 'classic')).toEqual({ winX: 0, proven: 'O' });
  });

  it('squashes the alpha-beta engine heuristic score into a chance', () => {
    const e = evaluationFromScore(600, 'X', 'classic');
    expect(e.proven).toBeNull();
    expect(e.winX).toBeGreaterThan(0.6);
    expect(e.winX).toBeLessThan(0.8);
  });

  it('calls a blunder on the player whose stone handed the other a proven win', () => {
    const open = { winX: 0.5, proven: null };
    const oWins = { winX: 0, proven: 'O' as const };
    // Stones 3 and 4 are X's second turn (stone 0 is X's opener, 1-2 are O's).
    expect(blunderBetween(3, open, 5, oWins)).toBe('X');
    // O finding its own win is not a blunder by anyone.
    expect(blunderBetween(1, open, 3, oWins)).toBeNull();
    // Already lost before: nothing new happened.
    expect(blunderBetween(3, oWins, 5, oWins)).toBeNull();
    // No proof yet, however lopsided the chance.
    expect(blunderBetween(3, open, 5, { winX: 0.02, proven: null })).toBeNull();
  });
});

describe('following a proven win along a game', () => {
  const even = { winX: 0.5, proven: null };
  const oWins = { winX: 0, proven: 'O' as const };
  const oToMoveLooksWon = { winX: 0.03, proven: null };

  it('calls the blunder once, even though the solver only proves the win on the winner\'s turns', () => {
    let state = followProof(null, 3, even, 5, oWins);
    expect(state.blunder).toBe('X');
    expect(state.shown).toEqual(oWins);
    // X to move: the solver can't prove X's loss, but the win it proved still stands.
    state = followProof(state.proof, 5, oWins, 6, oToMoveLooksWon);
    expect(state.blunder).toBeNull();
    expect(state.shown).toEqual(oWins);
    state = followProof(state.proof, 6, oToMoveLooksWon, 7, oWins);
    expect(state.blunder).toBeNull();
  });

  it('drops a proof the winner threw away, so the next blunder is called again', () => {
    let state = followProof(null, 3, even, 5, oWins);
    // O, the winner, let it slip: back on O's turn (stone 9) the win is gone and the position favors X.
    state = followProof(state.proof, 5, oWins, 9, { winX: 0.7, proven: null });
    expect(state.proof).toBeNull();
    expect(state.shown).toEqual({ winX: 0.7, proven: null });
    state = followProof(state.proof, 9, even, 13, oWins); // after X's next turn (stones 11 and 12)
    expect(state.blunder).toBe('X');
  });
});

describe('checking a turn before it is played', () => {
  it('finds where the turn in progress began', () => {
    expect(turnStart(1)).toBe(0); // X's opening stone
    expect(turnStart(2)).toBe(1); // O's first stone
    expect(turnStart(3)).toBe(1); // O's second stone
    expect(turnStart(5)).toBe(3);
  });

  it('puts an idle turn on legal cells as far as possible from every stone', () => {
    const moves = [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }];
    const idle = idleTurn(moves, 8);
    expect(idle).toHaveLength(2);
    const game = Game.fromMoves(moves, 8);
    for (const cell of idle) {
      expect(game.place(cell.q, cell.r).ok).toBe(true);
      expect(Math.min(...moves.map((m) => hexDistance(m, cell)))).toBeGreaterThanOrEqual(7);
    }
  });
});

describe('blunder calls and blunder territory agree', () => {
  const even = { winX: 0.5, proven: null };
  const oWins = { winX: 0, proven: 'O' as const };

  it('blames the turn that just ended when a forced win appears with nothing judged before it', () => {
    // Stones 3 and 4 are X's turn; the first judgment of this line is already O's forced win.
    expect(followProof(null, 5, even, 5, oWins).blunder).toBe('X');
  });

  it("keeps a proven win through the loser's turns however the chance reads, so it is called only once", () => {
    let state = followProof(null, 3, even, 5, oWins);
    // X (the loser) to move at 5..6: a judgment that doubts O's win doesn't undo it.
    state = followProof(state.proof, 5, oWins, 7, { winX: 0.6, proven: null });
    expect(state.proof).toBe('O');
    expect(followProof(state.proof, 7, { winX: 0.6, proven: null }, 9, oWins).blunder).toBeNull();
  });
});

describe('rating a move', () => {
  const even = { winX: 0.5, proven: null };
  it('rates a stone by how much of its mover\'s chance it kept, 1 to 100', () => {
    expect(rateMove(even, even, 'X')).toBe(100);
    expect(rateMove(even, { winX: 0.6, proven: null }, 'X')).toBe(100); // gaining never costs
    const small = rateMove(even, { winX: 0.45, proven: null }, 'X');
    const big = rateMove(even, { winX: 0.2, proven: null }, 'X');
    expect(small).toBeGreaterThan(big);
    expect(small).toBeLessThan(100);
    expect(rateMove(even, { winX: 0.55, proven: null }, 'O')).toBe(small); // O's chance fell by the same
  });

  it('gives a 1 to handing over a forced win and a 100 to finding one', () => {
    expect(rateMove(even, { winX: 0, proven: 'O' }, 'X')).toBe(1);
    expect(rateMove(even, { winX: 1, proven: 'X' }, 'X')).toBe(100);
  });
});
