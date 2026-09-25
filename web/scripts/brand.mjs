// Renders the app icon PNGs, a multi-size .ico and the wordmark lockups from the SVG mark via headless Chrome.
// Usage: node scripts/brand.mjs   (needs the dev server on http://localhost:6600)
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';

const BASE = process.env.SIX_URL ?? 'http://localhost:6600';
const OUT = path.resolve(import.meta.dirname, '../public/brand');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = path.join(tmpdir(), `six-brand-${Date.now()}`);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });

let version;
for (let i = 0; i < 50 && !version; i++) {
  try {
    version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
  } catch {
    await wait(200);
  }
}
if (!version) throw new Error('Chrome did not start');

const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((r) => ws.once('open', r));
let id = 1;
const pending = new Map();
ws.on('message', (d) => {
  const m = JSON.parse(String(d));
  const p = pending.get(m.id);
  if (!p) return;
  pending.delete(m.id);
  m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const n = id++;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const s = (m, p) => send(m, p, sessionId);
await s('Page.enable');
await s('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

async function render(html, width, height) {
  await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const { frameTree } = await s('Page.getFrameTree');
  await s('Page.setDocumentContent', { frameId: frameTree.frame.id, html });
  await s('Runtime.evaluate', { expression: 'Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))])', awaitPromise: true });
  await wait(150);
  const { data } = await s('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } });
  return Buffer.from(data, 'base64');
}

const mark = `${BASE}/brand/six-mark.svg`;
const fontFile = path.resolve(import.meta.dirname, '../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2');
const font = `data:font/woff2;base64,${(await readFile(fontFile)).toString('base64')}`;
const page = (body, background = 'transparent') => `<!doctype html><html><head><style>
  @font-face { font-family: 'Archivo Variable'; src: url(${font}) format('woff2-variations'); font-weight: 100 900; font-stretch: 62% 125%; }
  html, body { margin: 0; height: 100%; background: ${background}; }
</style></head><body>${body}</body></html>`;

await mkdir(OUT, { recursive: true });

const pngs = new Map();
for (const size of [...ICO_SIZES, 512]) {
  const png = await render(page(`<img src="${mark}" width="${size}" height="${size}" style="display:block">`), size, size);
  pngs.set(size, png);
  if ([32, 180, 192, 512].includes(size) || size === 256) await writeFile(path.join(OUT, `six-${size}.png`), png);
}
await writeFile(path.join(OUT, 'six-180.png'), await render(page(`<img src="${mark}" width="180" height="180" style="display:block">`), 180, 180));

// Windows .ico with embedded PNG images.
const entries = ICO_SIZES.map((size) => ({ size, data: pngs.get(size) }));
const header = Buffer.alloc(6 + 16 * entries.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(entries.length, 4);
let offset = header.length;
entries.forEach(({ size, data }, i) => {
  const at = 6 + 16 * i;
  header.writeUInt8(size >= 256 ? 0 : size, at);
  header.writeUInt8(size >= 256 ? 0 : size, at + 1);
  header.writeUInt8(0, at + 2);
  header.writeUInt8(0, at + 3);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(data.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += data.length;
});
await writeFile(path.join(OUT, 'six.ico'), Buffer.concat([header, ...entries.map((e) => e.data)]));

// Lockups: transparent, and on the dark background with the game's name.
const lockup = (withTagline) => `
  <div style="display:flex;align-items:center;gap:44px;padding:${withTagline ? '0 90px' : '0 40px'};height:100%;box-sizing:border-box;font-family:'Archivo Variable',sans-serif;color:#f5f7fb">
    <img src="${mark}" width="${withTagline ? 250 : 280}" height="${withTagline ? 250 : 280}">
    <div>
      <div style="font-size:${withTagline ? 230 : 260}px;line-height:.8;font-stretch:62%;font-weight:850;letter-spacing:.05em">SIX</div>
      ${withTagline ? `<div style="margin-top:26px;font-size:40px;font-stretch:80%;font-weight:700;letter-spacing:.14em;color:#b9c2d3">HEX TIC-TAC-TOE</div>` : ''}
    </div>
  </div>`;
await writeFile(path.join(OUT, 'six-logo.png'), await render(page(lockup(false)), 800, 320));
await writeFile(
  path.join(OUT, 'six-card.png'),
  await render(page(lockup(true), 'radial-gradient(120% 90% at 30% 50%, #161c29 0%, #07090e 70%)'), 1200, 630),
);

ws.close();
chrome.kill();
await wait(400);
await rm(profile, { recursive: true, force: true }).catch(() => {});
console.log('brand assets written to', OUT);
