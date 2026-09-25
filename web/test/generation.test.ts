import { describe, expect, it } from 'vitest';
import { resolveGeneration } from '../src/shared/generations.ts';

describe('typing a generation', () => {
  const gens = [0, 1, 2, 5, 455];

  it('takes a generation that exists', () => {
    expect(resolveGeneration('2', gens)).toBe(2);
    expect(resolveGeneration(' 455 ', gens)).toBe(455);
  });

  it('never goes outside the generations there are', () => {
    expect(resolveGeneration('1000', gens)).toBe(455);
    expect(resolveGeneration('-5', gens)).toBe(0);
  });

  it('snaps to the nearest generation that has saved weights', () => {
    expect(resolveGeneration('4', gens)).toBe(5);
    expect(resolveGeneration('3', gens)).toBe(2);
  });

  it('ignores anything that is not a number', () => {
    expect(resolveGeneration('', gens)).toBeNull();
    expect(resolveGeneration('abc', gens)).toBeNull();
    expect(resolveGeneration('3.5', gens)).toBeNull();
    expect(resolveGeneration('12', [])).toBeNull();
  });
});
