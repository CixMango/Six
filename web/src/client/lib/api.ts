import type { Hex } from '../../shared/hex.ts';
import type { Setup } from '../../shared/rules.ts';
import type { ReplayRecord, ReplaySummary } from '../../shared/replay.ts';
import { thinkingLimits, type ThinkProgress } from '../../shared/thinking.ts';
import { currentThinkBy } from './thinkBy.ts';
import type { Evaluation } from '../../shared/winChance.ts';

export interface ServerInfo {
  name: string;
  version?: string;
  /** The downloaded app on this PC, which runs with no window, so the page can stop it. */
  canQuit?: boolean;
  port: number;
  hamachiUrl: string | null;
  lanUrls: string[];
}

export interface BotInfo {
  id: string;
  name: string;
  levels: number;
  levelLabels: string[];
  description: string;
}

export interface Bout {
  wins: number;
  losses: number;
  elo: number;
  /** null when the games don't bound the difference on that side (every pair ended the same way). */
  eloLow: number | null;
  eloHigh: number | null;
  /** Per-turn time in ms, on matches that recorded it. */
  moveMs?: number;
}

export interface GenerationRecord {
  generation: number;
  finished: string;
  selfplay?: { games?: number; rows?: number; xWins?: number; oWins?: number; unfinished?: number; medianStones?: number };
  training?: { steps?: number; validation?: Record<string, number> };
  evaluation?: { vsPrevious?: Bout; vsHexBot?: Bout; vsAnchor?: Bout & { against: number } };
  grown?: { network: string; promoted?: boolean; inPlace?: boolean };
}

export interface RivalResult {
  when: string;
  ours: string;
  generation: number | null;
  rival: string;
  pairs: number;
  wins: number;
  losses: number;
  draws: number;
  forfeits: number;
  elo: number;
  eloLow: number | null;
  eloHigh: number | null;
  note?: string;
}

