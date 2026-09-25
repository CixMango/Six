import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import { parseClientMessage, type ServerMessage } from '../shared/protocol.ts';
import { validateReplay } from '../shared/replay.ts';
import { availableBots, botTurn, evaluatePosition, generationOf, REVIEW_MS, reviewPosition, listGenerations, newestNetwork, parseBotTurnRequest, precheckTurn, provenWinner } from './bots.ts';
import { localAddresses } from './network.ts';
import { ReplayStore } from './replayStore.ts';
import { importGame, importHexo } from './hexo.ts';
import { RoomManager } from './rooms.ts';
import { TrainingStatus, isLocalAddress } from './training.ts';

const PORT = Number(process.env.SIX_PORT ?? 6600);
const PROD = process.argv.includes('--prod');
const WEB_ROOT = path.resolve(import.meta.dirname, '../..');
const DIST = path.join(WEB_ROOT, 'dist/client');
const DATA_DIR = process.env.SIX_DATA_DIR ?? path.resolve(WEB_ROOT, '../data');
const RUNS_DIR = process.env.SIX_RUNS_DIR ?? path.resolve(WEB_ROOT, '../runs/rl');
const MAX_BODY = 1_000_000;

const replays = new ReplayStore(path.join(DATA_DIR, 'replays'));
// Blunder-sound volumes: one for this PC, one for friends who join.
const SOUND_FILE = path.join(DATA_DIR, 'sound.json');
type Volumes = { host: number; friend: number };

const level = (value: unknown, fallback: number) => {
  const n = Number(value);
  return value !== undefined && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
};

async function soundVolumes(): Promise<Volumes> {
  try {
    const stored = JSON.parse(await readFile(SOUND_FILE, 'utf8')) as { host?: unknown; friend?: unknown; volume?: unknown };
    const host = level(stored.host ?? stored.volume, 0.8);
    return { host, friend: level(stored.friend, host) };
  } catch {
    return { host: 0.8, friend: 0.8 };
  }
}
const rooms = new RoomManager({
  saveReplay: (record) => replays.save(record),
  botTurn: (moves, radius, bot, level) => botTurn({ moves: moves.map((m) => [m.q, m.r]), radius, bot, level }),
  precheck: (moves, radius) => precheckTurn(moves.map((m) => [m.q, m.r]), radius).then(() => undefined),
  // Only waits for the fast verdict, never the network judge.
  judge: async (moves, radius) => {
    const proven = await provenWinner(moves.map((m) => [m.q, m.r]), radius);
    return { winX: proven ? (proven === 'X' ? 1 : 0) : 0.5, proven };
  },
});
const training = new TrainingStatus(RUNS_DIR);

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(text);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new Error('request too large');
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function info() {
  const { hamachi, lan } = localAddresses();
  return {
    name: 'Six',
    port: PORT,
    hamachiUrl: hamachi ? `http://${hamachi}:${PORT}` : null,
    lanUrls: lan.map((ip) => `http://${ip}:${PORT}`),
  };
}

