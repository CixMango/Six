/// <reference lib="webworker" />
// Messages in:  { id, moves, radius, movetimeMs }   Messages out: { id, cells } | { id, error } | { ready, backend }
import * as ort from 'onnxruntime-web';
import { createBrowserBot, type BrowserBot, type SixBotModule } from './browserBot.ts';
import type { Hex } from '../../shared/hex.ts';

// The public build loads ORT's wasm files from a CDN (one is over Cloudflare Pages' 25 MB limit).
// ORT warns about its own CPU fallbacks for shape ops, so only log errors.
ort.env.logLevel = 'error';
ort.env.wasm.wasmPaths = import.meta.env.VITE_ORT_CDN || new URL('/ort/', self.location.origin).href;
// Multiple threads need a cross-origin isolated page.
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 4) - 1)) : 1;

let bot: Promise<BrowserBot> | null = null;

/** WebGPU shader-f16 support, needed for the fp16 network. */
async function halfPrecision(): Promise<boolean> {
  try {
    const adapter = await (navigator as Navigator & { gpu?: { requestAdapter(): Promise<{ features: Set<string> } | null> } }).gpu?.requestAdapter();
    return adapter?.features.has('shader-f16') ?? false;
  } catch {
    return false;
  }
}

function load(): Promise<BrowserBot> {
  bot ??= (async () => {
    // A full URL: Vite's dev server refuses bare /public paths in import() (it tags them ?import).
    const url = new URL('/bot/sixbot.mjs', self.location.origin).href;
    const createSixBot = (await import(/* @vite-ignore */ url)).default as (o: Record<string, unknown>) => Promise<SixBotModule>;
    const half = await halfPrecision();
    const created = await createBrowserBot({
      ort,
      // fp16 is about twice as fast and half the download.
      model: (provider) => (provider === 'webgpu' && half ? '/bot/hexnet-fp16.onnx' : '/bot/hexnet.onnx'),
      createModule: (overrides) => createSixBot({ ...overrides, locateFile: (f: string) => `/bot/${f}` }),
      providers: 'gpu' in navigator ? ['webgpu', 'wasm'] : ['wasm'],
    });
    // Deep threat search so forced wins get proven several turns out.
    created.setOption?.('rootThreatNodes', 1_000_000);
    postMessage({ ready: true, backend: created.backend });
    return created;
  })();
  return bot;
}

let lastMoves: readonly Hex[] = [];

self.onmessage = async (event: MessageEvent<{ id: number; moves: Hex[]; radius: number; movetimeMs: number; warm?: boolean; judge?: boolean }>) => {
  if (event.data.warm) {
    load().catch(() => undefined);  // a failure resurfaces on the first real turn
    return;
  }
  if (event.data.judge) {
    const { id, moves, radius, movetimeMs } = event.data;
    try {
      const engine = await load();
      postMessage({ id, score: await engine.evaluate(moves, radius, movetimeMs) });
    } catch (e) {
      postMessage({ id, error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }
  const { id, moves, radius, movetimeMs } = event.data;
  try {
    const engine = await load();
    // A game that isn't a continuation of the last one starts a fresh tree.
    const continues = lastMoves.length <= moves.length && lastMoves.every((m, i) => m.q === moves[i]!.q && m.r === moves[i]!.r);
    if (!continues) engine.newGame();
    const cells = await engine.turn(moves, radius, movetimeMs);
    lastMoves = [...moves, ...cells];
    postMessage({ id, cells });
  } catch (e) {
    postMessage({ id, error: e instanceof Error ? e.message : String(e) });
  }
};
