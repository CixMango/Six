// Builds the Windows download: portable Node, the prebuilt app, the server bundled into one file, the DirectML engine
// and a trained network. Nothing to install for the user.
//
//   node scripts/package-release.mjs --net ../runs/rl/gen-0455/net.onnx [--version 1.0.0]
//
// Needs the DirectML engine first: engine\build.cmd dml
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const web = path.resolve(import.meta.dirname, '..');
const root = path.resolve(web, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

const net = arg('net');
const version = arg('version', '1.0.0');
if (!net || !existsSync(net)) throw new Error('pass --net path/to/gen-NNNN/net.onnx');
const generation = /gen-(\d{4})/.exec(path.resolve(net))?.[1];
if (!generation) throw new Error('the network path must contain its generation folder, e.g. gen-0455');
const engineDir = path.join(root, 'engine/build/dml');
const engineFiles = ['sixengine.exe', 'onnxruntime.dll', 'onnxruntime_providers_shared.dll', 'DirectML.dll'];
for (const f of engineFiles) {
  if (!existsSync(path.join(engineDir, f))) throw new Error(`missing ${f}: run engine\\build.cmd dml first`);
}

const out = path.join(web, 'release', 'Six');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const run = (cmd, args) => execFileSync(cmd, args, { cwd: web, stdio: 'inherit', shell: process.platform === 'win32' });

// Same layout as the repo (web/src/server, web/dist/client, runs/rl), so the server finds everything by default.
run('npx', ['vite', 'build', '--logLevel', 'warn']);
cpSync(path.join(web, 'dist/client'), path.join(out, 'web/dist/client'), { recursive: true });
// Personal sound clip, never redistributed.
rmSync(path.join(out, 'web/dist/client/sounds/blunder.mp3'), { force: true });

const { build } = await import('esbuild');
await build({
  entryPoints: [path.join(web, 'src/server/main.ts')],
  outfile: path.join(out, 'web/src/server/main.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  // Vite is only loaded in dev mode; the release always runs with --prod.
  external: ['bufferutil', 'utf-8-validate', 'vite'],
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning',
});

mkdirSync(path.join(out, 'engine'), { recursive: true });
for (const f of engineFiles) cpSync(path.join(engineDir, f), path.join(out, 'engine', f));
mkdirSync(path.join(out, `runs/rl/gen-${generation}`), { recursive: true });
cpSync(net, path.join(out, `runs/rl/gen-${generation}/net.onnx`));

mkdirSync(path.join(out, 'node'), { recursive: true });
cpSync(process.execPath, path.join(out, 'node/node.exe'));

const licenses = path.join(out, 'licenses');
mkdirSync(licenses, { recursive: true });
cpSync(path.join(root, 'LICENSE'), path.join(out, 'LICENSE.txt'));
const thirdParty = path.join(root, 'engine/third_party');
for (const [from, to] of [
  ['ort-dml-1.24.4/LICENSE', 'onnxruntime-LICENSE.txt'],
  ['ort-dml-1.24.4/ThirdPartyNotices.txt', 'onnxruntime-ThirdPartyNotices.txt'],
  ['directml-1.15.4/LICENSE.txt', 'DirectML-LICENSE.txt'],
  ['directml-1.15.4/ThirdPartyNotices.txt', 'DirectML-ThirdPartyNotices.txt'],
]) cpSync(path.join(thirdParty, from), path.join(licenses, to));
const nodeLicense = await fetch(`https://raw.githubusercontent.com/nodejs/node/${process.version}/LICENSE`);
if (!nodeLicense.ok) throw new Error(`could not fetch the Node.js license (${nodeLicense.status})`);
writeFileSync(path.join(licenses, 'node-LICENSE.txt'), await nodeLicense.text());

writeFileSync(path.join(out, 'Start Six.cmd'), `@echo off\r
title Six\r
cd /d "%~dp0"\r
set "SIX_ENGINE=%~dp0engine\\sixengine.exe"\r
curl -s -o nul -m 2 http://localhost:6600/api/info && (\r
  start "" http://localhost:6600\r
  exit /b 0\r
)\r
start "" cmd /c "timeout /t 3 >nul & start http://localhost:6600"\r
echo Six is running at http://localhost:6600\r
echo Keep this window open while you play. Close it to stop Six.\r
"%~dp0node\\node.exe" "%~dp0web\\src\\server\\main.mjs" --prod\r
if errorlevel 1 pause\r
`);

writeFileSync(path.join(out, 'README.txt'), `Six ${version}: hex tic-tac-toe with a self-trained bot
https://github.com/CixMango/Six

Start: double-click "Start Six.cmd". Your browser opens at http://localhost:6600.
Keep the black window open while you play; close it to stop Six.

The bot runs on your graphics card (any DirectX 12 GPU: NVIDIA, AMD or Intel) with network generation ${Number(generation)}.
Give it more thinking time on the home screen for stronger play; 10 s or more is well beyond the website.

The first time, Windows may ask whether Node.js can use the network. Allow it if you want to play friends on
your LAN or Hamachi; otherwise Six still works on this PC.

Saved games go in the "data" folder next to this file.

License: MIT (LICENSE.txt), including the network. Bundled Node.js, ONNX Runtime and DirectML keep their own
licenses (licenses folder).
`);

const zip = path.join(web, 'release', `Six-${version}-windows-x64.zip`);
rmSync(zip, { force: true });
// Windows' own tar writes zip files (Git's GNU tar doesn't).
const tar = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
execFileSync(tar, ['-a', '-c', '-f', zip, 'Six'], { cwd: path.dirname(out), stdio: 'inherit' });
console.log(`wrote ${zip}`);
console.log(readdirSync(out).join('  '));
