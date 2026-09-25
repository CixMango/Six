// Engine MCTS compiled to WebAssembly, with the network run by ONNX Runtime Web.
// evaluateBatch writes outputs in the same layout as engine/src/evaluator.cpp, so both searches agree.
import type * as OrtNamespace from 'onnxruntime-web';
import type { Hex } from '../../shared/hex.ts';

type Ort = typeof OrtNamespace;

/** The parts of the Emscripten module (createSixBot) this file uses. */
export interface SixBotModule {
  HEAPF32: Float32Array;
  ccall: (name: string, returnType: string | null, argTypes: string[], args: unknown[], opts?: { async?: boolean }) => unknown;
  evaluateBatch?: (planes: number, batch: number, out: number) => Promise<void>;
}

export interface BrowserBot {
  /** Plays the rest of the current turn: `moves` is the whole game so far. */
  turn(moves: readonly Hex[], radius: number, movetimeMs: number, nodes?: number): Promise<Hex[]>;
  newGame(): void;
  /** The search's score for the side to move after `movetimeMs` (1000 x value, 1000000 for a proven win). */
  evaluate(moves: readonly Hex[], radius: number, movetimeMs: number): Promise<number>;
  /** Option names match MctsParams. */
  setOption?(name: string, value: number): void;
  readonly backend: string;
  readonly evaluations: number;
}

export interface BrowserBotOptions {
  ort: Ort;
  /** A net.onnx URL or its bytes, or a function picking one per backend. */
  model: string | Uint8Array | ((provider: string) => string | Uint8Array);
  createModule: (overrides: Record<string, unknown>) => Promise<SixBotModule>;
  /** Tried in order; the first that loads is used. */
  providers?: string[];
}

export async function createBrowserBot(options: BrowserBotOptions): Promise<BrowserBot> {
  const { ort } = options;
  let session: OrtNamespace.InferenceSession | null = null;
  let backend = '';
  let lastError: unknown = null;
  for (const provider of options.providers ?? ['webgpu', 'wasm']) {
    try {
      const model = typeof options.model === 'function' ? options.model(provider) : options.model;
      session = await ort.InferenceSession.create(model as never, { executionProviders: [provider], logSeverityLevel: 3 });
      backend = provider;
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!session) throw new Error(`the network would not load: ${String(lastError)}`);

  let evaluations = 0;
  let module: SixBotModule | null = null;
  module = await options.createModule({});
  const engine = module;
  const cropCells = engine.ccall('six_crop_cells', 'number', [], []) as number;
  const planeCount = engine.ccall('six_plane_count', 'number', [], []) as number;
  const crop = engine.ccall('six_crop', 'number', [], []) as number;
  const stride = cropCells + 2; // NetOutput: policy logits, then value and score

  engine.evaluateBatch = async (planesPtr: number, batch: number, outPtr: number) => {
    const size = batch * planeCount * cropCells;
    // Copy out before awaiting: the engine's memory may grow (and its views move) while the network runs.
    const planes = engine.HEAPF32.slice(planesPtr >> 2, (planesPtr >> 2) + size);
    const result = await session!.run({ planes: new ort.Tensor('float32', planes, [batch, planeCount, crop, crop]) });
    const policy = result.policy!.data as Float32Array;
    const value = result.value!.data as Float32Array;
    const score = result.score!.data as Float32Array;
    const heap = engine.HEAPF32;
    for (let b = 0; b < batch; b++) {
      const at = (outPtr >> 2) + b * stride;
      heap.set(policy.subarray(b * cropCells, (b + 1) * cropCells), at);
      // Softmax over (win, loss) reduces to tanh of half the logit difference, as in evaluator.cpp.
      heap[at + cropCells] = Math.tanh(0.5 * (value[2 * b]! - value[2 * b + 1]!));
      heap[at + cropCells + 1] = score[b]!;
    }
    evaluations += batch;
  };

  let busy = Promise.resolve();
  return {
    get backend() {
      return backend;
    },
    get evaluations() {
      return evaluations;
    },
    newGame() {
      engine.ccall('six_new_game', null, [], []);
    },
    setOption(name, value) {
      engine.ccall('six_set_option', 'number', ['string', 'number'], [name, value]);
    },
    evaluate(moves, radius, movetimeMs) {
      const run = busy.then(async () => {
        const text = moves.map((m) => `${m.q} ${m.r}`).join(' ');
        const score = (await engine.ccall('six_eval', 'number', ['string', 'number', 'number'], [text, radius, movetimeMs], { async: true })) as number;
        if (score === -2147483647) throw new Error('not a legal position');
        return score;
      });
      busy = run.then(() => undefined, () => undefined);
      return run;
    },
    turn(moves, radius, movetimeMs, nodes = 0) {
      // One search at a time: the engine is single-threaded and its tree is shared.
      const run = busy.then(async () => {
        const text = moves.map((m) => `${m.q} ${m.r}`).join(' ');
        const reply = (await engine.ccall('six_turn', 'string', ['string', 'number', 'number', 'number'],
          [text, radius, movetimeMs, nodes], { async: true })) as string;
        if (reply.startsWith('error')) throw new Error(reply);
        const numbers = reply.trim().split(/\s+/).filter(Boolean).map(Number);
        const stones: Hex[] = [];
        for (let i = 0; i + 1 < numbers.length; i += 2) stones.push({ q: numbers[i]!, r: numbers[i + 1]! });
        return stones;
      });
      busy = run.then(() => undefined, () => undefined);
      return run;
    },
  };
}
