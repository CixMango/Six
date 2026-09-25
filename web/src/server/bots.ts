import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Hex } from '../shared/hex.ts';
import { Game, otherPlayer, SAVED_RADII, type Player } from '../shared/rules.ts';
import { chooseTurn } from '../shared/bots/rookie.ts';
import { BOT_META, HEXBOT_MOVETIME_MS } from '../shared/botMeta.ts';
import { evaluationFromScore, idleTurn, turnStart, type Evaluation } from '../shared/winChance.ts';
import { EngineProcess } from './engineProcess.ts';
import { markBotGame } from './training.ts';

export interface BotInfo {
  id: string;
  name: string;
  levels: number;
  levelLabels: string[];
  description: string;
}

const ROOT = path.resolve(import.meta.dirname, '../../..');
const ENGINE_EXE = process.env.SIX_ENGINE ?? path.join(ROOT, 'engine/build/release/sixengine.exe');
const RUNS_RL = process.env.SIX_RUNS_DIR ?? path.join(ROOT, 'runs/rl');
// WebAssembly engine and network for the browser bot, built by engine/web/build.sh.
const BROWSER_BOT = path.join(ROOT, 'web/public/bot');
// The net engine loads PyTorch's CUDA DLLs from the venv.
const CUDA_DLLS = path.join(ROOT, '.venv/Lib/site-packages/torch/lib');
// Optional. TensorRT is several times faster; its engine file is cached next to the model.
const TENSORRT_DLLS = path.join(ROOT, '.venv/Lib/site-packages/tensorrt_libs');

let engine: EngineProcess | null = null;
// Keyed by network file, least recently used first.
const netEngines = new Map<string, EngineProcess>();
// Each loaded net takes about 1 GB of RAM plus GPU memory.
const MAX_NET_ENGINES = 2;
// A loaded engine keeps the GPU in a slower power state (games lag), so close idle ones.
const NET_IDLE_CLOSE_MS = 3 * 60_000;

function hexbotAvailable(): boolean {
  return existsSync(ENGINE_EXE);
}

// Latest RL generation, else the warm-start net.
export function newestNetwork(runsDir = RUNS_RL, warmStart = path.join(ROOT, 'runs/v1-mixed/best-fp16.onnx')): string | null {
  if (process.env.SIX_NET) return existsSync(process.env.SIX_NET) ? process.env.SIX_NET : null;
  try {
    const generations = readdirSync(runsDir)
      .filter((name) => /^gen-\d{4}$/.test(name))
      .sort()
      .reverse();
    for (const gen of generations) {
      const net = path.join(runsDir, gen, 'net.onnx');
      if (existsSync(net)) return net;
    }
  } catch {
    // No learning loop yet.
  }
  return existsSync(warmStart) ? warmStart : null;
}

function generationLabel(net: string): string {
  const match = /gen-(\d{4})/.exec(net);
  if (match) return `generation ${Number(match[1])}`;
  try {
    const state = JSON.parse(readFileSync(path.join(RUNS_RL, 'state.json'), 'utf8')) as { generation?: number };
    if (typeof state.generation === 'number') return `generation ${state.generation}`;
  } catch {
    // Fall through.
  }
  return 'the warm-start network';
}

// HexBot is listed once the engine is built, HexBot Net once a network exists too.
export function availableBots(): BotInfo[] {
  const bots: BotInfo[] = [
    {
      id: 'rookie',
      name: BOT_META.rookie.name,
      levels: BOT_META.rookie.levelLabels.length,
      levelLabels: [...BOT_META.rookie.levelLabels],
      description: 'Placeholder bot: never misses a one-turn win or block at levels 3 to 5.',
    },
  ];
  if (hexbotAvailable()) {
    bots.push({
      id: 'hexbot',
      name: BOT_META.hexbot.name,
      levels: BOT_META.hexbot.levelLabels.length,
      levelLabels: [...BOT_META.hexbot.levelLabels],
      description: 'The project’s own engine: an exact-tactics alpha-beta search. Levels set its thinking time per turn.',
    });
    const net = newestNetwork();
    if (net) {
      bots.push({
        id: 'hexnet',
        name: BOT_META.hexnet.name,
        levels: BOT_META.hexnet.levelLabels.length,
        levelLabels: [...BOT_META.hexnet.levelLabels],
        description: `Six’s self-taught network searching on the GPU (${generationLabel(net)}). Levels set its thinking time per turn.`,
      });
    }
  }
  if (existsSync(path.join(BROWSER_BOT, 'sixbot.wasm')) && existsSync(path.join(BROWSER_BOT, 'hexnet.onnx'))) {
    bots.push({
      id: 'hexweb',
      name: BOT_META.hexweb.name,
      levels: BOT_META.hexweb.levelLabels.length,
      levelLabels: [...BOT_META.hexweb.levelLabels],
      description: 'Six running inside your browser (graphics card through WebGPU when it can, else the CPU). Plays the same moves as Six Net, with less search per second.',
    });
  }
  return bots;
}

