// Runs the browser bot in a single worker; requests are answered in order.
import type { Hex } from '../../shared/hex.ts';
import { Game } from '../../shared/rules.ts';
import { evaluationFromScore, type Evaluation } from '../../shared/winChance.ts';
import type { ThinkProgress } from '../../shared/thinking.ts';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (answer: never) => void; reject: (e: Error) => void; progress?: (p: ThinkProgress) => void; budget?: number | null }>();
export let browserBackend = '';

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<{ id?: number; cells?: Hex[]; score?: number; error?: string; ready?: boolean; backend?: string; progress?: { nodes: number; ms: number } }>) => {
    const data = event.data;
    if (data.ready) {
      browserBackend = data.backend ?? '';
      return;
    }
    const request = data.id !== undefined ? pending.get(data.id) : undefined;
    if (!request) return;
    if (data.progress) {
      request.progress?.({ ...data.progress, budget: request.budget ?? null });
      return;
    }
    pending.delete(data.id!);
    if (data.error) request.reject(new Error(data.error));
    else request.resolve((data.score ?? data.cells ?? []) as never);
  };
  worker.onerror = (event) => {
    for (const request of pending.values()) request.reject(new Error(event.message || 'the browser bot stopped'));
    pending.clear();
    worker = null;
  };
  return worker;
}

/** Starts the engine and network download early so the first turn doesn't wait. */
export function warmUpBrowserBot(): void {
  getWorker().postMessage({ warm: true });
}

/** Six's turn in the browser: after `movetimeMs`, or `nodes` new positions when given (then there's no time limit). */
export function browserTurn(
  moves: readonly Hex[],
  radius: number,
  movetimeMs: number,
  signal?: AbortSignal,
  nodes: number | null = null,
  onProgress?: (p: ThinkProgress) => void,
): Promise<Hex[]> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: resolve as (answer: never) => void, reject, progress: onProgress, budget: nodes });
    signal?.addEventListener('abort', () => {
      pending.delete(id);
      reject(new DOMException('aborted', 'AbortError'));
    });
    getWorker().postMessage({ id, moves: moves.map((m) => ({ q: m.q, r: m.r })), radius, movetimeMs, nodes });
  });
}

/** Kept short since the judge shares the engine with the bot. */
const JUDGE_MS = 350;

/** Win chance and any proven forced win, queued behind the bot's own search. */
export function browserEvaluate(moves: readonly Hex[], radius: number, signal?: AbortSignal): Promise<Evaluation> {
  return new Promise<number>((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: resolve as (answer: never) => void, reject });
    signal?.addEventListener('abort', () => {
      pending.delete(id);
      reject(new DOMException('aborted', 'AbortError'));
    });
    getWorker().postMessage({ id, judge: true, moves: moves.map((m) => ({ q: m.q, r: m.r })), radius, movetimeMs: JUDGE_MS });
  }).then((score) => {
    const game = Game.fromMoves(moves, radius);
    return game.winner ? { winX: game.winner === 'X' ? 1 : 0, proven: game.winner } : evaluationFromScore(score, game.current, 'six');
  });
}
