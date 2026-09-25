import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BOT_GAME_FILE, TrainingStatus, isLocalAddress, markBotGame } from '../src/server/training.ts';

describe('training status', () => {
  let dir: string;
  let training: TrainingStatus;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'six-training-'));
    training = new TrainingStatus(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('marks a bot game so the learning loop steps aside, and shrugs off a missing folder', async () => {
    const before = Date.now();
    markBotGame(dir);
    const stamp = Date.parse((await readFile(path.join(dir, BOT_GAME_FILE), 'utf8')).trim());
    expect(stamp).toBeGreaterThanOrEqual(before - 1000);
    expect(() => markBotGame(path.join(dir, 'missing', 'rl'))).not.toThrow();
  });

  it('reports not started when the loop has never run', async () => {
    const view = await training.view();
    expect(view.started).toBe(false);
    expect(view.paused).toBe(false);
    expect(view.history).toEqual([]);
  });

  it('reads the rival match results, newest last', async () => {
    const rivals = [
      { when: '2026-09-15T17:50:00', ours: 'HexNet gen-0009/net 1000ms', generation: 9, rival: 'Shrimp 256v',
        pairs: 6, wins: 12, losses: 0, draws: 0, forfeits: 0, elo: 2400, eloLow: 2400, eloHigh: 2400 },
    ];
    await writeFile(path.join(dir, 'rivals.json'), JSON.stringify(rivals));
    const view = await training.view();
    expect(view.rivals).toHaveLength(1);
    expect(view.rivals[0]!.rival).toBe('Shrimp 256v');
    expect((await new TrainingStatus(path.join(dir, 'missing')).view()).rivals).toEqual([]);
  });

  it('passes on the generation where the network grew', async () => {
    const state = { generation: 3, history: [{ generation: 2, finished: '2026-09-15T16:00:00', grown: { network: 'b15c128', promoted: true } }] };
    await writeFile(path.join(dir, 'state.json'), JSON.stringify(state));
    const view = await training.view();
    expect(view.history[0]!.grown).toEqual({ network: 'b15c128', promoted: true });
  });

  it('reads the generation history, settings and the end of the log', async () => {
    const state = {
      generation: 2,
      history: [
        { generation: 1, finished: '2026-09-15T10:00:00', selfplay: { games: 600, rows: 15000, unfinished: 12 },
          evaluation: { vsPrevious: { wins: 24, losses: 16, elo: 70, eloLow: -20, eloHigh: 170 } } },
      ],
    };
    await writeFile(path.join(dir, 'state.json'), JSON.stringify(state));
    await writeFile(path.join(dir, 'config.json'), JSON.stringify({ pauseApps: ['obs64.exe'], threads: 48 }));
    const lines = Array.from({ length: 80 }, (_, i) => `2026-09-15 10:00:${String(i % 60).padStart(2, '0')}  line ${i}`);
    await writeFile(path.join(dir, 'log.txt'), lines.join('\n') + '\n');
    const view = await training.view();
    expect(view.started).toBe(true);
    expect(view.generation).toBe(2);
    expect(view.history).toHaveLength(1);
    expect(view.pauseApps).toEqual(['obs64.exe']);
    expect(view.log).toHaveLength(40);
    expect(view.log.at(-1)).toContain('line 79');
  });

  it('pauses with a file the loop watches, and resumes by removing it', async () => {
    await training.setPaused(true);
    expect((await training.view()).paused).toBe(true);
    await training.setPaused(false);
    expect((await training.view()).paused).toBe(false);
  });

  it('keeps other settings when the pause apps change, and cleans the list', async () => {
    await writeFile(path.join(dir, 'config.json'), JSON.stringify({ threads: 48 }));
    await training.setPauseApps(['OBS64.exe', ' obs64.exe ', 'bad name!', 'game.exe']);
    const config = JSON.parse(await readFile(path.join(dir, 'config.json'), 'utf8'));
    expect(config).toEqual({ threads: 48, pauseApps: ['obs64.exe', 'game.exe'] });
  });

  it('only lets this PC change training', () => {
    expect(isLocalAddress('127.0.0.1')).toBe(true);
    expect(isLocalAddress('::1')).toBe(true);
    expect(isLocalAddress('::ffff:127.0.0.1')).toBe(true);
    expect(isLocalAddress('25.0.150.39')).toBe(false);
    expect(isLocalAddress(undefined)).toBe(false);
  });
});
