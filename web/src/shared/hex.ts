// Axial coordinates, pointy-top grid.
export interface Hex {
  readonly q: number;
  readonly r: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export const DIRECTIONS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: -1, r: 1 },
];

// Each axis runs both ways.
export const LINE_AXES: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: 1, r: -1 },
];

const SQRT3 = Math.sqrt(3);

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseKey(key: string): Hex {
  const comma = key.indexOf(',');
  return { q: Number(key.slice(0, comma)), r: Number(key.slice(comma + 1)) };
}

export function hexDistance(a: Hex, b: Hex): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

export function hexesWithin(center: Hex, radius: number): Hex[] {
  const out: Hex[] = [];
  for (let dq = -radius; dq <= radius; dq++) {
    const lo = Math.max(-radius, -dq - radius);
    const hi = Math.min(radius, -dq + radius);
    for (let dr = lo; dr <= hi; dr++) out.push({ q: center.q + dq, r: center.r + dr });
  }
  return out;
}

export function hexToPixel(h: Hex, size: number): Point {
  return { x: size * SQRT3 * (h.q + h.r / 2), y: size * 1.5 * h.r };
}

export function cubeRound(fq: number, fr: number): Hex {
  const fs = -fq - fr;
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  // Normalize -0 so keys and equality checks stay clean.
  return { q: q + 0, r: r + 0 };
}

// x, y are relative to the center of cell (0,0).
export function pixelToHex(x: number, y: number, size: number): Hex {
  const fq = ((SQRT3 / 3) * x - y / 3) / size;
  const fr = ((2 / 3) * y) / size;
  return cubeRound(fq, fr);
}

// Corners every 60 degrees from -30, y down.
export function hexCorners(cx: number, cy: number, size: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    out.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
  }
  return out;
}
