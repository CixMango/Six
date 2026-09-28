// The downloaded app's launcher, bundled to web/launch.mjs. "Six" (Six.exe on Windows, start-six.sh, Start Six.command)
// runs it with no window. It opens Six in the browser, starting the server first if it isn't running, and keeps the
// server going: when the app asks to update (exit code UPDATE_EXIT), it installs the newest release and starts again.
// Output goes to data/six.log.
import { execFileSync, spawn } from 'node:child_process';
import { appendFileSync, closeSync, createWriteStream, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { applyRelease, carryOver, findOtherInstalls, isNewer, pickRelease, RELEASES_URL, UPDATE_EXIT, type Release } from './update.ts';

const WEB = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(WEB, '..');
const PORT = Number(process.env.SIX_PORT ?? 6600);
const HOME = `http://localhost:${PORT}`;
const windows = process.platform === 'win32';
const mac = process.platform === 'darwin';
const NODE = path.join(APP, 'node', windows ? 'node.exe' : 'node');
const ENGINE = path.join(APP, 'engine', windows ? 'sixengine.exe' : 'sixengine');
const DATA = path.join(APP, 'data');
const LOG = path.join(DATA, 'six.log');

/** Written by scripts/package-release.mjs. */
const info = JSON.parse(readFileSync(path.join(WEB, 'version.json'), 'utf8')) as { version: string; asset: string };

/** A line in data/six.log, next to the server's own output. */
function note(line: string): void {
  try {
    mkdirSync(DATA, { recursive: true });
    appendFileSync(LOG, `[launcher ${new Date().toISOString()}] ${line}\n`);
  } catch {
    // Nowhere to write; carry on.
  }
}

/** Six itself, or (`target` a file) the loading page, which switches to Six once the server answers. */
function openBrowser(target: string = HOME): void {
  if (process.env.SIX_NO_BROWSER) return; // tests
  const [cmd, args] = windows ? ['cmd', ['/c', 'start', '', target]] : [mac ? 'open' : 'xdg-open', [target]];
  spawn(cmd, args, { stdio: 'ignore', detached: true, windowsHide: true }).unref();
}

const LOADING = path.join(WEB, 'loading.html');

/** A message box, since there's no window to print to. */
function tell(message: string): void {
  if (windows) {
    const text = message.replace(/'/g, "''");
    spawn('powershell', ['-NoProfile', '-Command', `Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${text}', 'Six') | Out-Null`], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } else if (mac) {
    spawn('osascript', ['-e', `display dialog "${message.replace(/"/g, '\\"')}" with title "Six" buttons {"OK"}`], { stdio: 'ignore' });
  } else {
    spawn('zenity', ['--info', '--title=Six', `--text=${message}`], { stdio: 'ignore' }).on('error', () => undefined);
  }
}

async function up(): Promise<boolean> {
  try {
    return (await fetch(`${HOME}/api/info`, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
}

async function waitFor(check: () => Promise<boolean>, ms: number): Promise<boolean> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function newestRelease(): Promise<Release | null> {
  const res = await fetch(RELEASES_URL, { headers: { 'user-agent': 'Six-updater', accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(10_000) });
  return res.ok ? pickRelease(await res.json(), info.asset) : null;
}

/** Saves `url` to `file`, following redirects (GitHub sends downloads elsewhere). Plain http(s) rather than fetch,
 * whose streaming trips an internal assertion when a server closes the connection at the end of a big file. */
function download(url: string, file: string, redirects = 5): Promise<void> {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https:') ? https.get : http.get;
    get(url, { headers: { 'user-agent': 'Six-updater' } }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400 && res.headers.location && redirects > 0) {
        res.resume();
        download(new URL(res.headers.location, url).href, file, redirects - 1).then(resolve, reject);
        return;
      }
      if (status !== 200) {
        res.resume();
        reject(new Error(`the download failed (${status})`));
        return;
      }
      pipeline(res, createWriteStream(file)).then(resolve, reject);
    }).on('error', reject);
  });
}

function unpack(archive: string, into: string): void {
  if (windows) execFileSync(path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe'), ['-xf', archive, '-C', into], { windowsHide: true });
  else if (mac) execFileSync('ditto', ['-x', '-k', archive, into]);
  else execFileSync('tar', ['-xzf', archive, '-C', into]);
}

/** Installed with the setup wizard: keep the version Windows lists under Installed apps current. */
function setInstalledVersion(version: string): void {
  const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{6F1C2B8A-3D4E-4F5A-9B6C-7D8E9F0A1B2C}_is1';
  try {
    execFileSync('reg', ['query', key], { stdio: 'ignore', windowsHide: true });
    execFileSync('reg', ['add', key, '/v', 'DisplayVersion', '/d', version, '/f'], { stdio: 'ignore', windowsHide: true });
  } catch {
    // Not installed with the wizard (an unzipped copy).
  }
}

/** Downloads and installs the newest release. Any failure leaves this version in place. */
async function update(): Promise<void> {
  const work = mkdtempSync(path.join(tmpdir(), 'six-update-'));
  try {
    const release = await newestRelease();
    if (!release || !isNewer(release.version, info.version)) return;
    note(`updating to ${release.version}`);
    const archive = path.join(work, release.name);
    await download(release.url, archive);
    if (release.size && statSync(archive).size !== release.size) throw new Error('the download was cut short');
    unpack(archive, work);
    const unpacked = path.join(work, 'Six');
    if (!existsSync(path.join(unpacked, 'web', 'launch.mjs'))) throw new Error("the download doesn't look like Six");
    applyRelease(unpacked, APP, NODE);
    if (windows) setInstalledVersion(release.version);
    note(`updated to ${release.version}`);
  } catch (e) {
    note(`update failed: ${(e as Error).message}`);
    tell(`Six couldn't update (${(e as Error).message}). It keeps running version ${info.version}.`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function logFile(): number {
  mkdirSync(DATA, { recursive: true });
  // Start fresh once it gets big.
  const flags = existsSync(LOG) && statSync(LOG).size > 2_000_000 ? 'w' : 'a';
  return openSync(LOG, flags);
}

async function serve(openWhenReady: boolean): Promise<void> {
  // The page appears at once (a loading screen) instead of after the server's 5 to 10 seconds of starting.
  const loading = openWhenReady && existsSync(LOADING);
  if (loading) openBrowser(LOADING);
  const out = logFile();
  const started = Date.now();
  // The version comes from version.json each start, so after an update the new server reports the new one.
  const version = (JSON.parse(readFileSync(path.join(WEB, 'version.json'), 'utf8')) as { version: string }).version;
  const server = spawn(NODE, [path.join(WEB, 'src', 'server', 'main.mjs'), '--prod'], {
    cwd: APP,
    stdio: ['ignore', out, out],
    windowsHide: true,
    env: { ...process.env, SIX_ENGINE: ENGINE, SIX_LAUNCHER: '1', SIX_VERSION: version },
  });
  closeSync(out);
  server.on('exit', async (code) => {
    if (code === UPDATE_EXIT) {
      await update();
      await serve(false); // the page that asked reloads by itself once Six is back
      return;
    }
    if (code && Date.now() - started < 15_000) tell(`Six couldn't start. What went wrong is written in ${LOG}`);
    process.exit(code ?? 0);
  });
  if (openWhenReady && !loading && (await waitFor(up, 60_000))) openBrowser();
}

/**
 * Once, on the first start: copy saved games, sound levels and downloaded networks from an older Six on this PC. Before
 * 1.3.0 there were no updates, so a new version was unzipped into a new folder and started empty.
 */
function bringOverOldData(): void {
  const marker = path.join(DATA, '.carried-over');
  if (existsSync(marker)) return;
  try {
    const home = homedir();
    const roots = [
      path.dirname(APP),
      path.dirname(path.dirname(APP)),
      ...['Downloads', 'Desktop', 'Documents', 'OneDrive/Desktop', 'OneDrive/Documents'].map((d) => path.join(home, d)),
    ];
    for (const old of findOtherInstalls(roots, APP)) {
      const games = carryOver(old, APP);
      note(`brought over ${games} saved games from ${old}`);
    }
    mkdirSync(DATA, { recursive: true });
    appendFileSync(marker, `${new Date().toISOString()}\n`);
  } catch (e) {
    note(`couldn't bring over older saved games: ${(e as Error).message}`);
  }
}

// There's no window to show a crash in: write it down and say so.
process.on('uncaughtException', (e) => {
  note(`launcher crashed: ${e.stack ?? e.message}`);
  tell(`Six stopped unexpectedly. What went wrong is written in ${LOG}`);
  setTimeout(() => process.exit(1), 2000);
});

async function main(): Promise<void> {
  // Left over from the last update (Windows can't delete a running program, only rename it).
  rmSync(`${NODE}.old`, { force: true });
  if (await up()) {
    openBrowser();
    return;
  }
  note(`starting Six ${info.version}`);
  bringOverOldData();
  await serve(true);
}

void main();
