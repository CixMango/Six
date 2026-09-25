// Screenshots the app with headless Chrome over the DevTools protocol.
// Usage: node scripts/capture.mjs [outDir] [--training] [--empty]
// Runs its own server on a spare port with a temp replay folder seeded from test/fixtures/replays.
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';

const args = process.argv.slice(2);
const EMPTY = args.includes('--empty');
// --training: only the training dashboard, running (fixture history) and not started.
const TRAINING = args.includes('--training');
const outDir = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'captures');
const WEB = path.resolve(import.meta.dirname, '..');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const SERVER_PORT = 6650;
const base = `http://localhost:${SERVER_PORT}`;

const dataDir = path.join(tmpdir(), `six-capture-data-${Date.now()}`);
const runsDir = path.join(dataDir, 'runs');
if (TRAINING) {
  await cp(path.join(WEB, 'test/fixtures/training'), runsDir, { recursive: true });
  // Touch the log so the fixture loop reads as running.
  await writeFile(path.join(runsDir, 'log.txt'), (await import('node:fs')).readFileSync(path.join(runsDir, 'log.txt')));
}
// --empty: first-run state with no saved games.
if (!EMPTY) await cp(path.join(WEB, 'test/fixtures/replays'), path.join(dataDir, 'replays'), { recursive: true });
const server = spawn(process.execPath, [path.join(WEB, 'node_modules/tsx/dist/cli.mjs'), 'src/server/main.ts'], {
  cwd: WEB,
  env: { ...process.env, SIX_PORT: String(SERVER_PORT), SIX_DATA_DIR: dataDir, SIX_RUNS_DIR: runsDir, VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
  stdio: 'ignore',
});
for (let i = 0; i < 100; i++) {
  try {
    if ((await fetch(`${base}/api/info`)).ok) break;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}

const desktop = { width: 1440, height: 900, mobile: false };
const phone = { width: 390, height: 844, mobile: true };

const replays = await (await fetch(`${base}/api/replays`)).json();
const won = replays.find((r) => r.reason === 'six');

const emptyShots = [
  { name: 'home-empty-desktop', url: '/', view: desktop, settle: 3000 },
  { name: 'replays-empty-desktop', url: '/replays', view: desktop, settle: 1500 },
  { name: 'replays-empty-mobile', url: '/replays', view: phone, settle: 1500 },
];

// Rewrites the newest fixture result so the other result states can be captured too.
const setNewestResult = async (bout) => {
  const file = path.join(runsDir, 'state.json');
  const state = JSON.parse(await readFile(file, 'utf8'));
  state.history.at(-1).evaluation.vsPrevious = bout;
  await writeFile(file, JSON.stringify(state, null, 2));
};

const trainingShots = [
  { name: 'training-desktop', url: '/training', view: desktop, settle: 2500, fullPage: true },
  { name: 'training-mobile', url: '/training', view: phone, settle: 2500, fullPage: true },
  {
    name: 'training-weaker-paused-desktop', url: '/training', view: desktop, settle: 2500,
    prepare: async () => {
      await setNewestResult({ wins: 12, losses: 28, elo: -143, eloLow: -250, eloHigh: -44 });
      await writeFile(path.join(runsDir, 'PAUSE'), 'paused for a capture\n');
    },
  },
  {
    name: 'training-even-stalled-mobile', url: '/training', view: phone, settle: 2500,
    prepare: async () => {
      await rm(path.join(runsDir, 'PAUSE'), { force: true });
      await setNewestResult({ wins: 21, losses: 19, elo: 17, eloLow: -75, eloHigh: 110 });
      const twoHoursAgo = new Date(Date.now() - 2 * 3600_000);
      await utimes(path.join(runsDir, 'log.txt'), twoHoursAgo, twoHoursAgo);
    },
  },
];

const shots = TRAINING ? trainingShots : EMPTY ? emptyShots : [
  { name: 'desktop', url: '/', view: desktop, settle: 12000 },
  { name: 'mobile', url: '/', view: phone, settle: 12000 },
  { name: 'bot-desktop', url: '/bot?side=O&level=3&radius=9', view: desktop, settle: 3000 },
  { name: 'bot-mobile', url: '/bot?side=O&level=3&radius=9', view: phone, settle: 3000 },
  { name: 'watch-desktop', url: '/watch?x=5&o=3&radius=9', view: desktop, settle: 16000 },
  { name: 'watch-mobile', url: '/watch?x=5&o=3&radius=9', view: phone, settle: 16000 },
  ...(won
    ? [
        { name: 'analysis-desktop', url: `/analysis/${won.id}`, view: desktop, settle: 2500 },
        { name: 'analysis-mobile', url: `/analysis/${won.id}`, view: phone, settle: 2500 },
      ]
    : []),
  { name: 'replays-desktop', url: '/replays', view: desktop, settle: 1500 },
  { name: 'replays-mobile', url: '/replays', view: phone, settle: 1500 },
  { name: 'room-waiting-desktop', url: '/room/new?side=X&radius=9', view: desktop, settle: 2500, name_: 'Levi' },
  { name: 'room-waiting-mobile', url: '/room/new?side=X&radius=9', view: phone, settle: 2500, name_: 'Levi' },
  { name: 'result-desktop', url: '/bot?side=X&level=3&radius=9', view: desktop, settle: 1500, resign: true },
  { name: 'result-mobile', url: '/bot?side=X&level=3&radius=9', view: phone, settle: 1500, resign: true },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = path.join(tmpdir(), `six-capture-${Date.now()}`);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });

let version;
for (let i = 0; i < 50 && !version; i++) {
  try {
    version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
  } catch {
    await wait(200);
  }
}
if (!version) throw new Error('Chrome did not start');

const browser = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((r) => browser.once('open', r));
let nextId = 1;
const pending = new Map();
browser.on('message', (data) => {
  const msg = JSON.parse(String(data));
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    browser.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

await mkdir(outDir, { recursive: true });
for (const shot of shots) {
  await shot.prepare?.();
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Emulation.setDeviceMetricsOverride', { width: shot.view.width, height: shot.view.height, deviceScaleFactor: 1, mobile: shot.view.mobile });
  if (shot.view.mobile) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  // Freeze entrance motion so captures show settled layouts.
  await s('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      ${shot.name_ ? `localStorage.setItem('six.name', ${JSON.stringify(shot.name_)});` : `localStorage.removeItem('six.name');`}
      document.addEventListener('DOMContentLoaded', () => {
        const st = document.createElement('style');
        st.textContent = '*,*::before,*::after{animation-duration:1ms!important;animation-delay:0s!important;transition-duration:1ms!important}';
        document.head.appendChild(st);
      });`,
  });
  await s('Page.navigate', { url: base + shot.url });
  await wait(shot.settle);
  if (shot.resign) {
    await s('Runtime.evaluate', {
      expression: `(async () => {
        const c = document.querySelector('canvas'); const r = c.getBoundingClientRect();
        const opts = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 };
        c.dispatchEvent(new PointerEvent('pointerdown', opts));
        c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
        await new Promise((z) => setTimeout(z, 2500));
        document.querySelector('[aria-label="Resign"]').click();
        await new Promise((z) => setTimeout(z, 300));
        [...document.querySelectorAll('.lower-third button')].find((b) => b.textContent === 'Resign').click();
      })()`,
      awaitPromise: true,
    });
    await wait(1500);
  }
  if (shot.fullPage) {
    // .library scrolls internally, so grow the viewport to its full height.
    const { result } = await s('Runtime.evaluate', { expression: 'document.querySelector(".library")?.scrollHeight ?? 0', returnByValue: true });
    const height = Math.min(6000, Math.max(shot.view.height, Number(result.value)));
    await s('Emulation.setDeviceMetricsOverride', { width: shot.view.width, height, deviceScaleFactor: 1, mobile: shot.view.mobile });
    await wait(600);
  }
  const { data } = await s('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(outDir, `${shot.name}.png`), Buffer.from(data, 'base64'));
  console.log('captured', shot.name);
  await send('Target.closeTarget', { targetId });
}

browser.close();
chrome.kill();
server.kill();
await wait(500);
await rm(profile, { recursive: true, force: true }).catch(() => {});
await rm(dataDir, { recursive: true, force: true }).catch(() => {});
