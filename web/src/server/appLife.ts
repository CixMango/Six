// The downloaded app runs with no window (started by web/launch.mjs, which sets SIX_LAUNCHER). So the page offers
// updates, has a Quit button, and the server stops by itself once nobody has had Six open for a while.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isNewer, pickRelease, RELEASES_URL, UPDATE_EXIT } from '../launcher/update.ts';

export const LAUNCHED = process.env.SIX_LAUNCHER === '1';
/** No window to close: the downloaded app, or a copy from source started by Six.exe (SIX_WINDOWLESS; no updates). */
export const WINDOWLESS = LAUNCHED || process.env.SIX_WINDOWLESS === '1';
export const VERSION: string =
  process.env.SIX_VERSION ??
  (() => {
    try {
      return (JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf8')) as { version: string }).version;
    } catch {
      return '0.0.0';
    }
  })();

/** This platform's download name ends with this (matches scripts/package-release.mjs). */
const ASSET = process.platform === 'win32' ? 'windows-x64.zip' : process.platform === 'darwin' ? 'macos-arm64.zip' : 'linux-x64.tar.gz';

let latest: string | null = null;

/** Looks up the newest release once at startup (only for the downloaded app). */
export async function checkForUpdate(): Promise<void> {
  if (!LAUNCHED) return;
  try {
    const res = await fetch(RELEASES_URL, { headers: { 'user-agent': 'Six', accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(10_000) });
    const release = res.ok ? pickRelease(await res.json(), ASSET) : null;
    latest = release && isNewer(release.version, VERSION) ? release.version : null;
  } catch {
    latest = null;
  }
}

export function updateView(): { current: string; latest: string | null } {
  return { current: VERSION, latest: LAUNCHED ? latest : null };
}

/** Hands over to the launcher: it installs the update and starts Six again. */
export function exitForUpdate(): void {
  setTimeout(() => process.exit(UPDATE_EXIT), 300);
}

export function quit(): void {
  setTimeout(() => process.exit(0), 300);
}

/** With no window to close, the server stops once no page has been open for this long. */
const IDLE_QUIT_MS = 5 * 60_000;
let lastSeen = Date.now();

export function touch(): void {
  lastSeen = Date.now();
}

/** `openSockets` counts live connections (rooms, friends); pages also check in every minute while open. */
export function quitWhenIdle(openSockets: () => number): void {
  if (!WINDOWLESS) return;
  setInterval(() => {
    if (openSockets() > 0) touch();
    else if (Date.now() - lastSeen > IDLE_QUIT_MS) process.exit(0);
  }, 30_000).unref();
}

/** The downloaded app's folder (web/ is inside it) and its start file. */
const APP_DIR = path.resolve(import.meta.dirname, '../../..');

/** Puts a "Six" shortcut on the desktop that starts the app like its own start file does. */
export async function createDesktopShortcut(): Promise<void> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const { chmod, writeFile } = await import('node:fs/promises');
  const { homedir } = await import('node:os');
  if (process.platform === 'win32') {
    const exe = path.join(APP_DIR, 'Six.exe');
    // The desktop may be redirected (OneDrive), so ask Windows where it is.
    const script = [
      `$desktop = [Environment]::GetFolderPath('Desktop')`,
      `$link = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desktop 'Six.lnk'))`,
      `$link.TargetPath = '${exe.replace(/'/g, "''")}'`,
      `$link.WorkingDirectory = '${APP_DIR.replace(/'/g, "''")}'`,
      `$link.IconLocation = '${exe.replace(/'/g, "''")},0'`,
      `$link.Description = 'Six: hex tic-tac-toe'`,
      '$link.Save()',
    ].join('; ');
    await run('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true });
  } else if (process.platform === 'darwin') {
    // Installed: Six.app/Contents/Resources/Six. Unzipped: the folder with Start Six.command.
    const bundle = path.resolve(APP_DIR, '../../..');
    const start = bundle.endsWith('.app') ? bundle : path.join(APP_DIR, 'Start Six.command');
    await run('osascript', ['-e', `tell application "Finder" to make alias file to (POSIX file "${start}") at desktop`]);
  } else {
    const file = path.join(homedir(), 'Desktop', 'six.desktop');
    await writeFile(
      file,
      [
        '[Desktop Entry]',
        'Type=Application',
        'Name=Six',
        'Comment=Hex tic-tac-toe',
        // The package's "six" command, or the unzipped download's start file.
        existsSync('/usr/bin/six') ? 'Exec=six' : `Exec="${path.join(APP_DIR, 'start-six.sh')}"`,
        `Icon=${path.join(APP_DIR, 'web/dist/client/brand/six-256.png')}`,
        'Terminal=false',
        '',
      ].join('\n'),
    );
    await chmod(file, 0o755);
  }
}
