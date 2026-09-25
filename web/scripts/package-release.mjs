// Builds the download for this OS: portable Node, the prebuilt app, the server bundled into one file, the engine and
// a trained network. Nothing to install for the user.
//
//   node scripts/package-release.mjs --net ../runs/rl/gen-0455/net.onnx [--version 1.0.0]
//
// Windows needs the DirectML engine first (engine\build.cmd dml); Linux the CUDA one (cmake --preset linux, build).
import { execFileSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const web = path.resolve(import.meta.dirname, '..');
const root = path.resolve(web, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

const windows = process.platform === 'win32';
const net = arg('net');
const version = arg('version', '1.0.0');
if (!net || !existsSync(net)) throw new Error('pass --net path/to/gen-NNNN/net.onnx');
const generation = /gen-(\d{4})/.exec(path.resolve(net))?.[1];
if (!generation) throw new Error('the network path must contain its generation folder, e.g. gen-0455');

const thirdParty = path.join(root, 'engine/third_party');
const ortLinux = path.join(thirdParty, 'onnxruntime-linux-x64-gpu-1.24.4');
const webGpu = path.join(thirdParty, 'ep-webgpu-0.4.0');
const engineDir = path.join(root, windows ? 'engine/build/dml' : 'engine/build/linux');
const engineFiles = windows
  ? ['sixengine.exe', 'onnxruntime.dll', 'onnxruntime_providers_shared.dll', 'DirectML.dll']
  : ['sixengine', ...readdirSync(engineDir).filter((f) => /^libonnxruntime.*\.so/.test(f))];
for (const f of engineFiles) {
  if (!existsSync(path.join(engineDir, f))) throw new Error(`missing ${f}: build the engine first`);
}

const out = path.join(web, 'release', 'Six');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const run = (cmd, args) => execFileSync(cmd, args, { cwd: web, stdio: 'inherit', shell: windows });

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
cpSync(process.execPath, path.join(out, windows ? 'node/node.exe' : 'node/node'));

const licenses = path.join(out, 'licenses');
mkdirSync(licenses, { recursive: true });
cpSync(path.join(root, 'LICENSE'), path.join(out, 'LICENSE.txt'));
const thirdPartyLicenses = windows
  ? [
      ['ort-dml-1.24.4/LICENSE', 'onnxruntime-LICENSE.txt'],
      ['ort-dml-1.24.4/ThirdPartyNotices.txt', 'onnxruntime-ThirdPartyNotices.txt'],
      ['directml-1.15.4/LICENSE.txt', 'DirectML-LICENSE.txt'],
      ['directml-1.15.4/ThirdPartyNotices.txt', 'DirectML-ThirdPartyNotices.txt'],
    ]
  : [
      [path.join(ortLinux, 'LICENSE'), 'onnxruntime-LICENSE.txt'],
      [path.join(ortLinux, 'ThirdPartyNotices.txt'), 'onnxruntime-ThirdPartyNotices.txt'],
      [path.join(webGpu, 'LICENSE'), 'onnxruntime-webgpu-LICENSE.txt'],
      [path.join(webGpu, 'ThirdPartyNotices.txt'), 'onnxruntime-webgpu-ThirdPartyNotices.txt'],
    ];
for (const [from, to] of thirdPartyLicenses) cpSync(path.resolve(thirdParty, from), path.join(licenses, to));
const nodeLicense = await fetch(`https://raw.githubusercontent.com/nodejs/node/${process.version}/LICENSE`);
if (!nodeLicense.ok) throw new Error(`could not fetch the Node.js license (${nodeLicense.status})`);
writeFileSync(path.join(licenses, 'node-LICENSE.txt'), await nodeLicense.text());

if (windows) {
  writeFileSync(path.join(out, 'Start Six.cmd'), `@echo off\r
title Six\r
cd /d "%~dp0"\r
rem Opened from inside the zip, Windows unpacks only this file, so nothing else is next to it.\r
if not exist "%~dp0node\\node.exe" (\r
  echo Six can't find its files. This usually means it was opened from inside the zip.\r
  echo.\r
  echo Right-click the zip, choose "Extract All...", then open the extracted Six folder\r
  echo and double-click "Start Six.cmd" there.\r
  echo.\r
  pause\r
  exit /b 1\r
)\r
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
} else {
  const start = path.join(out, 'start-six.sh');
  writeFileSync(start, `#!/bin/sh
# Starts Six at http://localhost:6600 and opens it in the browser. Ctrl+C stops it.
cd "$(dirname "$0")"
export SIX_ENGINE="$PWD/engine/sixengine"
if curl -s -o /dev/null -m 2 http://localhost:6600/api/info; then
  xdg-open http://localhost:6600 >/dev/null 2>&1 &
  exit 0
fi
(sleep 3 && xdg-open http://localhost:6600 >/dev/null 2>&1) &
echo "Six is running at http://localhost:6600 (Ctrl+C to stop)"
exec ./node/node web/src/server/main.mjs --prod
`);
  chmodSync(start, 0o755);
  chmodSync(path.join(out, 'node/node'), 0o755);
  chmodSync(path.join(out, 'engine/sixengine'), 0o755);
}

const gpu = windows
  ? 'The bot runs on your graphics card (any DirectX 12 GPU: NVIDIA, AMD or Intel)'
  : 'The bot runs on your graphics card: NVIDIA through CUDA when CUDA 12 and cuDNN 9 are installed, otherwise any\nAMD, Intel or NVIDIA card through WebGPU (needs the Vulkan driver, libvulkan1), and on the CPU if neither works (slower)';
writeFileSync(path.join(out, 'README.txt'), `Six ${version}: hex tic-tac-toe with a self-trained bot
https://github.com/CixMango/Six

Start: ${windows
  ? 'extract the zip first (right-click it, Extract All), then double-click "Start Six.cmd"\nin the extracted folder. Your browser opens at http://localhost:6600.\nKeep the black window open while you play; close it to stop Six.'
  : 'run ./start-six.sh. Your browser opens at http://localhost:6600.\nKeep the terminal open while you play; Ctrl+C stops Six.'}

${gpu}, with network generation ${Number(generation)}.
Give it more thinking time on the home screen for stronger play; 10 s or more is well beyond the website.

Friends on your LAN or Hamachi can join by the link Six shows, if your firewall lets port 6600 through.

Saved games go in the "data" folder next to this file.

License: MIT (LICENSE.txt), including the network. Bundled Node.js${windows ? ', ONNX Runtime and DirectML keep their own' : ' and ONNX Runtime keep their own'}
licenses (licenses folder).
`);

const archive = path.join(web, 'release', windows ? `Six-${version}-windows-x64.zip` : `Six-${version}-linux-x64.tar.gz`);
rmSync(archive, { force: true });
if (windows) {
  // Windows' own tar writes zip files (Git's GNU tar doesn't).
  const tar = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
  execFileSync(tar, ['-a', '-c', '-f', archive, 'Six'], { cwd: path.dirname(out), stdio: 'inherit' });
} else {
  execFileSync('tar', ['-czf', archive, 'Six'], { cwd: path.dirname(out), stdio: 'inherit' });
}
console.log(`wrote ${archive}`);
console.log(readdirSync(out).join('  '));
