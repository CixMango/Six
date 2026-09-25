import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generationNetwork, listGenerations, newestNetwork } from '../src/server/bots.ts';
import { isBotId, isTimedBot } from '../src/shared/botMeta.ts';

describe('network bot', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'six-nets-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('plays the newest generation that has an exported network', async () => {
    const runs = path.join(dir, 'rl');
    for (const gen of ['gen-0000', 'gen-0001', 'gen-0002']) await mkdir(path.join(runs, gen), { recursive: true });
    await writeFile(path.join(runs, 'gen-0000', 'net.onnx'), 'x');
    await writeFile(path.join(runs, 'gen-0001', 'net.onnx'), 'x');
    // Generation 2 is still training: no network file yet.
    expect(newestNetwork(runs, path.join(dir, 'warm.onnx'))).toBe(path.join(runs, 'gen-0001', 'net.onnx'));
  });

  it('falls back to the warm-start network, and to nothing', async () => {
    const warm = path.join(dir, 'warm.onnx');
    expect(newestNetwork(path.join(dir, 'missing'), warm)).toBeNull();
    await writeFile(warm, 'x');
    expect(newestNetwork(path.join(dir, 'missing'), warm)).toBe(warm);
  });

  it('lists every generation with saved weights, newest last', async () => {
    const runs = path.join(dir, 'rl');
    for (const gen of ['gen-0003', 'gen-0001', 'gen-0002', 'gen-0004']) await mkdir(path.join(runs, gen), { recursive: true });
    await writeFile(path.join(runs, 'gen-0001', 'net.pt'), 'x');
    await writeFile(path.join(runs, 'gen-0002', 'net.onnx'), 'x');
    await writeFile(path.join(runs, 'gen-0003', 'net.pt'), 'x');
    // Generation 4 is still training: no weights yet.
    expect(listGenerations(runs)).toEqual([1, 2, 3]);
  });

  it('plays an older generation, exporting its network from the saved weights the first time', async () => {
    const runs = path.join(dir, 'rl');
    await mkdir(path.join(runs, 'gen-0002'), { recursive: true });
    await mkdir(path.join(runs, 'gen-0003'), { recursive: true });
    await writeFile(path.join(runs, 'gen-0002', 'net.onnx'), 'x');
    await writeFile(path.join(runs, 'gen-0003', 'net.pt'), 'x');
    const exported: string[] = [];
    const exportNet = async (pt: string, onnx: string) => {
      exported.push(pt);
      await writeFile(onnx, 'exported');
    };
    expect(await generationNetwork(2, runs, exportNet)).toBe(path.join(runs, 'gen-0002', 'net.onnx'));
    expect(exported).toEqual([]);
    expect(await generationNetwork(3, runs, exportNet)).toBe(path.join(runs, 'gen-0003', 'net.onnx'));
    expect(exported).toEqual([path.join(runs, 'gen-0003', 'net.pt')]);
    await expect(generationNetwork(9, runs, exportNet)).rejects.toThrow(/generation 9/);
  });

  it('knows the network bot by id and gives it thinking-time levels', () => {
    expect(isBotId('hexnet')).toBe(true);
    expect(isTimedBot('hexnet')).toBe(true);
    expect(isTimedBot('rookie')).toBe(false);
  });
});
