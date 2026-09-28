// The downloaded app's updater: which release is newer, which file is this platform's, and putting a new release's
// files in place of the old ones while keeping the player's saved games and networks.
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

/** True when version `a` (like "1.3.0" or "v1.3.0") is newer than `b`. */
export function isNewer(a: string, b: string): boolean {
  const parts = (v: string) => v.replace(/^v/, '').split(/[.-]/).map((n) => Number.parseInt(n, 10) || 0);
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

export interface Release {
  version: string;
  url: string;
  name: string;
  size: number;
}

/** The newest release's download for this platform (`suffix` like "windows-x64.zip"), from GitHub's release JSON. */
export function pickRelease(json: unknown, suffix: string): Release | null {
  const r = json as { tag_name?: unknown; draft?: unknown; prerelease?: unknown; assets?: unknown };
  if (typeof r?.tag_name !== 'string' || r.draft === true || r.prerelease === true || !Array.isArray(r.assets)) return null;
  const asset = (r.assets as Array<{ name?: unknown; browser_download_url?: unknown; size?: unknown }>).find(
    (a) => typeof a.name === 'string' && a.name.endsWith(suffix) && typeof a.browser_download_url === 'string',
  );
  if (!asset) return null;
  return { version: r.tag_name.replace(/^v/, ''), url: asset.browser_download_url as string, name: asset.name as string, size: Number(asset.size) || 0 };
}

/** Folders the player owns: never replaced. Saved games live in data/; runs/ also holds networks downloaded in the app. */
const KEEP = new Set(['data']);
const MERGE = new Set(['runs']);

/**
 * Puts the unpacked release at `from` in place of the app at `to`. Everything is replaced except data/ (kept) and
 * runs/ (new networks added, the player's own kept). A running executable can't be overwritten on Windows but can be
 * renamed, so `running` (the Node binary in use) is moved aside to `<name>.old` first.
 */
export function applyRelease(from: string, to: string, running: string | null): void {
  for (const entry of readdirSync(from)) {
    const source = path.join(from, entry);
    const target = path.join(to, entry);
    if (KEEP.has(entry)) continue;
    if (MERGE.has(entry)) {
      cpSync(source, target, { recursive: true, force: true });
      continue;
    }
    if (running && statSync(source).isDirectory() && path.resolve(running).startsWith(path.resolve(target) + path.sep)) {
      // The folder holding the running Node: move the binary aside, then copy the new files over.
      if (existsSync(running)) {
        rmSync(`${running}.old`, { force: true });
        renameSync(running, `${running}.old`);
      }
      cpSync(source, target, { recursive: true, force: true });
      continue;
    }
    rmSync(target, { recursive: true, force: true });
    cpSync(source, target, { recursive: true });
  }
}

// SIX_RELEASES_URL points the updater elsewhere, for testing an update without publishing one.
export const RELEASES_URL = process.env.SIX_RELEASES_URL ?? 'https://api.github.com/repos/CixMango/Six/releases/latest';
/** The server exits with this when the player asks to update; the launcher installs the update and starts it again. */
export const UPDATE_EXIT = 75;

/** Folders (up to two levels below each root) that hold another copy of the downloaded app with saved data. */
export function findOtherInstalls(roots: readonly string[], self: string): string[] {
  const found = new Set<string>();
  const isApp = (dir: string) => existsSync(path.join(dir, 'web', 'src', 'server', 'main.mjs')) && existsSync(path.join(dir, 'data'));
  const list = (dir: string) => {
    try {
      return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(dir, d.name));
    } catch {
      return [];
    }
  };
  for (const root of roots) {
    for (const one of list(root)) {
      if (isApp(one)) found.add(path.resolve(one));
      for (const two of list(one)) if (isApp(two)) found.add(path.resolve(two));
    }
  }
  found.delete(path.resolve(self));
  return [...found];
}

/** Copies another install's saved games, sound levels and downloaded networks into this one; nothing is overwritten. */
export function carryOver(from: string, to: string): number {
  let replays = 0;
  const copyMissing = (source: string, target: string) => {
    if (!existsSync(source) || existsSync(target)) return false;
    cpSync(source, target, { recursive: true });
    return true;
  };
  const oldReplays = path.join(from, 'data', 'replays');
  if (existsSync(oldReplays)) {
    mkdirSync(path.join(to, 'data', 'replays'), { recursive: true });
    for (const f of readdirSync(oldReplays)) if (copyMissing(path.join(oldReplays, f), path.join(to, 'data', 'replays', f))) replays++;
  }
  copyMissing(path.join(from, 'data', 'sound.json'), path.join(to, 'data', 'sound.json'));
  const oldRuns = path.join(from, 'runs', 'rl');
  if (existsSync(oldRuns)) {
    for (const gen of readdirSync(oldRuns)) copyMissing(path.join(oldRuns, gen), path.join(to, 'runs', 'rl', gen));
  }
  return replays;
}
