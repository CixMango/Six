// The WebAssembly build must pick the same turns as the native engine with the same network on CPU.
// Skipped until engine/web/build.sh has run and a trained network exists.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as ort from 'onnxruntime-web';
import { createBrowserBot, type SixBotModule } from '../src/client/bot/browserBot.ts';
import type { Hex } from '../src/shared/hex.ts';

const ROOT = path.resolve(import.meta.dirname, '../..');
const WASM_JS = path.join(ROOT, 'web/public/bot/sixbot.mjs');
const EXE = path.join(ROOT, 'engine/build/release/sixengine.exe');

function newestNetwork(): string | null {
  const runs = path.join(ROOT, 'runs/rl');
  if (!existsSync(runs)) return null;
  const gens = readdirSync(runs).filter((n) => /^gen-\d{4}$/.test(n)).sort().reverse();
  for (const gen of gens) {
    const net = path.join(runs, gen, 'net.onnx');
    if (existsSync(net)) return net;
  }
  return null;
}

const NET = newestNetwork();
const ready = existsSync(WASM_JS) && existsSync(EXE) && NET !== null;

// From a real game: opening, early middle game, sharper middle game.
const GAME: Hex[] = [
  [0, 0], [1, -1], [1, 0], [-1, 1], [2, -1], [0, 1], [-1, 0], [2, -2], [3, -2], [1, 1], [0, 2],
  [-2, 1], [3, -3], [-1, 2], [4, -3], [2, 0], [-2, 2],
].map(([q, r]) => ({ q: q!, r: r! }));
const POSITIONS = [1, 5, 9, 13, 17].map((n) => GAME.slice(0, n));
const NODES = 160;

function nativeTurn(moves: readonly Hex[], net: string): Promise<Hex[]> {
  return new Promise((resolve, reject) => {
    const site = path.join(ROOT, '.venv/Lib/site-packages');
    const env = { ...process.env, PATH: [path.join(site, 'torch/lib'), process.env.PATH ?? ''].join(path.delimiter) };
    const child = spawn(EXE, ['--net', net, '--cpu'], { env });
    let buffer = '';
    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const line = buffer.split(/\r?\n/).find((l) => l.startsWith('bestmove'));
      if (!line) return;
      child.stdin.write('quit\n');
      const numbers = line.split(/\s+/).slice(1).map(Number);
      const stones: Hex[] = [];
      for (let i = 0; i + 1 < numbers.length; i += 2) stones.push({ q: numbers[i]!, r: numbers[i + 1]! });
      resolve(stones);
    });
    child.on('error', reject);
    const list = moves.map((m) => `${m.q} ${m.r}`).join(' ');
    child.stdin.write(`position radius 8 moves ${list}\ngo nodes ${NODES}\n`);
  });
}

describe.skipIf(!ready)('HexBot Net in the browser', () => {
  it('chooses the same turns as the native engine on the same network', { timeout: 600_000 }, async () => {
    ort.env.wasm.numThreads = 1;
    const createSixBot = (await import(pathToFileURL(WASM_JS).href)).default as
      (o: Record<string, unknown>) => Promise<SixBotModule>;
    const bot = await createBrowserBot({
      ort,
      model: new Uint8Array(readFileSync(NET!)),
      createModule: (overrides) => createSixBot({ ...overrides, locateFile: (f: string) => path.join(path.dirname(WASM_JS), f) }),
      providers: ['wasm'],
    });
    expect(bot.backend).toBe('wasm');
    for (const moves of POSITIONS) {
      bot.newGame();
      const browser = await bot.turn(moves, 8, 0, NODES);
      const native = await nativeTurn(moves, NET!);
      expect(browser, `after ${moves.length} stones`).toEqual(native);
    }
    expect(bot.evaluations).toBeGreaterThan(0);
  });
});
