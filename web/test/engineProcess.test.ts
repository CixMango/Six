import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EngineProcess } from '../src/server/engineProcess.ts';

// Fake engine: answers every `go` with one stone and reports its pid so restarts are visible.
function fakeEngine(): string {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'six-engine-')), 'engine.mjs');
  writeFileSync(file, `
import { createInterface } from 'node:readline';
createInterface({ input: process.stdin }).on('line', (line) => {
  if (line.startsWith('go')) {
    console.log('info depth 1 score ' + process.pid + ' nodes 1 time 1');
    console.log('bestmove 1 0');
  }
  if (line === 'quit') process.exit(0);
});
`);
  return file;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('EngineProcess', () => {
  it('closes itself once idle, so an unused engine never holds the GPU, and starts again on the next request', async () => {
    const engine = new EngineProcess(process.execPath, [fakeEngine()], undefined, [], 150);
    const first = await engine.search([], 9, 1);
    expect(engine.running).toBe(true);
    await wait(400);
    expect(engine.running).toBe(false);
    const second = await engine.search([], 9, 1);
    expect(second.cells).toEqual([{ q: 1, r: 0 }]);
    expect(second.score).not.toBe(first.score); // a new process
    engine.close();
  });

  it('fails a request at once with the engine’s own message when it dies, and marks it crashed', async () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'six-engine-')), 'dies.mjs');
    writeFileSync(file, `console.error('could not load the network: no such device'); process.exit(1);`);
    const engine = new EngineProcess(process.execPath, [file]);
    const started = Date.now();
    await expect(engine.search([], 9, 1)).rejects.toThrow(/could not load the network: no such device/);
    expect(Date.now() - started).toBeLessThan(5000);
    expect(engine.crashed).toBe(true);
    expect(engine.failedToStart).toBe(true);
  });

  it('a crash after answering is not a failed start', async () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'six-engine-')), 'once.mjs');
    writeFileSync(file, `
import { createInterface } from 'node:readline';
let n = 0;
createInterface({ input: process.stdin }).on('line', (line) => {
  if (line.startsWith('go') && n++ === 0) console.log('bestmove 1 0');
  else if (line.startsWith('go')) process.exit(3);
});
`);
    const engine = new EngineProcess(process.execPath, [file]);
    await engine.search([], 9, 1);
    await expect(engine.search([], 9, 1)).rejects.toThrow(/exit code 3/);
    expect(engine.crashed).toBe(true);
    expect(engine.failedToStart).toBe(false);
  });

  it('fails a request at once when the engine can’t be started at all', async () => {
    const engine = new EngineProcess(path.join(tmpdir(), 'no-such-engine-here'));
    await expect(engine.search([], 9, 1)).rejects.toThrow(/engine stopped/i);
    expect(engine.crashed).toBe(true);
  });

  it('is not marked crashed when it is closed', async () => {
    const engine = new EngineProcess(process.execPath, [fakeEngine()]);
    await engine.search([], 9, 1);
    engine.close();
    await wait(200);
    expect(engine.crashed).toBe(false);
  });

  it('stays up while requests keep coming', async () => {
    const engine = new EngineProcess(process.execPath, [fakeEngine()], undefined, [], 300);
    const first = await engine.search([], 9, 1);
    for (let i = 0; i < 4; i++) {
      await wait(100);
      expect((await engine.search([], 9, 1)).score).toBe(first.score);
    }
    engine.close();
  });
});