async function api(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const route = `${req.method} ${url.pathname}`;
  try {
    if (route === 'GET /api/info') return sendJson(res, 200, info());
    if (route === 'GET /api/bots') return sendJson(res, 200, availableBots());
    if (route === 'GET /api/generations') {
      return sendJson(res, 200, { generations: listGenerations(), newest: generationOf(newestNetwork()) });
    }
    if (route === 'POST /api/bot/turn') {
      const request = parseBotTurnRequest(await readJson(req));
      return sendJson(res, 200, { cells: await botTurn(request) });
    }
    if (route === 'POST /api/precheck') {
      const request = parseBotTurnRequest({ ...((await readJson(req)) as object), bot: 'rookie', level: 1 });
      return sendJson(res, 200, { safe: await precheckTurn(request.moves, request.radius) });
    }
    if (route === 'POST /api/verdict') {
      const request = parseBotTurnRequest({ ...((await readJson(req)) as object), bot: 'rookie', level: 1 });
      return sendJson(res, 200, { proven: await provenWinner(request.moves, request.radius) });
    }
    if (route === 'POST /api/review/position') {
      const body = (await readJson(req)) as { moves?: unknown; radius?: unknown; movetime?: unknown };
      const request = parseBotTurnRequest({ moves: body.moves, radius: body.radius, bot: 'rookie', level: 1 });
      const movetime = Number(body.movetime ?? 1000);
      if (!Number.isInteger(movetime) || movetime < REVIEW_MS.min || movetime > REVIEW_MS.max) throw new Error('bad movetime');
      return sendJson(res, 200, await reviewPosition(request.moves, request.radius, movetime));
    }
    if (route === 'POST /api/eval') {
      // Same validation as a bot turn request, minus the bot.
      const body = (await readJson(req)) as { keep?: unknown };
      const request = parseBotTurnRequest({ ...body, bot: 'rookie', level: 1 });
      return sendJson(res, 200, await evaluatePosition(request.moves, request.radius, body.keep === true));
    }
    if (route === 'GET /api/sound') {
      // The host sets both; each browser uses its own (host here, friend elsewhere).
      const volumes = await soundVolumes();
      const host = isLocalAddress(req.socket.remoteAddress);
      return sendJson(res, 200, { volume: host ? volumes.host : volumes.friend, ...volumes, canChange: host });
    }
    if (route === 'POST /api/sound') {
      if (!isLocalAddress(req.socket.remoteAddress)) return sendJson(res, 403, { error: 'Only the host can change the sound.' });
      const body = (await readJson(req)) as { host?: unknown; friend?: unknown };
      const current = await soundVolumes();
      const volumes = { host: level(body.host, current.host), friend: level(body.friend, current.friend) };
      await writeFile(SOUND_FILE, JSON.stringify(volumes), 'utf8');
      return sendJson(res, 200, { volume: volumes.host, ...volumes, canChange: true });
    }
    if (route === 'GET /api/training') return sendJson(res, 200, await training.view());
    if (route === 'POST /api/training/pause' || route === 'POST /api/training/pause-apps') {
      if (!isLocalAddress(req.socket.remoteAddress)) return sendJson(res, 403, { error: 'Training can only be changed on this PC.' });
      const body = (await readJson(req)) as { paused?: unknown; apps?: unknown };
      if (route === 'POST /api/training/pause') {
        if (typeof body.paused !== 'boolean') throw new Error('paused must be true or false');
        await training.setPaused(body.paused);
        return sendJson(res, 200, await training.view());
      }
      if (!Array.isArray(body.apps) || !body.apps.every((a) => typeof a === 'string')) throw new Error('apps must be a list of program names');
      await training.setPauseApps(body.apps as string[]);
      return sendJson(res, 200, await training.view());
    }
    if (route === 'GET /api/replays') return sendJson(res, 200, await replays.list());
    if (route === 'POST /api/import/game') {
      const body = (await readJson(req)) as { text?: unknown };
      if (typeof body.text !== 'string') throw new Error('text must be a string');
      return sendJson(res, 200, { id: await importGame(body.text, replays) });
    }
    if (route === 'POST /api/import/hexo') {
      const body = (await readJson(req)) as { link?: unknown };
      if (typeof body.link !== 'string') throw new Error('link must be a HeXO link');
      return sendJson(res, 200, { id: await importHexo(body.link, replays) });
    }
    if (route === 'POST /api/replays') {
      const record = validateReplay(await readJson(req));
      if (record.mode === 'online') throw new Error('online games are saved by the server');
      await replays.save(record);
      return sendJson(res, 201, { id: record.id });
    }
    const match = /^\/api\/replays\/([a-z0-9-]+)$/.exec(url.pathname);
    if (req.method === 'GET' && match) {
      const record = await replays.get(match[1]!);
      return record ? sendJson(res, 200, record) : sendJson(res, 404, { error: 'Replay not found.' });
    }
    return sendJson(res, 404, { error: 'Not found.' });
  } catch (e) {
    return sendJson(res, 400, { error: (e as Error).message });
  }
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

async function serveStatic(res: ServerResponse, url: URL): Promise<void> {
  const requested = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)));
  const inside = requested === DIST || requested.startsWith(DIST + path.sep);
  let file = inside ? requested : path.join(DIST, 'index.html');
  try {
    if (!(await stat(file)).isFile()) file = path.join(DIST, 'index.html');
  } catch {
    file = path.join(DIST, 'index.html');
  }
  const ext = path.extname(file);
  const immutable = file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(file).pipe(res);
}

const server = http.createServer();

const vite = PROD
  ? null
  : await (await import('vite')).createServer({
      root: WEB_ROOT,
      appType: 'spa',
      server: { middlewareMode: true, hmr: { server } },
    });

server.on('request', (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    void api(req, res, url);
  } else if (vite) {
    vite.middlewares(req, res);
  } else {
    void serveStatic(res, url);
  }
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 16_000 });
server.on('upgrade', (req, socket, head) => {
  if (new URL(req.url ?? '/', 'http://localhost').pathname !== '/ws') return;
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

const alive = new WeakMap<WebSocket, boolean>();
wss.on('connection', (ws) => {
  let clientId: string | null = null;
  alive.set(ws, true);
  ws.on('pong', () => alive.set(ws, true));
  const send = (msg: ServerMessage) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };
  ws.on('message', (data) => {
    const msg = parseClientMessage(data.toString());
    if (!msg) return send({ type: 'error', message: 'That message could not be read.' });
    if (msg.type === 'hello') {
      if (clientId && clientId !== msg.clientId) return;
      clientId = msg.clientId;
      return rooms.connect(clientId, msg.name, send);
    }
    if (!clientId) return send({ type: 'error', message: 'Say hello first.' });
    rooms.handle(clientId, msg);
  });
  ws.on('close', () => {
    if (clientId) rooms.disconnect(clientId);
  });
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!alive.get(ws)) {
      ws.terminate();
      continue;
    }
    alive.set(ws, false);
    ws.ping();
  }
}, 30_000).unref();

server.listen(PORT, '0.0.0.0', () => {
  const { hamachiUrl } = info();
  console.log(`\n  Six is running${PROD ? '' : ' (dev mode)'}`);
  console.log(`  On this PC:     http://localhost:${PORT}`);
  console.log(hamachiUrl ? `  Friends (Hamachi): ${hamachiUrl}` : '  Hamachi: not detected');
  console.log(`  Replays saved to ${path.join(DATA_DIR, 'replays')}\n`);
});
