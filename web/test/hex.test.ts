import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  DIRECTIONS,
  hexCorners,
  hexDistance,
  hexesWithin,
  hexKey,
  hexToPixel,
  parseKey,
  pixelToHex,
} from '../src/shared/hex.ts';

const coord = fc.integer({ min: -60, max: 60 });
const hex = fc.record({ q: coord, r: coord });

describe('hex math', () => {
  it('has six neighbor offsets, each one step away', () => {
    expect(DIRECTIONS).toHaveLength(6);
    for (const d of DIRECTIONS) expect(hexDistance({ q: 0, r: 0 }, d)).toBe(1);
  });

  it('distance is the max of the three cube differences', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -1 })).toBe(3);
    expect(hexDistance({ q: -2, r: 5 }, { q: 1, r: 1 })).toBe(4);
  });

  it('distance is symmetric, non-negative and zero only for equal cells', () => {
    fc.assert(
      fc.property(hex, hex, (a, b) => {
        const d = hexDistance(a, b);
        expect(d).toBe(hexDistance(b, a));
        expect(d >= 0).toBe(true);
        expect(d === 0).toBe(a.q === b.q && a.r === b.r);
      }),
    );
  });

  it('distance obeys the triangle inequality', () => {
    fc.assert(
      fc.property(hex, hex, hex, (a, b, c) => {
        expect(hexDistance(a, c)).toBeLessThanOrEqual(hexDistance(a, b) + hexDistance(b, c));
      }),
    );
  });

  it('a radius-n area holds 3n(n+1)+1 cells, all within n', () => {
    for (const n of [0, 1, 2, 8, 9]) {
      const cells = hexesWithin({ q: 4, r: -7 }, n);
      expect(cells).toHaveLength(3 * n * (n + 1) + 1);
      expect(new Set(cells.map((c) => hexKey(c.q, c.r))).size).toBe(cells.length);
      for (const c of cells) expect(hexDistance(c, { q: 4, r: -7 })).toBeLessThanOrEqual(n);
    }
  });

  it('keys round-trip', () => {
    fc.assert(
      fc.property(hex, (h) => {
        expect(parseKey(hexKey(h.q, h.r))).toEqual(h);
      }),
    );
  });

  it('matches the spec pixel formula for pointy-top hexes', () => {
    const p = hexToPixel({ q: 2, r: 1 }, 10);
    expect(p.x).toBeCloseTo(10 * Math.sqrt(3) * 2.5);
    expect(p.y).toBeCloseTo(15);
  });

  it('pixel of a cell center maps back to that cell', () => {
    fc.assert(
      fc.property(hex, fc.double({ min: 4, max: 80, noNaN: true }), (h, size) => {
        const p = hexToPixel(h, size);
        expect(pixelToHex(p.x, p.y, size)).toEqual(h);
      }),
    );
  });

  it('any point strictly inside a hex maps to that hex', () => {
    fc.assert(
      fc.property(
        hex,
        fc.double({ min: 0, max: 0.85, noNaN: true }),
        fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }),
        (h, frac, angle) => {
          const size = 20;
          const c = hexToPixel(h, size);
          // The inscribed circle has radius size*sqrt(3)/2; stay safely inside it.
          const inner = (size * Math.sqrt(3)) / 2;
          const x = c.x + Math.cos(angle) * inner * frac;
          const y = c.y + Math.sin(angle) * inner * frac;
          expect(pixelToHex(x, y, size)).toEqual(h);
        },
      ),
    );
  });

  it('corners are pointy-top: six corners at distance S, the first at -30 degrees', () => {
    const corners = hexCorners(0, 0, 10);
    expect(corners).toHaveLength(6);
    for (const k of corners) expect(Math.hypot(k.x, k.y)).toBeCloseTo(10);
    expect(corners[0]!.x).toBeCloseTo(10 * Math.cos(-Math.PI / 6));
    expect(corners[0]!.y).toBeCloseTo(-5);
    // A pointy-top hex has a corner straight up and straight down.
    expect(corners.some((k) => Math.abs(k.x) < 1e-9 && k.y < 0)).toBe(true);
  });
});
