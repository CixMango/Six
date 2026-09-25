import { describe, expect, it } from 'vitest';
import type { Hex } from '../src/shared/hex.ts';
import { turnTactics } from '../src/shared/coachTactics.ts';

const names = { X: 'Levi', O: 'Six' };
const h = (q: number, r: number): Hex => ({ q, r });

// X builds along r = 0; O plays far away on r = 5.
// Stones: X 0,0 | O 0,5 1,5 | X 1,0 2,0 | O 3,5 4,5  -> X has three in a row, O has four (0..4 minus 2 = 0,1,3,4).
const start = [h(0, 0), h(0, 5), h(1, 5), h(1, 0), h(2, 0), h(3, 5), h(4, 5)];

describe('coach tactics', () => {
  it('says when a turn left the opponent a line one turn from six', () => {
    // O has 0,5 1,5 3,5 4,5: one window short two stones. X ignores it and extends their own line.
    const facts = turnTactics(start, [h(3, 0), h(9, 9)], 9, names);
    expect(facts).toContain('Left Six a line one turn from six: Six can make six next turn.');
    expect(facts.some((f) => f.startsWith('Made'))).toBe(false); // X's new line doesn't matter: Six wins first
  });

  it('says when a turn blocked the line', () => {
    const facts = turnTactics(start, [h(2, 5), h(9, 9)], 9, names);
    expect(facts).toContain("Blocked Six's line one turn from six.");
  });

  // X to move with four in a row (0..3 on r = 0) and two stones: 4,0 and 5,0 make six. O's stones are scattered.
  const fourInARow = [h(0, 0), h(0, 4), h(4, -4), h(1, 0), h(2, 0), h(-3, 3), h(-3, -1), h(3, 0), h(0, -5), h(3, 3), h(-2, -2)];

  it('says when six was there to be made', () => {
    expect(turnTactics(fourInARow, [h(5, 5), h(5, 4)], 9, names)).toContain('Levi could have made six in a row this turn.');
  });

  it('says nothing about a turn that made six', () => {
    expect(turnTactics(fourInARow, [h(4, 0), h(5, 0)], 9, names)).toEqual([]);
  });
});
