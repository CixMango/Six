import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyRelease, carryOver, findOtherInstalls, isNewer, pickRelease } from '../src/launcher/update.ts';

describe('updater', () => {
  it('compares versions by number', () => {
    expect(isNewer('1.3.0', '1.2.1')).toBe(true);
    expect(isNewer('v1.10.0', '1.9.9')).toBe(true);
    expect(isNewer('1.2.1', '1.2.1')).toBe(false);
    expect(isNewer('1.2.0', '1.2.1')).toBe(false);
    expect(isNewer('2.0', '1.99.99')).toBe(true);
  });

  it("picks this platform's download from the newest release", () => {
    const json = {
      tag_name: 'v1.3.0',
      assets: [
        { name: 'Six-1.3.0-linux-x64.tar.gz', browser_download_url: 'https://x/linux', size: 5 },
        { name: 'Six-1.3.0-windows-x64.zip', browser_download_url: 'https://x/win', size: 7 },
      ],
    };
    expect(pickRelease(json, 'windows-x64.zip')).toEqual({ version: '1.3.0', url: 'https://x/win', name: 'Six-1.3.0-windows-x64.zip', size: 7 });
    expect(pickRelease(json, 'macos-arm64.zip')).toBeNull();
    expect(pickRelease({ ...json, prerelease: true }, 'windows-x64.zip')).toBeNull();
    expect(pickRelease({ message: 'rate limited' }, 'windows-x64.zip')).toBeNull();
  });

  it('finds an older unzipped copy and carries its games, sound and networks over once, overwriting nothing', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'six-carry-'));
    const write = (file: string, text: string) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    };
    // Downloads/Six-1.2.1-windows-x64/Six (old) and Downloads/Six-1.3.0-windows-x64/Six (new).
    const old = path.join(root, 'Six-1.2.1-windows-x64', 'Six');
    const app = path.join(root, 'Six-1.3.0-windows-x64', 'Six');
    write(path.join(old, 'web/src/server/main.mjs'), '');
    write(path.join(old, 'data/replays/a.json'), 'old a');
    write(path.join(old, 'data/replays/b.json'), 'old b');
    write(path.join(old, 'data/sound.json'), '{"host":30}');
    write(path.join(old, 'runs/rl/gen-0300/net.onnx'), 'downloaded');
    write(path.join(app, 'web/src/server/main.mjs'), '');
    write(path.join(app, 'data/replays/b.json'), 'new b');
    write(path.join(app, 'runs/rl/gen-0455/net.onnx'), 'shipped');
    expect(findOtherInstalls([root], app)).toEqual([path.resolve(old)]);
    expect(carryOver(old, app)).toBe(1);
    expect(readFileSync(path.join(app, 'data/replays/a.json'), 'utf8')).toBe('old a');
    expect(readFileSync(path.join(app, 'data/replays/b.json'), 'utf8')).toBe('new b');
    expect(readFileSync(path.join(app, 'data/sound.json'), 'utf8')).toBe('{"host":30}');
    expect(readFileSync(path.join(app, 'runs/rl/gen-0300/net.onnx'), 'utf8')).toBe('downloaded');
  });

  it('replaces the app but keeps saved games and networks', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'six-update-'));
    const write = (file: string, text: string) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    };
    const app = path.join(root, 'app');
    const fresh = path.join(root, 'new');
    write(path.join(app, 'web/old-only.js'), 'old');
    write(path.join(app, 'web/launch.mjs'), 'old launcher');
    write(path.join(app, 'data/replays/game.json'), 'my game');
    write(path.join(app, 'runs/rl/gen-0300/net.onnx'), 'downloaded net');
    write(path.join(app, 'node/node.exe'), 'old node');
    write(path.join(fresh, 'web/launch.mjs'), 'new launcher');
    write(path.join(fresh, 'data/replays/game.json'), 'should not overwrite');
    write(path.join(fresh, 'runs/rl/gen-0480/net.onnx'), 'new net');
    write(path.join(fresh, 'node/node.exe'), 'new node');
    applyRelease(fresh, app, path.join(app, 'node/node.exe'));
    expect(readFileSync(path.join(app, 'web/launch.mjs'), 'utf8')).toBe('new launcher');
    expect(existsSync(path.join(app, 'web/old-only.js'))).toBe(false);
    expect(readFileSync(path.join(app, 'data/replays/game.json'), 'utf8')).toBe('my game');
    expect(readFileSync(path.join(app, 'runs/rl/gen-0300/net.onnx'), 'utf8')).toBe('downloaded net');
    expect(readFileSync(path.join(app, 'runs/rl/gen-0480/net.onnx'), 'utf8')).toBe('new net');
    expect(readFileSync(path.join(app, 'node/node.exe'), 'utf8')).toBe('new node');
    expect(readFileSync(path.join(app, 'node/node.exe.old'), 'utf8')).toBe('old node');
  });
});
