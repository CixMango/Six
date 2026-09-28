// Starts Six from source with no window: what Six.exe runs when it sits in a checkout of the repo (no bundled Node).
// Like "Start Six.cmd": builds the page, starts the server (output in data/six.log), then opens the browser. If Six is
// already running it just opens the browser. Quit from Settings; it also stops a few minutes after the last tab closes.
import { execFileSync, spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs';
import path from 'node:path';

const web = path.resolve(import.meta.dirname, '..');
const root = path.resolve(web, '..');
const port = Number(process.env.SIX_PORT ?? 6600);
const home = `http://localhost:${port}`;
const data = path.join(root, 'data');
const log = path.join(data, 'six.log');
const windows = process.platform === 'win32';

/** Six itself, or (`target` a file) the loading page, which switches to Six once the server answers. */
function openBrowser(target = home) {
  if (process.env.SIX_NO_BROWSER) return;
  const [cmd, args] = windows ? ['cmd', ['/c', 'start', '', target]] : [process.platform === 'darwin' ? 'open' : 'xdg-open', [target]];
  spawn(cmd, args, { stdio: 'ignore', detached: true, windowsHide: true }).unref();
}

async function up() {
  try {
    return (await fetch(`${home}/api/info`, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
}

if (await up()) {
  openBrowser();
  process.exit(0);
}

// A loading screen straight away: building the page and starting the server take a while.
const loading = path.join(web, 'loading.html');
const showsLoading = existsSync(loading);
if (showsLoading) openBrowser(loading);

mkdirSync(data, { recursive: true });
const out = openSync(log, 'a');
// The page is built fresh each start, as "Start Six.cmd" does.
const npx = windows ? 'npx.cmd' : 'npx';
try {
  execFileSync(npx, ['vite', 'build', '--logLevel', 'warn'], { cwd: web, stdio: ['ignore', out, out], windowsHide: true, shell: windows });
} catch {
  // An old build still works; the log says what failed.
}
const tsx = path.join(web, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const server = spawn(process.execPath, [tsx, 'src/server/main.ts', '--prod'], {
  cwd: web,
  stdio: ['ignore', out, out],
  windowsHide: true,
  env: { ...process.env, SIX_WINDOWLESS: '1', VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' },
});
closeSync(out);
server.on('exit', (code) => process.exit(code ?? 0));
for (let i = 0; i < 120 && !showsLoading; i++) {
  if (await up()) {
    openBrowser();
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}
if (!existsSync(tsx)) process.exit(1);
