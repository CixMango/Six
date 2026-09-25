import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { hexToPixel, type Hex } from '../../shared/hex.ts';
import type { Game, Player } from '../../shared/rules.ts';
import { fitCells, screenToCell, worldToScreen, zoomAt, type Camera } from './camera.ts';
import { BoardRenderer, type BoardMark } from './renderer.ts';
import { usePrefersReducedMotion } from '../lib/motion.ts';
import { onThemeChange } from '../lib/theme.ts';

export interface BoardHandle {
  recenter(): void;
  zoomBy(factor: number): void;
  showLastStone(): void;
}

interface Props {
  game: Game;
  version: number;
  interactive: boolean;
  onPlace?: (cell: Hex) => void;
  marks?: readonly BoardMark[];
  /** A proven forced win is on the board. */
  alarm?: boolean;
  /** Draw each side in the other's colour (a HeXO game where blue moved first). */
  swapColors?: boolean;
  label: string;
  /** Extra space kept clear of overlays, in CSS px, when framing stones. */
  inset?: { top: number; right: number; bottom: number; left: number };
  ref?: Ref<BoardHandle>;
}

const DRAG_THRESHOLD = 6;
const CAMERA_TWEEN_MS = 320;
/** Paint fallback for when rAF is paused (hidden or embedded views). */
const FALLBACK_FRAME_MS = 120;

