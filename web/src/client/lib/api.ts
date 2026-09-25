import type { Hex } from '../../shared/hex.ts';
import type { ReplayRecord, ReplaySummary } from '../../shared/replay.ts';
import { HEXBOT_MOVETIME_MS } from '../../shared/botMeta.ts';
import type { Evaluation } from '../../shared/winChance.ts';

export interface ServerInfo {
  name: string;
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

export const api = {
  info: () => request<ServerInfo>('/api/info'),
  bots: () => request<BotInfo[]>('/api/bots'),
  /** Six's chance and best turn after a `movetime` ms search, plus any proven forced win. */
  reviewPosition: (moves: readonly Hex[], radius: number, movetime: number, signal?: AbortSignal) =>
    request<{ winX: number; proven: 'X' | 'O' | null; best: Array<[number, number]> }>('/api/review/position', {
      method: 'POST',
      body: JSON.stringify({ moves: moves.map((m) => [m.q, m.r]), radius, movetime }),
      signal,
    }),
  generations: () => request<{ generations: number[]; newest: number | null }>('/api/generations'),
  /** `generation` (Six only) picks an older net; its first turn may take a minute to load. */
  botTurn: (moves: readonly Hex[], radius: number, bot: string, level: number, signal?: AbortSignal, generation?: number | null): Promise<Hex[]> =>
    bot === 'hexweb'
      ? import('../bot/client.ts').then((m) => m.browserTurn(moves, radius, HEXBOT_MOVETIME_MS[level - 1] ?? 1000, signal))
      : request<{ cells: Hex[] }>('/api/bot/turn', {
      method: 'POST',
          body: JSON.stringify({ moves: moves.map((m) => [m.q, m.r]), radius, bot, level, ...(generation != null ? { generation } : {}) }),
          signal,
        }).then((r) => r.cells),
  evaluate: (moves: readonly Hex[], radius: number, signal?: AbortSignal, keep = false) =>
    request<Evaluation & { engine: 'six' | 'classic' }>('/api/eval', {
      method: 'POST',
      body: JSON.stringify({ moves: moves.map((m) => [m.q, m.r]), radius, keep }),
      signal,
    }),
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
