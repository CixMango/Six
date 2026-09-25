// Builds the public static site into web/dist/play (run engine/web/build.sh first to make public/bot).
// Deploy with: npx.cmd wrangler deploy --config deploy/wrangler.jsonc
// ONNX Runtime's .wasm files load from jsDelivr since the largest is over Cloudflare's 25 MiB per-file limit.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const web = path.resolve(import.meta.dirname, '..');
const out = path.join(web, 'dist/play');
const bot = path.join(web, 'public/bot');
const ortVersion = JSON.parse(readFileSync(path.join(web, 'node_modules/onnxruntime-web/package.json'), 'utf8')).version;
const PAGES_FILE_LIMIT = 25 * 1024 * 1024;

for (const file of ['sixbot.mjs', 'sixbot.wasm', 'hexnet.onnx']) {
  if (!existsSync(path.join(bot, file))) throw new Error(`public/bot/${file} is missing: run bash engine/web/build.sh first`);
}

process.env.VITE_ORT_CDN = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ortVersion}/dist/`;
// Each visitor sets their own blunder volume; blunder mode starts off.
process.env.VITE_SOLO_SOUND = '1';
await build({
  root: web,
  configFile: false,
  plugins: [react()],
  publicDir: false,
  build: { outDir: out, emptyOutDir: true, rollupOptions: { input: path.join(web, 'play.html') } },
  worker: { format: 'es' },
});
renameSync(path.join(out, 'play.html'), path.join(out, 'index.html'));
// Vite copies ONNX Runtime's wasm files into assets, but the site loads them from jsDelivr, so drop them.
for (const name of readdirSync(path.join(out, 'assets'))) {
  if (name.startsWith('ort-wasm')) unlinkSync(path.join(out, 'assets', name));
}

mkdirSync(path.join(out, 'bot'), { recursive: true });
for (const file of ['sixbot.mjs', 'sixbot.wasm', 'hexnet.onnx', 'hexnet-fp16.onnx', 'model.json', 'NOTICE.txt']) {
  if (existsSync(path.join(bot, file))) copyFileSync(path.join(bot, file), path.join(out, 'bot', file));
}
copyFileSync(path.join(web, 'public/favicon.svg'), path.join(out, 'favicon.svg'));
// Also served at the root, where the page links to it.
copyFileSync(path.join(bot, 'NOTICE.txt'), path.join(out, 'notice.txt'));

// Hashed assets never change; the engine and network only change on rebuild.
writeFileSync(path.join(out, '_headers'), [
  '/assets/*', '  Cache-Control: public, max-age=31536000, immutable',
  '/bot/*', '  Cache-Control: public, max-age=3600',
  '/notice.txt', '  Cache-Control: no-cache',
  '',
].join('\n'));

const tooBig = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (statSync(full).size > PAGES_FILE_LIMIT) tooBig.push(path.relative(out, full));
  }
};
walk(out);
if (tooBig.length) throw new Error(`over Cloudflare Pages' 25 MiB file limit: ${tooBig.join(', ')}`);
const model = JSON.parse(readFileSync(path.join(out, 'bot/model.json'), 'utf8'));
console.log(`built ${path.relative(web, out)} with generation ${model.generation}'s network (ONNX Runtime Web ${ortVersion} from jsDelivr)`);
