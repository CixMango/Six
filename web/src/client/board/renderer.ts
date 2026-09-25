import { DIRECTIONS, hexKey, hexToPixel, type Hex } from '../../shared/hex.ts';
import { otherPlayer, type Game, type Player } from '../../shared/rules.ts';
import type { Camera } from './camera.ts';

export interface BoardPalette {
  ground: string;
  field: string;
  X: { core: string; glow: string };
  O: { core: string; glow: string };
  alarm: { ground: string; stripe: string; edge: string };
}

/** Canvas colors for the current theme (lib/theme.ts rewrites them). */
export const BOARD_COLORS: BoardPalette = {
  ground: '#07090e',
  field: '112, 142, 198',
  X: { core: '#f6d04a', glow: '255, 196, 44' },
  O: { core: '#87d1f7', glow: '104, 190, 255' },
  /** Kept dark so the stones stay the brightest thing on the board. */
  alarm: { ground: '#1b080b', stripe: 'rgba(122, 32, 40, 0.34)', edge: '232, 72, 72' },
};

/** Toggled from Settings. Bloom covers stone light and the win beam's halo. */
export const BOARD_EFFECTS = { bloom: true };

/** Sizes in board units (one cell is 1). */
const TILE_SIZE = 0.9;
const STONE_SIZE = 0.74;
const RING_SIZE = 0.86;

export interface BoardMark {
  cell: Hex;
  player: Player;
  /** threat: dashed hex one turn from six. ghost: faint suggested stone. played/better: review marks. */
  kind: 'threat' | 'ghost' | 'played' | 'better';
}

export interface FrameInput {
  hover: Hex | null;
  hoverPlayer: Player | null;
  focus: Hex | null;
  marks: readonly BoardMark[];
  reducedMotion: boolean;
  alarm: boolean;
}

interface Tile {
  x: number;
  y: number;
  key: string;
  light: 0 | 1 | 2 | 3;
  stone: Player | undefined;
}

/** Edge ring first, then falloff from the light over the stones. */
const TILE_ALPHA = [0.085, 0.12, 0.17, 0.225];
const LIGHT_FADE_MS = 700;
/** Throttle for repainting the field during its slow fade-in. */
const FIELD_FADE_STEP_MS = 24;
const FLASH_MS = 460;
const SWEEP_MS = 1100;
const CORNERS = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 30);
  return { x: Math.cos(a), y: Math.sin(a) };
});
/** The neighbor across the edge from CORNERS[i] to CORNERS[i + 1]. */
const EDGE_NEIGHBORS = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

