import { writeFileSync } from 'node:fs';
import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Written by trainer/loop.py to state.json.
export interface GenerationRecord {
  generation: number;
  finished: string;
  selfplay?: { games?: number; rows?: number; xWins?: number; oWins?: number; unfinished?: number; medianStones?: number };
  training?: { steps?: number; validation?: Record<string, number> };
  evaluation?: Record<string, {
    wins: number; losses: number; elo: number;
    // null when unbounded on that side (every pair ended the same way).
    eloLow: number | null; eloHigh: number | null;
    // against: the older generation played, if any.
    moveMs?: number; against?: number;
  }>;
  // Set on the generation where a larger network took over.
  grown?: { network: string; promoted?: boolean; inPlace?: boolean };
}

// Written by arena/record_rival.py.
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
  // null when unbounded on that side (every pair ended the same way).
  eloLow: number | null;
  eloHigh: number | null;
  note?: string;
}

export interface TrainingView {
  started: boolean;
  generation: number;
  paused: boolean;
  // ms since epoch
  lastActivity: number | null;
  history: GenerationRecord[];
  rivals: RivalResult[];
  pauseApps: string[];
  log: string[];
}

const LOG_LINES = 40;
// trainer/pause.py pauses the loop while this file was touched in the last few minutes.
export const BOT_GAME_FILE = 'six-bot-game';
const APP_NAME = /^[a-z0-9 ._()-]+\.exe$/;

async function readJsonFile(file: string): Promise<unknown> {
  try {
    return JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

// Talks to trainer/loop.py through the files in runs/rl.
export class TrainingStatus {
  constructor(private readonly dir: string) {}

  async view(): Promise<TrainingView> {
    const state = (await readJsonFile(path.join(this.dir, 'state.json'))) as { generation?: number; history?: GenerationRecord[] } | null;
    const config = (await readJsonFile(path.join(this.dir, 'config.json'))) as { pauseApps?: unknown } | null;
    const rivals = await readJsonFile(path.join(this.dir, 'rivals.json'));
    let log: string[] = [];
    let lastActivity: number | null = null;
    try {
      const logFile = path.join(this.dir, 'log.txt');
      log = (await readFile(logFile, 'utf8')).split(/\r?\n/).filter(Boolean).slice(-LOG_LINES);
      lastActivity = (await stat(logFile)).mtimeMs;
    } catch {
      // The loop hasn't written a log yet.
    }
    let paused = false;
    try {
      paused = (await stat(path.join(this.dir, 'PAUSE'))).isFile();
    } catch {
      paused = false;
    }
    return {
      started: state !== null || log.length > 0,
      generation: state?.generation ?? 0,
      paused,
      lastActivity,
      history: Array.isArray(state?.history) ? state.history : [],
      rivals: Array.isArray(rivals) ? (rivals as RivalResult[]) : [],
      pauseApps: Array.isArray(config?.pauseApps) ? config.pauseApps.filter((a): a is string => typeof a === 'string') : [],
      log,
    };
  }

  async setPaused(paused: boolean): Promise<void> {
    const file = path.join(this.dir, 'PAUSE');
    if (paused) await writeFile(file, `paused from the dashboard at ${new Date().toISOString()}\n`);
    else await rm(file, { force: true });
  }

  async setPauseApps(apps: string[]): Promise<string[]> {
    const cleaned = [...new Set(apps.map((a) => a.trim().toLowerCase()).filter((a) => APP_NAME.test(a)))];
    const configFile = path.join(this.dir, 'config.json');
    const config = ((await readJsonFile(configFile)) as Record<string, unknown> | null) ?? {};
    config.pauseApps = cleaned;
    await writeFile(configFile, JSON.stringify(config, null, 2));
    return cleaned;
  }
}

// Tells the training loop to yield the GPU and CPU. Never throws.
export function markBotGame(dir: string): void {
  try {
    writeFileSync(path.join(dir, BOT_GAME_FILE), `${new Date().toISOString()}\n`);
  } catch {
    // No training loop here.
  }
}

// Hamachi friends can open the app but must not control training.
export function isLocalAddress(address: string | undefined): boolean {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}