export interface BotTurnRequest {
  moves: Array<[number, number]>;
  radius: number;
  bot: string;
  level: number;
  // Six only: play this older generation instead of the newest.
  generation?: number;
}

export function parseBotTurnRequest(body: unknown): BotTurnRequest {
  const v = (body ?? {}) as Record<string, unknown>;
  if (!Array.isArray(v.moves) || v.moves.length > 5000) throw new Error('moves must be a list');
  const moves = v.moves.map((m) => {
    if (!Array.isArray(m) || m.length !== 2 || !m.every(Number.isInteger)) throw new Error('each move is [q, r]');
    return [m[0], m[1]] as [number, number];
  });
  if (!SAVED_RADII.includes(v.radius as 8 | 9)) throw new Error('radius must be 8');
  const bot = availableBots().find((b) => b.id === v.bot);
  if (!bot) throw new Error('unknown bot');
  const level = Number(v.level);
  if (!Number.isInteger(level) || level < 1 || level > bot.levels) throw new Error('bad level');
  if (v.generation === undefined || v.generation === null) return { moves, radius: v.radius as number, bot: bot.id, level };
  const generation = Number(v.generation);
  // Published generations that aren't on this PC yet are fetched by generationNetwork, which also rejects unknown ones.
  if (bot.id !== 'hexnet' || !Number.isInteger(generation) || generation < 0 || generation > 9999) {
    throw new Error('bad generation');
  }
  return { moves, radius: v.radius as number, bot: bot.id, level, generation };
}

// Generations that have net.pt or net.onnx, oldest first.
export function listGenerations(runsDir = RUNS_RL): number[] {
  try {
    return readdirSync(runsDir)
      .filter((name) => /^gen-\d{4}$/.test(name))
      .filter((name) => existsSync(path.join(runsDir, name, 'net.pt')) || existsSync(path.join(runsDir, name, 'net.onnx')))
      .map((name) => Number(name.slice(4)))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

// null for the warm-start network.
export function generationOf(net: string | null): number | null {
  const match = net ? /gen-(\d{4})/.exec(net) : null;
  return match ? Number(match[1]) : null;
}

// Uses the trainer's exporter. CPU only, takes about a minute.
function exportNetwork(pt: string, onnx: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const python = path.join(ROOT, '.venv/Scripts/python.exe');
    const child = spawn(python, [path.join(ROOT, 'trainer/export.py'), pt, onnx], { cwd: ROOT, windowsHide: true, stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`exporting ${pt} failed (exit ${code})`))));
  });
}

const exporting = new Map<string, Promise<void>>();

// Every tenth older generation is published as a release on GitHub; one is downloaded the first time it's played.
const NETWORKS_URL = process.env.SIX_NETWORKS_URL ?? 'https://github.com/CixMango/Six/releases/download/networks';
let published: Promise<number[]> | null = null;

export function downloadableGenerations(): Promise<number[]> {
  published ??= fetch(`${NETWORKS_URL}/generations.json`, { signal: AbortSignal.timeout(8000) })
    .then((r) => (r.ok ? r.json() : { generations: [] }))
    .then((j: { generations?: unknown }) => (Array.isArray(j.generations) ? j.generations.filter((g): g is number => Number.isInteger(g)) : []))
    .catch(() => {
      published = null;  // offline: try again next time
      return [];
    });
  return published;
}

