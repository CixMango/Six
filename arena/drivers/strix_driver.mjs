// Runs Strix (SootyOwl/hexo-strix, MIT) behind the Six engine protocol, using the prebuilt WASM bot
// and weights in the gitignored rivals/strix folder (every file is checked against rivals/SHA256SUMS.txt).
//
//   node arena/drivers/strix_driver.mjs [--sims 64] [--actions 16] [--model default] [--live standard]
//
// Without --live it is Strix's Gumbel MCTS alone. With --live it first runs the forcing layer the
// hexo.tyto.cc bot plays with (own-win solve, then defense), at the given difficulty
// (quick, standard, strong or deep). Strix places one stone per call, so a turn is two calls.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const STATIC = "strix/hexo-a0/src/hexo_a0/serving/static";
const AXES = [[1, 0], [0, 1], [1, -1]];

function option(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

const sims = Number(option("sims", "64"));
const actions = Number(option("actions", "16"));
const model = option("model", "default");
const live = option("live", null);

/** Reads a file under rivals/ after checking it against the pinned checksum. */
function verified(relative) {
  const sums = readFileSync(path.join(ROOT, "rivals", "SHA256SUMS.txt"), "utf8");
  const wanted = `rivals/${relative}`;
  const expected = sums.split(/\r?\n/)
    .map(line => line.trim().split(/\s+/))
    .find(([, file]) => file && file.replaceAll("\\", "/") === wanted)?.[0];
  const bytes = readFileSync(path.join(ROOT, "rivals", relative));
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (!expected || expected !== actual) throw new Error(`checksum mismatch for ${wanted}`);
  return bytes;
}

async function importVerified(relative) {
  verified(relative);
  return import(pathToFileURL(path.join(ROOT, "rivals", relative)).href);
}

const api = await importVerified(`${STATIC}/solver/hexo_wasm.js`);
api.initSync({ module: verified(`${STATIC}/solver/hexo_wasm_bg.wasm`) });
const defense = live ? await importVerified(`${STATIC}/play-defense.js`) : null;
const bot = new api.StrixBot(new Uint8Array(verified(`strix/models/${model}.safetensors`)));
// Training settings arrive as a JSON string; the default model trained at radius 6 but accepts larger radii.
const trained = JSON.parse(JSON.parse(bot.model_info()).game_config ?? "{}");

// Turn structure from the 0-based stone index: X places one stone, then each side places two.
const playerForStone = i => (i === 0 ? 1 : Math.floor((i - 1) / 2) % 2 === 0 ? 2 : 1);
const stonesLeftBefore = i => (i === 0 ? 1 : (i - 1) % 2 === 0 ? 2 : 1);
const distance = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[0] + a[1] - b[0] - b[1]));

function isPlayable(moves, cell, radius) {
  if (moves.some(m => m[0] === cell[0] && m[1] === cell[1])) return false;
  if (moves.length === 0) return distance(cell, [0, 0]) <= radius;
  return moves.some(m => distance(m, cell) <= radius);
}

function makesSix(moves, cell) {
  const owner = playerForStone(moves.length - 1);
  const mine = new Set(moves.filter((_, i) => playerForStone(i) === owner).map(m => `${m[0]},${m[1]}`));
  return AXES.some(([dq, dr]) => {
    let run = 1;
    for (const sign of [1, -1]) {
      for (let k = 1; mine.has(`${cell[0] + sign * dq * k},${cell[1] + sign * dr * k}`); k++) run++;
    }
    return run >= 6;
  });
}

function lexLess(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

function nearestLegal(moves, wanted, radius) {
  let best = null;
  for (const m of moves.length ? moves : [[0, 0]]) {
    for (let dq = -radius; dq <= radius; dq++) {
      for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
        const c = [m[0] + dq, m[1] + dr];
        if (!isPlayable(moves, c, radius)) continue;
        const key = [distance(c, wanted), c[0], c[1]];
        if (!best || lexLess(key, best.key)) best = { cell: c, key };
      }
    }
  }
  return best.cell;
}

/** Strix's position format. It requires X's first stone at the origin, so the game is shifted to put it there. */
function strixPosition(moves, radius) {
  const [oq, or] = moves[0];
  const placements = moves.length - 1;
  return {
    config: { win_length: 6, placement_radius: radius, max_moves: trained.max_moves ?? 300 },
    stones: moves.map(([q, r], i) => ({ q: q - oq, r: r - or, player: playerForStone(i) })),
    to_move: Math.floor(placements / 2) % 2 === 0 ? 2 : 1,
    moves_remaining: placements % 2 === 0 ? 2 : 1,
  };
}

function chooseStone(moves, radius) {
  if (moves.length === 0) return [0, 0];
  const [oq, or] = moves[0];
  const position = strixPosition(moves, radius);
  let pick = null;
  if (defense) {
    const solver = new api.StrixSolver();
    try {
      pick = defense.selectForcingMove({ api, solver, bot, position, difficulty: live });
    } catch (error) {
      process.stderr.write(`forcing layer failed: ${error?.message ?? error}\n`);
      pick = null;
    } finally {
      solver.free();
    }
  }
  if (!pick) pick = JSON.parse(bot.best_move(JSON.stringify(position), sims, actions, 0n)).move;
  return [pick.q + oq, pick.r + or];
}

let radius = 8;
let moves = [];
const send = line => process.stdout.write(`${line}\n`);
const name = `Strix ${model} ${sims} sims${live ? ` live ${live}` : ""}`;

for await (const raw of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
  const words = raw.replace(/^﻿/, "").trim().split(/\s+/);
  const command = words[0];
  try {
    if (command === "six") {
      send(`id name ${name}`);
      send(`id version ${trained.placement_radius != null ? `trained radius ${trained.placement_radius}` : "wasm"}`);
      send("sixok");
    } else if (command === "isready") {
      send("readyok");
    } else if (command === "newgame") {
      defense?.resetPlayDefenseCaches();
    } else if (command === "position") {
      const r = words.indexOf("radius");
      radius = r >= 0 ? Number(words[r + 1]) : 8;
      const m = words.indexOf("moves");
      const numbers = m >= 0 ? words.slice(m + 1).map(Number) : [];
      moves = [];
      for (let i = 0; i + 1 < numbers.length; i += 2) moves.push([numbers[i], numbers[i + 1]]);
    } else if (command === "go") {
      const played = [];
      const line = [...moves];
      const need = stonesLeftBefore(line.length);
      for (let k = 0; k < need; k++) {
        let cell = chooseStone(line, radius);
        if (!isPlayable(line, cell, radius)) {
          const replacement = nearestLegal(line, cell, radius);
          process.stderr.write(`${name} asked for illegal ${cell}; playing ${replacement}\n`);
          cell = replacement;
        }
        line.push(cell);
        played.push(cell);
        if (makesSix(line, cell)) break;
      }
      send(`bestmove ${played.map(c => c.join(" ")).join(" ")}`);
    } else if (command === "quit") {
      break;
    } else if (command) {
      send(`error unknown command ${command}`);
    }
  } catch (error) {
    process.stderr.write(`${error?.stack ?? error}\n`);
    send(`error ${command} failed: ${error?.message ?? error}`);
  }
}
process.exit(0);