export function BoardCanvas({ game, version, interactive, onPlace, marks = [], label, inset, alarm = false, swapColors = false, ref }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BoardRenderer | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const camera = useRef<Camera>({ x: 0, y: 0, zoom: 26 });
  const tween = useRef<{ from: Camera; to: Camera; start: number } | null>(null);
  const framed = useRef(false);
  const hover = useRef<Hex | null>(null);
  const focus = useRef<Hex | null>(null);
  const frame = useRef<number | null>(null);
  const lastDraw = useRef(0);
  const reducedMotion = usePrefersReducedMotion();

  // Latest props for the draw loop without restarting it.
  const live = useRef({ game, version, interactive, marks, reducedMotion, onPlace, alarm, swapColors });
  live.current = { game, version, interactive, marks, reducedMotion, onPlace, alarm, swapColors };

  const request = useCallback((continuous = false) => {
    if (frame.current !== null) return;
    let fallback: ReturnType<typeof setTimeout> | null = null;
    const run = (now: number) => {
      if (fallback !== null) clearTimeout(fallback);
      frame.current = null;
      paint(now);
    };
    frame.current = requestAnimationFrame(run);
    // Only one-off paints need the timer; a continuous run already gets frames.
    if (!continuous) {
      fallback = setTimeout(() => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        run(performance.now());
      }, FALLBACK_FRAME_MS);
    }

    function paint(now: number) {
      const renderer = rendererRef.current;
      if (!renderer || size.current.w === 0) return;
      const t = tween.current;
      let moving = false;
      if (t) {
        const k = Math.min(1, (now - t.start) / CAMERA_TWEEN_MS);
        const e = 1 - (1 - k) ** 4;
        camera.current = {
          x: t.from.x + (t.to.x - t.from.x) * e,
          y: t.from.y + (t.to.y - t.from.y) * e,
          zoom: t.from.zoom + (t.to.zoom - t.from.zoom) * e,
        };
        if (k >= 1) tween.current = null;
        else moving = true;
      }
      const { game: g, version: v, interactive: canPlay, marks: m, reducedMotion: rm, alarm: red } = live.current;
      renderer.setSwapColors(live.current.swapColors);
      renderer.sync(g, v, now);
      const animating = renderer.draw(
        camera.current,
        { hover: canPlay ? hover.current : null, hoverPlayer: canPlay ? g.current : null, focus: focus.current, marks: m, reducedMotion: rm, alarm: red },
        now,
      );
      lastDraw.current = now;
      if ((moving || animating) && !document.hidden) request(true);
    }
  }, []);

  const moveCamera = useCallback(
    (to: Camera, animate: boolean) => {
      if (animate && !live.current.reducedMotion) tween.current = { from: camera.current, to, start: performance.now() };
      else {
        tween.current = null;
        camera.current = to;
      }
      request();
    },
    [request],
  );

  const insetRef = useRef(inset);
  insetRef.current = inset;

  const framing = useCallback(() => {
    const pad = insetRef.current ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const { w, h } = size.current;
    // Suggestions and follow-ups (review, retry hints) are framed with the stones so they're never off-screen.
    const shown = live.current.marks.filter((m) => m.kind !== 'threat').map((m) => m.cell);
    const cells = [...(live.current.game.moves.length > 0 ? live.current.game.moves : [{ q: 0, r: 0 }]), ...shown];
    const usableW = Math.max(200, w - pad.left - pad.right);
    const usableH = Math.max(200, h - pad.top - pad.bottom);
    // Phones keep stones large and rely on panning.
    const phone = w < 720;
    const hasStones = live.current.game.moves.length > 0;
    const margin = hasStones ? (phone ? 3 : 4) : phone ? 4.5 : live.current.game.radius + 1;
    const fit = fitCells(cells, usableW, usableH, margin);
    // Center the fit inside the area the overlays leave clear.
    return { ...fit, x: fit.x - (pad.left - pad.right) / 2 / fit.zoom, y: fit.y - (pad.top - pad.bottom) / 2 / fit.zoom };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      recenter: () => moveCamera(framing(), true),
      zoomBy: (factor) => {
        const { w, h } = size.current;
        moveCamera(zoomAt(camera.current, w, h, w / 2, h / 2, factor), true);
      },
      showLastStone: () => {
        const last = live.current.game.lastMove;
        if (!last) return;
        const pad = insetRef.current ?? { top: 0, right: 0, bottom: 0, left: 0 };
        const zoom = Math.max(camera.current.zoom, 26);
        const p = hexToPixel(last, 1);
        moveCamera({ x: p.x - (pad.left - pad.right) / 2 / zoom, y: p.y - (pad.top - pad.bottom) / 2 / zoom, zoom }, true);
        rendererRef.current?.flash(performance.now());
      },
    }),
    [framing, moveCamera],
  );

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    rendererRef.current = new BoardRenderer(canvas);
    const observer = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      size.current = { w: rect.width, h: rect.height };
      rendererRef.current!.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
      if (!framed.current && rect.width > 0) {
        camera.current = framing();
        framed.current = true;
      }
      request();
    });
    observer.observe(wrap);
    const stopTheme = onThemeChange(() => {
      rendererRef.current?.restyle();
      request();
    });
    const onVisible = () => request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      observer.disconnect();
      stopTheme();
      document.removeEventListener('visibilitychange', onVisible);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [framing, request]);

  const prevCount = useRef(game.moves.length);
  useEffect(() => {
    const count = game.moves.length;
    const { w, h } = size.current;
    if (w === 0) {
      // Not measured yet: the first resize frames the board.
      framed.current = false;
    } else if (count < prevCount.current || (count > 0 && prevCount.current === 0 && count > 1)) {
      moveCamera(framing(), true);
    } else if (count > prevCount.current && game.lastMove && w > 0) {
      const p = worldToScreen(camera.current, w, h, hexToPixel(game.lastMove, 1));
      const pad = insetRef.current ?? { top: 0, right: 0, bottom: 0, left: 0 };
      const edge = Math.min(w, h) * 0.06;
      const outside =
        p.x < pad.left + edge || p.y < pad.top + edge || p.x > w - pad.right - edge || p.y > h - pad.bottom - edge;
      if (outside) moveCamera(framing(), true);
    }
    prevCount.current = count;
    request();
  }, [game, version, framing, moveCamera, request]);

  useEffect(() => {
    const { w, h } = size.current;
    if (w > 0) {
      const pad = insetRef.current ?? { top: 0, right: 0, bottom: 0, left: 0 };
      const edge = Math.min(w, h) * 0.04;
      const offScreen = marks.some((m) => {
        if (m.kind === 'threat') return false;
        const p = worldToScreen(camera.current, w, h, hexToPixel(m.cell, 1));
        return p.x < pad.left + edge || p.y < pad.top + edge || p.x > w - pad.right - edge || p.y > h - pad.bottom - edge;
      });
      if (offScreen) moveCamera(framing(), true);
    }
    request();
  }, [marks, interactive, reducedMotion, request, framing, moveCamera]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startX: number; startY: number; dragged: boolean; pinch: number | null }>({ startX: 0, startY: 0, dragged: false, pinch: null });

  const local = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    canvasRef.current!.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    focus.current = null;
    if (pointers.current.size === 1) gesture.current = { startX: p.x, startY: p.y, dragged: false, pinch: null };
    else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      gesture.current.dragged = true;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = local(e);
    const { w, h } = size.current;
    const prev = pointers.current.get(e.pointerId);
    if (!prev) {
      if (e.pointerType === 'mouse') {
        const cell = screenToCell(camera.current, w, h, p.x, p.y);
        if (cell.q !== hover.current?.q || cell.r !== hover.current?.r) {
          hover.current = cell;
          request();
        }
      }
      return;
    }
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (pointers.current.size === 2 && g.pinch) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const mid = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 };
      camera.current = zoomAt(camera.current, w, h, mid.x, mid.y, dist / g.pinch);
      g.pinch = dist;
      tween.current = null;
      request();
      return;
    }
    if (!g.dragged && Math.hypot(p.x - g.startX, p.y - g.startY) > DRAG_THRESHOLD) g.dragged = true;
    if (g.dragged) {
      camera.current = { ...camera.current, x: camera.current.x - (p.x - prev.x) / camera.current.zoom, y: camera.current.y - (p.y - prev.y) / camera.current.zoom };
      tween.current = null;
      hover.current = null;
      request();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const had = pointers.current.delete(e.pointerId);
    if (!had) return;
    const g = gesture.current;
    if (pointers.current.size === 0 && !g.dragged) {
      const p = local(e);
      const { w, h } = size.current;
      const cell = screenToCell(camera.current, w, h, p.x, p.y);
      const { game: current, interactive: canPlay, onPlace: place } = live.current;
      if (canPlay && place && current.isPlayable(cell.q, cell.r)) place(cell);
    }
    if (pointers.current.size < 2) g.pinch = null;
  };

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvasRef.current!.getBoundingClientRect();
      const { w, h } = size.current;
      camera.current = zoomAt(camera.current, w, h, e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0016));
      tween.current = null;
      request();
    },
    [request],
  );

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const steps: Record<string, Hex> = {
      ArrowLeft: { q: -1, r: 0 },
      ArrowRight: { q: 1, r: 0 },
      ArrowUp: { q: 0, r: -1 },
      ArrowDown: { q: 0, r: 1 },
    };
    const start = focus.current ?? live.current.game.lastMove ?? { q: 0, r: 0 };
    if (steps[e.key]) {
      e.preventDefault();
      const d = steps[e.key]!;
      // Up and down alternate diagonals so the cursor travels straight on screen.
      const even = ((start.r % 2) + 2) % 2 === 0;
      const shift = e.key === 'ArrowUp' ? (even ? 1 : 0) : e.key === 'ArrowDown' ? (even ? 0 : -1) : 0;
      focus.current = { q: start.q + d.q + shift, r: start.r + d.r };
      request();
    } else if ((e.key === 'Enter' || e.key === ' ') && focus.current) {
      e.preventDefault();
      const { game: current, interactive: canPlay, onPlace: place } = live.current;
      if (canPlay && place && current.isPlayable(focus.current.q, focus.current.r)) place(focus.current);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const { w, h } = size.current;
      moveCamera(zoomAt(camera.current, w, h, w / 2, h / 2, 1.25), true);
    } else if (e.key === '-') {
      e.preventDefault();
      const { w, h } = size.current;
      moveCamera(zoomAt(camera.current, w, h, w / 2, h / 2, 0.8), true);
    } else if (e.key.toLowerCase() === 'c') {
      moveCamera(framing(), true);
    }
  };

  return (
    <div ref={wrapRef} className="board-feed">
      <canvas
        ref={canvasRef}
        className="board-canvas"
        tabIndex={0}
        role="application"
        aria-label={`${label}. Drag to pan, scroll to zoom. Arrow keys move the cursor, Enter places a stone, C recenters.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse' && hover.current) {
            hover.current = null;
            request();
          }
        }}
        onBlur={() => {
          focus.current = null;
          request();
        }}
        onKeyDown={onKeyDown}
        style={{ cursor: interactive ? 'pointer' : 'grab' }}
      />
      <div className="board-vignette" aria-hidden="true" />
    </div>
  );
}

export type { BoardMark, Player };