async function downloadNetwork(gen: number, file: string): Promise<void> {
  const res = await fetch(`${NETWORKS_URL}/gen-${String(gen).padStart(4, '0')}.onnx`, { signal: AbortSignal.timeout(300_000) });
  if (!res.ok) throw new Error(`generation ${gen} could not be downloaded (${res.status})`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

// Old generations may only have net.pt (the onnx was deleted to save disk), so export on first use; published
// ones that aren't on this PC are downloaded.
export async function generationNetwork(
  gen: number,
  runsDir = RUNS_RL,
  exportNet: (pt: string, onnx: string) => Promise<void> = exportNetwork,
  download: (gen: number, file: string) => Promise<void> = downloadNetwork,
  remote: () => Promise<number[]> = downloadableGenerations,
): Promise<string> {
  const dir = path.join(runsDir, `gen-${String(gen).padStart(4, '0')}`);
  const onnx = path.join(dir, 'net.onnx');
  if (existsSync(onnx)) return onnx;
  const pt = path.join(dir, 'net.pt');
  const fetchable = !existsSync(pt) && (await remote()).includes(gen);
  if (!existsSync(pt) && !fetchable) throw new Error(`generation ${gen} has no saved network`);
  let job = exporting.get(onnx);
  if (!job) {
    // Write under a temp name so a failed export or download can't leave a broken net.onnx.
    const partial = path.join(dir, fetchable ? 'net.download.onnx' : 'net.export.onnx');
    job = (fetchable ? download(gen, partial) : exportNet(pt, partial))
      .then(() => {
        if (existsSync(partial)) renameSync(partial, onnx);
      })
      .finally(() => exporting.delete(onnx));
    exporting.set(onnx, job);
  }
  await job;
  if (!existsSync(onnx)) throw new Error(`generation ${gen} could not be ${fetchable ? 'downloaded' : 'exported'}`);
  return onnx;
}

// Keeps two engines loaded so a game between two generations doesn't reload one every turn (LRU eviction).
function networkEngine(chosen?: string): EngineProcess {
  const net = chosen ?? newestNetwork();
  if (!net) throw new Error('No trained network is available yet.');
  let entry = netEngines.get(net);
  if (entry) {
    netEngines.delete(net);  // re-inserted below to mark it most recently used
  } else {
    if (netEngines.size >= MAX_NET_ENGINES) {
      const [oldest, old] = netEngines.entries().next().value!;
      old.close();
      netEngines.delete(oldest);
    }
    const env = { ...process.env, PATH: [CUDA_DLLS, TENSORRT_DLLS, process.env.PATH ?? ''].join(path.delimiter) };
    const trt = existsSync(path.join(TENSORRT_DLLS, 'nvinfer_10.dll')) ? ['--trt'] : [];
    entry = new EngineProcess(ENGINE_EXE, ['--net', net, ...trt], env, [], NET_IDLE_CLOSE_MS);
  }
  netEngines.set(net, entry);
  return entry;
}

// Long enough for the threat solver to prove wins several turns deep.
export const EVAL_MOVETIME_MS = 1600;
// Much bigger threat-solver budget than a normal search, so a forced win is reported the turn it appears.
// The solver gets about a quarter of the judging time (400 ms).
const EVAL_SETUP = ['setoption rootThreatNodes 3000000'];
// Separate process so judging never waits on (or disturbs) a bot's search.
let evalEngine: { path: string | null; process: EngineProcess } | null = null;

// Judged by Six on the newest network if there is one, else by Six Classic.
export async function evaluatePosition(moves: Array<[number, number]>, radius: number, keep = false): Promise<Evaluation & { engine: 'six' | 'classic' }> {
  // Both players and a watching host ask about the same positions.
  const key = `${radius}|${newestNetwork() ?? ''}|${moves.join(' ')}`;
  const known = evalCache.get(key);
  if (known) return known;
  const running = evalRunning.get(key);
  if (running) return running;
  const run = judgeInTurn(key, moves, radius, keep).finally(() => evalRunning.delete(key));
  evalRunning.set(key, run);
  return run;
}

async function judgeInTurn(key: string, moves: Array<[number, number]>, radius: number, keep: boolean): Promise<Evaluation & { engine: 'six' | 'classic' }> {
  // Runs one at a time. A newer request drops this one (stepping through a replay would otherwise queue stale
  // positions), unless `keep` is set: live games need every turn end judged to catch blunders.
  const ticket = ++evalTicket;
  const previous = evalChain;
  let release = () => undefined as void;
  evalChain = new Promise<void>((resolve) => (release = resolve));
  try {
    await previous;
    if (!keep && ticket !== evalTicket) throw new Error('A newer position was asked for.');
    const result = await judge(moves, radius);
    evalCache.set(key, result);
    if (evalCache.size > 500) evalCache.delete(evalCache.keys().next().value!);
    return result;
  } finally {
    release();
  }
}

const evalCache = new Map<string, Evaluation & { engine: 'six' | 'classic' }>();
const evalRunning = new Map<string, Promise<Evaluation & { engine: 'six' | 'classic' }>>();
let evalTicket = 0;
let evalChain: Promise<void> = Promise.resolve();

async function judge(moves: Array<[number, number]>, radius: number): Promise<Evaluation & { engine: 'six' | 'classic' }> {
  const hexes = moves.map(([q, r]) => ({ q, r }));
  const game = Game.fromMoves(hexes, radius);
  if (game.winner) return { winX: game.winner === 'X' ? 1 : 0, proven: game.winner, engine: newestNetwork() ? 'six' : 'classic' };
  const { process: judgeProcess, net } = judgeEngine();
  const { score } = await judgeProcess.search(hexes, radius, EVAL_MOVETIME_MS);
  if (score === null) throw new Error('The engine gave no evaluation.');
  const engine = net ? 'six' : 'classic';
  return { ...evaluationFromScore(score, game.current, engine), engine };
}

function judgeEngine(): { process: EngineProcess; net: string | null } {
  if (!hexbotAvailable()) throw new Error('The engine has not been built yet.');
  const net = newestNetwork();
  if (evalEngine?.path !== net) {
    evalEngine?.process.close();
    const env = { ...process.env, PATH: [CUDA_DLLS, TENSORRT_DLLS, process.env.PATH ?? ''].join(path.delimiter) };
    const trt = existsSync(path.join(TENSORRT_DLLS, 'nvinfer_10.dll')) ? ['--trt'] : [];
    evalEngine = {
      path: net,
      process: net
        ? new EngineProcess(ENGINE_EXE, ['--net', net, ...trt], env, EVAL_SETUP, NET_IDLE_CLOSE_MS)
        : new EngineProcess(ENGINE_EXE, [], undefined, EVAL_SETUP),
    };
  }
  return { process: evalEngine!.process, net };
}

export interface ReviewFacts {
  winX: number;
  proven: Player | null;
  best: Array<[number, number]>;
}

// Quick review uses 1 s, "look deeper" 5 s.
export const REVIEW_MS = { min: 200, max: 10_000 } as const;
const reviewCache = new Map<string, ReviewFacts>();

// Win chance and best turn from Six, plus a proven forced win (from the search, else the exact verdict).
export async function reviewPosition(moves: Array<[number, number]>, radius: number, movetimeMs: number): Promise<ReviewFacts> {
  const hexes = moves.map(([q, r]) => ({ q, r }));
  const game = Game.fromMoves(hexes, radius);
  if (game.winner) return { winX: game.winner === 'X' ? 1 : 0, proven: game.winner, best: [] };
  const key = `${radius}|${movetimeMs}|${newestNetwork() ?? ''}|${moves.join(' ')}`;
  const known = reviewCache.get(key);
  if (known) return known;
  const { process: judgeProcess, net } = judgeEngine();
  const { cells, score } = await judgeProcess.search(hexes, radius, movetimeMs);
  if (score === null) throw new Error('The engine gave no evaluation.');
  const evaluation = evaluationFromScore(score, game.current, net ? 'six' : 'classic');
  const proven = evaluation.proven ?? (await provenWinner(moves, radius));
  let best = cells.map((c) => [c.q, c.r] as [number, number]);
  // The side to move has a forced win the network's search didn't find: show the solver's winning turn instead.
  if (proven === game.current && evaluation.proven !== proven) {
    const line = await solverLine(moves, radius);
    if (line.proven === proven && line.cells.length > 0) best = line.cells;
  }
  const facts: ReviewFacts = {
    winX: proven ? (proven === 'X' ? 1 : 0) : evaluation.winX,
    proven,
    best,
  };
  reviewCache.set(key, facts);
  if (reviewCache.size > 2000) reviewCache.delete(reviewCache.keys().next().value!);
  return facts;
}

// Six Classic's exact threat search proves forced wins well within this.
export const VERDICT_MOVETIME_MS = 400;
const lineCache = new Map<string, { proven: Player | null; cells: Array<[number, number]> }>();

// Six Classic's turn and verdict with the full judging time: its alpha-beta plays proven wins and exact defences.
async function solverLine(moves: Array<[number, number]>, radius: number): Promise<{ proven: Player | null; cells: Array<[number, number]> }> {
  const key = `${radius}|${moves.join(' ')}`;
  const known = lineCache.get(key);
  if (known) return known;
  const game = Game.fromMoves(moves.map(([q, r]) => ({ q, r })), radius);
  if (!hexbotAvailable() || game.winner) return { proven: game.winner, cells: [] };
  verdictEngine ??= new EngineProcess(ENGINE_EXE, [], undefined, EVAL_SETUP);
  const { cells, score } = await verdictEngine.search(game.moves, radius, EVAL_MOVETIME_MS);
  const line = {
    proven: score === null ? null : evaluationFromScore(score, game.current, 'classic').proven,
    cells: cells.map((c) => [c.q, c.r] as [number, number]),
  };
  lineCache.set(key, line);
  if (lineCache.size > 500) lineCache.delete(lineCache.keys().next().value!);
  return line;
}

// For a turn that handed the opponent a forced win: a different turn after which they have none, or [] if the
// solver finds none in time.
export async function reviewDefense(moves: Array<[number, number]>, played: Array<[number, number]>, radius: number): Promise<Array<[number, number]>> {
  const game = Game.fromMoves(moves.map(([q, r]) => ({ q, r })), radius);
  if (game.winner) return [];
  const opponent = otherPlayer(game.current);
  const line = await solverLine(moves, radius);
  const same = line.cells.length === played.length && line.cells.every(([q, r]) => played.some(([pq, pr]) => pq === q && pr === r));
  if (line.cells.length === 0 || same || line.proven === opponent) return [];
  return (await provenWinner([...moves, ...line.cells], radius)) === opponent ? [] : line.cells;
}
// Own CPU process, so the verdict never waits on the GPU, the judge or a bot.
let verdictEngine: EngineProcess | null = null;
const verdictCache = new Map<string, Player | null>();

// Fast check used for blunder calls; the win chance from Six arrives separately.
export async function provenWinner(moves: Array<[number, number]>, radius: number): Promise<Player | null> {
  const game = Game.fromMoves(moves.map(([q, r]) => ({ q, r })), radius);
  if (game.winner) return game.winner;
  const key = `${radius}|${moves.join(' ')}`;
  if (verdictCache.has(key)) return verdictCache.get(key)!;
  // Already cleared by precheckTurn while the player was thinking.
  if (safeTurns.get(`${radius}|${moves.slice(0, turnStart(moves.length)).join(' ')}`) === true) return null;
  const judged = evalCache.get(`${radius}|${newestNetwork() ?? ''}|${moves.join(' ')}`);
  if (judged?.proven) return judged.proven;
  if (!hexbotAvailable()) return null;
  // Same solver budget as the judge so both prove the same wins.
  verdictEngine ??= new EngineProcess(ENGINE_EXE, [], undefined, EVAL_SETUP);
  const { score } = await verdictEngine.search(game.moves, radius, VERDICT_MOVETIME_MS);
  const proven = score === null ? null : evaluationFromScore(score, game.current, 'classic').proven;
  verdictCache.set(key, proven);
  if (verdictCache.size > 2000) verdictCache.delete(verdictCache.keys().next().value!);
  return proven;
}

const safeTurns = new Map<string, boolean>();

// Runs during the player's thinking time. If the opponent has no forced win even after a pass, it has none after
// any turn (your own stones never hurt you), so the verdict for that turn is instant.
export async function precheckTurn(moves: Array<[number, number]>, radius: number): Promise<boolean> {
  const key = `${radius}|${moves.join(' ')}`;
  const known = safeTurns.get(key);
  if (known !== undefined) return known;
  const game = Game.fromMoves(moves.map(([q, r]) => ({ q, r })), radius);
  if (game.winner) return false;
  const idle = idleTurn(game.moves, radius).map((h) => [h.q, h.r] as [number, number]);
  const winner = await provenWinner([...moves, ...idle], radius);
  const safe = winner !== otherPlayer(game.current);
  safeTurns.set(key, safe);
  if (safeTurns.size > 2000) safeTurns.delete(safeTurns.keys().next().value!);
  return safe;
}

export async function botTurn(req: BotTurnRequest): Promise<Hex[]> {
  const hexes = req.moves.map(([q, r]) => ({ q, r }));
  const game = Game.fromMoves(hexes, req.radius);
  if (game.winner) throw new Error('the game is already over');
  if (req.bot === 'hexweb') throw new Error('Six (browser) plays in the browser, not on the server.');
  if (req.bot === 'hexbot' || req.bot === 'hexnet') {
    const chosen = req.bot === 'hexnet' && req.generation !== undefined ? await generationNetwork(req.generation) : undefined;
    const process_ = req.bot === 'hexnet' ? networkEngine(chosen) : (engine ??= new EngineProcess(ENGINE_EXE));
    // Training pauses while someone plays HexBot and resumes a few minutes after.
    markBotGame(RUNS_RL);
    const cells = await process_.bestTurn(hexes, req.radius, HEXBOT_MOVETIME_MS[req.level - 1]!);
    markBotGame(RUNS_RL);
    // Check the engine's moves against our own rules.
    const probe = game.clone();
    for (const c of cells) {
      if (!probe.place(c.q, c.r).ok) throw new Error(`${BOT_META[req.bot].name} proposed an illegal stone.`);
      if (probe.winner) break;
    }
    return cells;
  }
  return chooseTurn(game, { level: req.level });
}