export interface TrainingView {
  started: boolean;
  generation: number;
  paused: boolean;
  lastActivity: number | null;
  history: GenerationRecord[];
  rivals: RivalResult[];
  pauseApps: string[];
  log: string[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

function newThinkId(): string {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Polls a server search's progress until `done` settles. */
function followProgress(id: string, onProgress: (p: ThinkProgress) => void, done: Promise<unknown>): void {
  let running = true;
  done.then(() => (running = false), () => (running = false));
  void (async () => {
    while (running) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!running) break;
      try {
        const p = await request<ThinkProgress & { done: boolean }>(`/api/thinking/${id}`);
        if (running && !p.done) onProgress({ nodes: p.nodes, ms: p.ms, budget: p.budget });
      } catch {
        // Not started yet, or already gone.
      }
    }
  })();
}

export const api = {
  info: () => request<ServerInfo>('/api/info'),
  /** A newer release of the downloaded app, if there is one. */
  update: () => request<{ current: string; latest: string | null }>('/api/update'),
  /** Six stops, installs the newest release and starts again. */
  startUpdate: () => request<object>('/api/update', { method: 'POST' }),
  quit: () => request<object>('/api/quit', { method: 'POST' }),
  desktopShortcut: () => request<object>('/api/shortcut', { method: 'POST' }),
  bots: () => request<BotInfo[]>('/api/bots'),
  /** Six's chance and best turn after a `movetime` ms search, plus any proven forced win. */
  reviewPosition: (moves: readonly Hex[], radius: number, movetime: number, signal?: AbortSignal, onProgress?: (p: ThinkProgress) => void) => {
    const thinkId = onProgress ? newThinkId() : undefined;
    const run = request<{ winX: number; proven: 'X' | 'O' | null; best: Array<[number, number]> }>('/api/review/position', {
      method: 'POST',
      body: JSON.stringify({ moves: moves.map((m) => [m.q, m.r]), radius, movetime, ...(thinkId ? { thinkId } : {}) }),
      signal,
    });
    if (thinkId && onProgress) followProgress(thinkId, onProgress, run);
    return run;
  },
  /** A turn that avoids the forced win the played turn handed over (solver-checked), or [] if none was found. */
  reviewDefense: (moves: readonly Hex[], played: readonly Hex[], radius: number, signal?: AbortSignal) =>
    request<{ best: Array<[number, number]> }>('/api/review/defense', {
      method: 'POST',
      body: JSON.stringify({ moves: moves.map((m) => [m.q, m.r]), played: played.map((m) => [m.q, m.r]), radius }),
      signal,
    }).then((r) => r.best.map(([q, r2]) => ({ q, r: r2 }))),
  /** `downloadable`: published generations not on this PC yet; one downloads the first time it's played. */
  generations: () => request<{ generations: number[]; downloadable?: number[]; newest: number | null }>('/api/generations'),
  /** `generation` (Six only) picks an older net; its first turn may take a minute to load. Six thinks by positions or
   * time as the player chose in Settings; `onProgress` hears how far it is while it thinks. */
  botTurn: (
    moves: readonly Hex[],
    radius: number,
    bot: string,
    level: number,
    signal?: AbortSignal,
    generation?: number | null,
    onProgress?: (p: ThinkProgress) => void,
  ): Promise<Hex[]> => {
    const think = currentThinkBy();
    if (bot === 'hexweb') {
      const { movetimeMs, nodes } = thinkingLimits('hexweb', level, think);
      return import('../bot/client.ts').then((m) => m.browserTurn(moves, radius, movetimeMs, signal, nodes, onProgress));
    }
    const thinkId = onProgress ? newThinkId() : undefined;
    const run = request<{ cells: Hex[] }>('/api/bot/turn', {
      method: 'POST',
      body: JSON.stringify({
        moves: moves.map((m) => [m.q, m.r]),
        radius,
        bot,
        level,
        think,
        ...(thinkId ? { thinkId } : {}),
        ...(generation != null ? { generation } : {}),
      }),
      signal,
    }).then((r) => r.cells);
    if (thinkId && onProgress) followProgress(thinkId, onProgress, run);
    return run;
  },
  evaluate: (moves: readonly Hex[], radius: number, signal?: AbortSignal, keep = false, setup: Setup | null = null) =>
    request<Evaluation & { engine: 'six' | 'classic' }>('/api/eval', {
      method: 'POST',
      body: JSON.stringify({ moves: moves.map((m) => [m.q, m.r]), radius, keep, ...(setup ? { setup } : {}) }),
      signal,
    }),
  /** The newest Six's turn for the side to move, after a few seconds' thought (or level 3's positions). */
  suggest: (moves: readonly Hex[], radius: number, setup: Setup | null, signal?: AbortSignal, onProgress?: (p: ThinkProgress) => void) => {
    const thinkId = onProgress ? newThinkId() : undefined;
    const run = request<{ cells: Hex[] }>('/api/suggest', {
      method: 'POST',
      body: JSON.stringify({
        moves: moves.map((m) => [m.q, m.r]),
        radius,
        think: currentThinkBy(),
        ...(thinkId ? { thinkId } : {}),
        ...(setup ? { setup } : {}),
      }),
      signal,
    }).then((r) => r.cells);
    if (thinkId && onProgress) followProgress(thinkId, onProgress, run);
    return run;
  },
  /** Checks the coming turn while its player thinks, so the verdict is ready at once. */
  precheck: (moves: readonly Hex[], radius: number) =>
    request<{ safe: boolean }>('/api/precheck', {
      method: 'POST',
      body: JSON.stringify({ moves: moves.map((m) => [m.q, m.r]), radius }),
    }).then((r) => r.safe),
  /** Fast check for a proven forced win (threat search only). */
  verdict: (moves: readonly Hex[], radius: number, signal?: AbortSignal) =>
    request<{ proven: 'X' | 'O' | null }>('/api/verdict', {
      method: 'POST',
      body: JSON.stringify({ moves: moves.map((m) => [m.q, m.r]), radius }),
      signal,
    }).then((r) => r.proven),
  replays: () => request<ReplaySummary[]>('/api/replays'),
  /** Where an imported game opens: the review, or the analysis board for a set-up position. */
  importGame: (text: string) =>
    request<{ id: string; position: boolean }>('/api/import/game', { method: 'POST', body: JSON.stringify({ text }) }).then(
      (r) => (r.position ? `/analysis/${r.id}` : `/review/${r.id}`),
    ),
  importHexo: (link: string) =>
    request<{ id: string }>('/api/import/hexo', { method: 'POST', body: JSON.stringify({ link }) }).then((r) => r.id),
  replay: (id: string) => request<ReplayRecord>(`/api/replays/${encodeURIComponent(id)}`),
  saveReplay: (record: ReplayRecord) =>
    request<{ id: string }>('/api/replays', { method: 'POST', body: JSON.stringify(record) }),
  training: () => request<TrainingView>('/api/training'),
  setTrainingPaused: (paused: boolean) =>
    request<TrainingView>('/api/training/pause', { method: 'POST', body: JSON.stringify({ paused }) }),
  setPauseApps: (apps: string[]) =>
    request<TrainingView>('/api/training/pause-apps', { method: 'POST', body: JSON.stringify({ apps }) }),
};
