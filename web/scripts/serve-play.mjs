// Serves web/dist/play locally with the same index.html fallback as Cloudflare.
// Usage: node scripts/serve-play.mjs [port]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../dist/play');
const port = Number(process.argv[2] ?? process.env.PORT ?? 6653);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.wasm': 'application/wasm', '.onnx': 'application/octet-stream', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`public build on http://localhost:${port}`));