export class BoardRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private version = -1;
  private moveCount = 0;
  private tiles: Tile[] = [];
  /** Outer edges of the playable area, in world units: x1, y1, x2, y2. */
  private boundary: Float32Array = new Float32Array(0);
  private stones: Array<{ x: number; y: number; player: Player }> = [];
  private playableKeys = new Set<string>();
  private litAt = new Map<string, number>();
  private freshAt = -Infinity;
  private placedAt = -Infinity;
  private winAt = -Infinity;
  private hadWinner = false;
  private lastMove: { x: number; y: number; player: Player } | null = null;
  private turnMate: { x: number; y: number } | null = null;
  private winLine: Array<{ x: number; y: number }> | null = null;
  private winner: Player | null = null;
  private readonly sprites = new Map<string, HTMLCanvasElement>();
  /** Paths in board coordinates, rebuilt only when the position changes. */
  private tilePaths: Path2D[] = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  private freshPath: Path2D | null = null;
  /** The lit area as touching hexes; in alarm mode it keeps the stripes outside the field. */
  private areaPath = new Path2D();
  private stripes: CanvasPattern | null = null;
  private boundaryPath = new Path2D();
  private stonePaths: Record<Player, Path2D> = { X: new Path2D(), O: new Path2D() };
  private stoneKeys = new Set<string>();
  private swapped = false;

  /** HeXO lets either colour open, so an imported game keeps each player's original colour. */
  setSwapColors(on: boolean): void {
    if (on === this.swapped) return;
    this.swapped = on;
    this.sprites.clear();
  }

  private color(player: Player) {
    return BOARD_COLORS[this.swapped ? otherPlayer(player) : player];
  }
  /** Cached layer for the field and stones, which only change with the game or camera. */
  private readonly still: HTMLCanvasElement = makeCanvas(1);
  private readonly stillCtx: CanvasRenderingContext2D;
  private stillKey = '';
  /** The previous frame's scene key; once it repeats the scene is cached. */
  private settledKey = '';

  restyle(): void {
    this.sprites.clear();
    this.stripes = null;
    this.stillKey = '';
    this.settledKey = '';
  }

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    const still = this.still.getContext('2d', { alpha: false });
    if (!still) throw new Error('2D canvas unavailable');
    this.stillCtx = still;
  }

  flash(now: number): void {
    this.placedAt = now;
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    if (dpr !== this.dpr) this.sprites.clear();
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.still.width = this.canvas.width;
    this.still.height = this.canvas.height;
    this.stillKey = '';
  }

  sync(game: Game, version: number, now: number): void {
    if (version === this.version) return;
    const moves = game.moves;
    const oneStoneAdded = this.version !== -1 && moves.length === this.moveCount + 1;
    this.version = version;
    this.moveCount = moves.length;

    const playable = game.playableCells();
    const nextKeys = new Set(playable.map((h) => hexKey(h.q, h.r)));
    if (oneStoneAdded) {
      this.litAt.clear();
      for (const key of nextKeys) if (!this.playableKeys.has(key)) this.litAt.set(key, now);
      this.freshAt = now;
      this.placedAt = now;
    } else {
      this.litAt.clear();
      this.freshAt = -Infinity;
      this.placedAt = -Infinity;
    }
    this.playableKeys = nextKeys;

    let cx = 0;
    let cy = 0;
    for (const m of moves) {
      const p = hexToPixel(m, 1);
      cx += p.x;
      cy += p.y;
    }
    if (moves.length > 0) {
      cx /= moves.length;
      cy /= moves.length;
    }

    const cells: Hex[] = [...playable, ...moves];
    let maxDist = 1;
    const measured = cells.map((h) => {
      const p = hexToPixel(h, 1);
      const d = Math.hypot(p.x - cx, p.y - cy);
      maxDist = Math.max(maxDist, d);
      return { h, p, d };
    });
    this.tiles = measured.map(({ h, p, d }) => {
      const key = hexKey(h.q, h.r);
      const stone = game.stoneAt(h.q, h.r);
      const edge =
        stone === undefined &&
        DIRECTIONS.some((dir) => {
          const nq = h.q + dir.q;
          const nr = h.r + dir.r;
          return !nextKeys.has(hexKey(nq, nr)) && game.stoneAt(nq, nr) === undefined;
        });
      const light = edge ? 0 : ((1 + Math.min(2, Math.floor((1 - d / maxDist) * 3))) as 1 | 2 | 3);
      return { x: p.x, y: p.y, key, light, stone };
    });

    // Where a lit cell meets an unlit one, record the shared hexagon edge.
    const edges: number[] = [];
    const occupiedOrLit = (q: number, r: number) => nextKeys.has(hexKey(q, r)) || game.stoneAt(q, r) !== undefined;
    for (const h of cells) {
      const p = hexToPixel(h, 1);
      EDGE_NEIGHBORS.forEach((dir, i) => {
        if (occupiedOrLit(h.q + dir.q, h.r + dir.r)) return;
        const a = CORNERS[i]!;
        const b = CORNERS[(i + 1) % 6]!;
        edges.push(p.x + a.x, p.y + a.y, p.x + b.x, p.y + b.y);
      });
    }
    this.boundary = new Float32Array(edges);

    this.stones = moves.map((m) => {
      const p = hexToPixel(m, 1);
      return { x: p.x, y: p.y, player: game.stoneAt(m.q, m.r)! };
    });
    this.stoneKeys = new Set(moves.map((m) => hexKey(m.q, m.r)));
    this.buildPaths();

    const last = game.lastMove;
    this.lastMove = last ? { ...hexToPixel(last, 1), player: game.stoneAt(last.q, last.r)! } : null;
    // The other stone of the most recent turn, when that turn had two.
    const lastIndex = moves.length - 1;
    const mate = lastIndex >= 2 && (lastIndex - 1) % 2 === 1 ? moves[lastIndex - 1] : undefined;
    this.turnMate = mate ? hexToPixel(mate, 1) : null;

    this.winner = game.winner;
    this.winLine = game.winLine ? game.winLine.map((h) => hexToPixel(h, 1)) : null;
    if (game.winner && !this.hadWinner) this.winAt = oneStoneAdded ? now : -Infinity;
    this.hadWinner = game.winner !== null;
  }

  /** Built once per position; panning only changes the canvas transform. */
  private buildPaths(): void {
    const buckets = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const fresh = new Path2D();
    const area = new Path2D();
    let freshCells = 0;
    for (const t of this.tiles) {
      hexPath(buckets[t.light]!, t.x, t.y, TILE_SIZE);
      hexPath(area, t.x, t.y, 1.02); // slightly over one cell so neighbours overlap without seams
      if (this.litAt.has(t.key)) {
        hexPath(fresh, t.x, t.y, TILE_SIZE);
        freshCells++;
      }
    }
    this.tilePaths = buckets;
    this.areaPath = area;
    this.freshPath = freshCells > 0 ? fresh : null;

    const boundary = new Path2D();
    const b = this.boundary;
    for (let i = 0; i < b.length; i += 4) {
      boundary.moveTo(b[i]!, b[i + 1]!);
      boundary.lineTo(b[i + 2]!, b[i + 3]!);
    }
    this.boundaryPath = boundary;

    const stones = { X: new Path2D(), O: new Path2D() };
    for (const s of this.stones) hexPath(stones[s.player], s.x, s.y, STONE_SIZE);
    this.stonePaths = stones;
  }

  // Unchanged frames blit the cached layer; moving frames paint directly and the cache refills once the key repeats.
  // Returns true while anything is still animating.
  draw(cam: Camera, input: FrameInput, now: number): boolean {
    const { ctx, width, height } = this;
    const fading = this.lightIsFading(now, input.reducedMotion);
    // The field fade-in is keyed in coarse time steps so it isn't repainted every frame.
    const key = fading
      ? `fading ${Math.round(now / FIELD_FADE_STEP_MS)}`
      : [this.version, cam.x, cam.y, cam.zoom, width, height, this.dpr, input.reducedMotion,
         input.hover ? `${input.hover.q},${input.hover.r},${input.hoverPlayer}` : '', input.alarm,
         input.marks.map((m) => `${m.cell.q},${m.cell.r},${m.player},${m.kind}`).join(' ')].join('|');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    if (key === this.stillKey) {
      ctx.drawImage(this.still, 0, 0, width, height);
    } else if (key === this.settledKey) {
      this.paintStill(this.stillCtx, cam, input, now);
      this.stillKey = key;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.drawImage(this.still, 0, 0, width, height);
    } else {
      this.paintStill(ctx, cam, input, now);
      this.stillKey = '';
    }
    this.settledKey = key;
    const animating = fading;
    return this.paintMoving(cam, input, now, animating) || animating;
  }

  private lightIsFading(now: number, reducedMotion: boolean): boolean {
    return !reducedMotion && this.freshPath !== null && now - this.freshAt < LIGHT_FADE_MS;
  }

  private paintStill(ctx: CanvasRenderingContext2D, cam: Camera, input: FrameInput, now: number): void {
    const { width, height } = this;
    const z = cam.zoom;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = input.alarm ? BOARD_COLORS.alarm.ground : BOARD_COLORS.ground;
    ctx.fillRect(0, 0, width, height);
    if (input.alarm) {
      this.stripes ??= stripePattern(ctx);
      if (this.stripes) {
        ctx.fillStyle = this.stripes;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // World coordinates from here: the camera is the canvas transform.
    ctx.setTransform(this.dpr * z, 0, 0, this.dpr * z, this.dpr * (width / 2 - cam.x * z), this.dpr * (height / 2 - cam.y * z));
    if (input.alarm) {
      // Only the ground outside the field turns red.
      ctx.fillStyle = BOARD_COLORS.ground;
      ctx.fill(this.areaPath);
    }
    const margin = 2.5;
    const minX = cam.x - width / 2 / z - margin;
    const maxX = cam.x + width / 2 / z + margin;
    const minY = cam.y - height / 2 / z - margin;
    const maxY = cam.y + height / 2 / z + margin;
    const visible = (x: number, y: number) => x > minX && x < maxX && y > minY && y < maxY;

    // The gaps between tiles form the grid.
    this.tilePaths.forEach((path, i) => {
      ctx.fillStyle = `rgba(${BOARD_COLORS.field}, ${TILE_ALPHA[i]})`;
      ctx.fill(path);
    });
    if (this.freshPath && !input.reducedMotion) {
      const k = (now - this.freshAt) / LIGHT_FADE_MS;
      if (k >= 0 && k < 1) {
        ctx.fillStyle = `rgba(${BOARD_COLORS.field}, ${0.22 * (1 - k) ** 2})`;
        ctx.fill(this.freshPath);
      }
    }

    ctx.lineWidth = (input.alarm ? 1.75 : 1.25) / z;
    ctx.strokeStyle = input.alarm ? `rgba(${BOARD_COLORS.alarm.edge}, 0.8)` : `rgba(${BOARD_COLORS.field}, 0.55)`;
    ctx.stroke(this.boundaryPath);

    if (input.hover && input.hoverPlayer && this.playableKeys.has(hexKey(input.hover.q, input.hover.r))) {
      const p = hexToPixel(input.hover, 1);
      const path = new Path2D();
      hexPath(path, p.x, p.y, TILE_SIZE);
      ctx.fillStyle = `rgba(${this.color(input.hoverPlayer).glow}, 0.12)`;
      ctx.fill(path);
      const ghost = new Path2D();
      hexPath(ghost, p.x, p.y, STONE_SIZE);
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = this.color(input.hoverPlayer).core;
      ctx.fill(ghost);
      ctx.globalAlpha = 1;
    }

    for (const mark of input.marks) {
      const p = hexToPixel(mark.cell, 1);
      if (!visible(p.x, p.y)) continue;
      const color = this.color(mark.player);
      if (mark.kind === 'threat') {
        const path = new Path2D();
        hexPath(path, p.x, p.y, 0.78);
        ctx.setLineDash([0.2, 0.14]);
        ctx.lineWidth = Math.max(1.5 / z, 0.07);
        ctx.strokeStyle = color.core;
        ctx.stroke(path);
        ctx.setLineDash([]);
      } else if (mark.kind === 'ghost') {
        const ghost = new Path2D();
        hexPath(ghost, p.x, p.y, STONE_SIZE);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = color.core;
        ctx.fill(ghost);
        ctx.globalAlpha = 1;
      }
    }

    if (BOARD_EFFECTS.bloom) {
      ctx.globalCompositeOperation = 'lighter';
      const sprite = { X: this.glowSprite('X', z), O: this.glowSprite('O', z) };
      const spriteSize = (sprite.X.width / this.dpr) / Math.max(1, Math.round(z));
      for (const s of this.stones) {
        if (visible(s.x, s.y)) {
          ctx.drawImage(sprite[s.player], s.x - spriteSize / 2, s.y - spriteSize / 2, spriteSize, spriteSize);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    const r = stoneRadius(z) / z;
    const beam = this.winLine && this.winner && this.winLine.length > 1
      ? { color: this.color(this.winner), a: this.winLine[0]!, b: this.winLine.at(-1)! }
      : null;
    if (beam) {
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'lighter';
      if (BOARD_EFFECTS.bloom) {
        ctx.lineWidth = r * 1.6;
        ctx.strokeStyle = `rgba(${beam.color.glow}, 0.2)`;
        line(ctx, beam.a.x, beam.a.y, beam.b.x, beam.b.y);
      }
      ctx.lineWidth = Math.max(2 / z, r * 0.28);
      ctx.strokeStyle = `rgba(${beam.color.glow}, 0.9)`;
      line(ctx, beam.a.x, beam.a.y, beam.b.x, beam.b.y);
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineCap = 'butt';
    }

    ctx.fillStyle = this.color('X').core;
    ctx.fill(this.stonePaths.X);
    ctx.fillStyle = this.color('O').core;
    ctx.fill(this.stonePaths.O);

    // Review marks go over the stones.
    for (const mark of input.marks) {
      if (mark.kind !== 'played' && mark.kind !== 'better') continue;
      const p = hexToPixel(mark.cell, 1);
      if (!visible(p.x, p.y)) continue;
      const color = this.color(mark.player);
      const path = new Path2D();
      if (mark.kind === 'played') {
        hexPath(path, p.x, p.y, RING_SIZE);
        ctx.lineWidth = Math.max(2 / z, 0.08);
        ctx.strokeStyle = `rgba(${color.glow}, 0.95)`;
        ctx.stroke(path);
      } else {
        hexPath(path, p.x, p.y, STONE_SIZE);
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = color.core;
        ctx.fill(path);
        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(2.5 / z, 0.1);
        ctx.strokeStyle = color.core;
        ctx.stroke(path);
        // The stone's own color would hide the outline, so mark it with a dark inner hex.
        if (this.stoneKeys.has(hexKey(mark.cell.q, mark.cell.r))) {
          const inner = new Path2D();
          hexPath(inner, p.x, p.y, STONE_SIZE * 0.6);
          ctx.strokeStyle = 'rgba(8, 10, 18, 0.9)';
          ctx.stroke(inner);
        }
      }
    }
  }

  private paintMoving(cam: Camera, input: FrameInput, now: number, already: boolean): boolean {
    const { ctx, width, height } = this;
    const z = cam.zoom;
    let animating = already;
    // Screen space from here.
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const sx = (x: number) => (x - cam.x) * z + width / 2;
    const sy = (y: number) => (y - cam.y) * z + height / 2;
    const r = stoneRadius(z);
    const beam = this.winLine && this.winner && this.winLine.length > 1
      ? { color: this.color(this.winner), a: this.winLine[0]!, b: this.winLine.at(-1)! }
      : null;

    if (this.lastMove && !this.winner) {
      const color = this.color(this.lastMove.player);
      const pulse = input.reducedMotion ? 0.85 : 0.62 + 0.3 * Math.sin((now / 1600) * Math.PI * 2);
      const ring = new Path2D();
      hexPath(ring, sx(this.lastMove.x), sy(this.lastMove.y), RING_SIZE * z);
      ctx.lineWidth = Math.max(1.5, z * 0.075);
      ctx.strokeStyle = `rgba(${color.glow}, ${pulse})`;
      ctx.stroke(ring);
      if (this.turnMate) {
        const mateRing = new Path2D();
        hexPath(mateRing, sx(this.turnMate.x), sy(this.turnMate.y), RING_SIZE * z);
        ctx.lineWidth = Math.max(1, z * 0.045);
        ctx.strokeStyle = `rgba(${color.glow}, 0.4)`;
        ctx.stroke(mateRing);
      }
      if (!input.reducedMotion) animating = true;

      const k = (now - this.placedAt) / FLASH_MS;
      if (k >= 0 && k < 1 && !input.reducedMotion && BOARD_EFFECTS.bloom) {
        const e = 1 - (1 - k) ** 3;
        const flash = new Path2D();
        hexPath(flash, sx(this.lastMove.x), sy(this.lastMove.y), z * (RING_SIZE + 1.1 * e));
        ctx.lineWidth = Math.max(1, z * 0.12 * (1 - k));
        ctx.strokeStyle = `rgba(${color.glow}, ${0.75 * (1 - k)})`;
        ctx.stroke(flash);
        animating = true;
      }
    }

    if (beam) {
      const k = (now - this.winAt) / SWEEP_MS;
      if (k >= 0 && k < 1 && !input.reducedMotion) {
        const t = 1 - (1 - k) ** 2;
        const hx = sx(beam.a.x) + (sx(beam.b.x) - sx(beam.a.x)) * t;
        const hy = sy(beam.a.y) + (sy(beam.b.y) - sy(beam.a.y)) * t;
        const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 3);
        glow.addColorStop(0, `rgba(255, 255, 255, ${0.9 * (1 - k)})`);
        glow.addColorStop(0.35, `rgba(${beam.color.glow}, ${0.6 * (1 - k)})`);
        glow.addColorStop(1, `rgba(${beam.color.glow}, 0)`);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = glow;
        ctx.fillRect(hx - r * 3, hy - r * 3, r * 6, r * 6);
        ctx.globalCompositeOperation = 'source-over';
        animating = true;
      }
    }

    if (input.focus) {
      const p = hexToPixel(input.focus, 1);
      const path = new Path2D();
      hexPath(path, sx(p.x), sy(p.y), 0.97 * z);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(245, 247, 252, 0.95)';
      ctx.stroke(path);
    }

    return animating;
  }

  private glowSprite(player: Player, zoom: number): HTMLCanvasElement {
    const bucket = Math.round(zoom);
    const id = `glow-${player}-${bucket}`;
    const cached = this.sprites.get(id);
    if (cached) return cached;
    const r = stoneRadius(bucket);
    const reach = r * 2.6;
    const size = Math.ceil(reach * 2 * this.dpr);
    const c = makeCanvas(size);
    const g = c.getContext('2d')!;
    g.scale(this.dpr, this.dpr);
    const mid = size / this.dpr / 2;
    const glow = g.createRadialGradient(mid, mid, r * 0.5, mid, mid, reach);
    const rgb = this.color(player).glow;
    glow.addColorStop(0, `rgba(${rgb}, 0.34)`);
    glow.addColorStop(0.4, `rgba(${rgb}, 0.12)`);
    glow.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = glow;
    g.fillRect(0, 0, size, size);
    this.sprites.set(id, c);
    return c;
  }
}

/** Reach of a stone's light and of the win beam, in CSS px at this zoom. */
export function stoneRadius(zoom: number): number {
  return zoom * 0.6;
}

function hexPath(path: Path2D, cx: number, cy: number, size: number): void {
  path.moveTo(cx + CORNERS[0]!.x * size, cy + CORNERS[0]!.y * size);
  for (let i = 1; i < 6; i++) path.lineTo(cx + CORNERS[i]!.x * size, cy + CORNERS[i]!.y * size);
  path.closePath();
}

function line(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number): void {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
}

function makeCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function stripePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const size = 22;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const g = tile.getContext('2d');
  if (!g) return null;
  g.strokeStyle = BOARD_COLORS.alarm.stripe;
  g.lineWidth = 5;
  // Also draw the halves that continue the stripe across the tile edges so it tiles seamlessly.
  for (const offset of [-size, 0, size]) {
    g.beginPath();
    g.moveTo(offset, size);
    g.lineTo(offset + size, 0);
    g.stroke();
  }
  return ctx.createPattern(tile, 'repeat');
}
