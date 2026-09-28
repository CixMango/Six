// Builds the download for this OS: portable Node, the prebuilt app, the server bundled into one file, the engine and
// a trained network. Nothing to install for the user.
//
//   node scripts/package-release.mjs --net ../runs/rl/gen-0455/net.onnx [--version 1.0.0]
//
// Build the engine first: Windows engine\build.cmd dml, Linux cmake --preset linux, macOS cmake --preset mac.
import { execFileSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const web = path.resolve(import.meta.dirname, '..');
const root = path.resolve(web, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

const os = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux';
const windows = os === 'windows';
const net = arg('net');
const version = arg('version', '1.0.0');
if (!net || !existsSync(net)) throw new Error('pass --net path/to/gen-NNNN/net.onnx');
const generation = /gen-(\d{4})/.exec(path.resolve(net))?.[1];
if (!generation) throw new Error('the network path must contain its generation folder, e.g. gen-0455');

const thirdParty = path.join(root, 'engine/third_party');
const webGpu = path.join(thirdParty, 'ep-webgpu-0.4.0');
const platform = {
  windows: {
    engineDir: 'engine/build/dml',
    libraries: /^(onnxruntime(_providers_shared)?|DirectML)\.dll$/,
    engine: 'sixengine.exe',
    node: 'node/node.exe',
    licenses: [
      ['ort-dml-1.24.4/LICENSE', 'onnxruntime-LICENSE.txt'],
      ['ort-dml-1.24.4/ThirdPartyNotices.txt', 'onnxruntime-ThirdPartyNotices.txt'],
      ['directml-1.15.4/LICENSE.txt', 'DirectML-LICENSE.txt'],
      ['directml-1.15.4/ThirdPartyNotices.txt', 'DirectML-ThirdPartyNotices.txt'],
    ],
    archive: `Six-${version}-windows-x64.zip`,
    gpu: 'The bot runs on your graphics card (any DirectX 12 GPU: NVIDIA, AMD or Intel)',
    start: 'extract the zip first (right-click it, Extract All), then double-click "Six" in the extracted folder.\nYour browser opens at http://localhost:6600 and nothing else opens. To stop Six, use Quit in Settings\n(it also stops by itself a few minutes after you close the tab).',
  },
  linux: {
    engineDir: 'engine/build/linux',
    libraries: /^libonnxruntime.*\.so/,
    engine: 'sixengine',
    node: 'node/node',
    licenses: [
      ['onnxruntime-linux-x64-gpu-1.24.4/LICENSE', 'onnxruntime-LICENSE.txt'],
      ['onnxruntime-linux-x64-gpu-1.24.4/ThirdPartyNotices.txt', 'onnxruntime-ThirdPartyNotices.txt'],
      [path.join(webGpu, 'LICENSE'), 'onnxruntime-webgpu-LICENSE.txt'],
      [path.join(webGpu, 'ThirdPartyNotices.txt'), 'onnxruntime-webgpu-ThirdPartyNotices.txt'],
    ],
    archive: `Six-${version}-linux-x64.tar.gz`,
    gpu: 'The bot runs on your graphics card: NVIDIA through CUDA when CUDA 12 and cuDNN 9 are installed, otherwise any\nAMD, Intel or NVIDIA card through WebGPU (needs the Vulkan driver, libvulkan1), and on the CPU if neither works (slower)',
    start: 'run ./start-six.sh. Six starts in the background and your browser opens at http://localhost:6600.\nTo stop Six, use Quit in Settings (it also stops by itself a few minutes after you close the tab).',
  },
  mac: {
    engineDir: 'engine/build/mac',
    libraries: /^libonnxruntime.*\.dylib$/,
    engine: 'sixengine',
    node: 'node/node',
    licenses: [
      ['onnxruntime-osx-arm64-1.24.4/LICENSE', 'onnxruntime-LICENSE.txt'],
      ['onnxruntime-osx-arm64-1.24.4/ThirdPartyNotices.txt', 'onnxruntime-ThirdPartyNotices.txt'],
      [path.join(webGpu, 'LICENSE'), 'onnxruntime-webgpu-LICENSE.txt'],
      [path.join(webGpu, 'ThirdPartyNotices.txt'), 'onnxruntime-webgpu-ThirdPartyNotices.txt'],
    ],
    archive: `Six-${version}-macos-arm64.zip`,
    gpu: 'The bot runs on the Mac\'s GPU through WebGPU (Metal), and on the CPU if that fails. Apple Silicon (M1 or newer) only',
    start: 'double-click the zip to unpack it, then right-click "Start Six.command" and choose Open (the first time\nmacOS asks because the app isn\'t from the App Store). Your browser opens at http://localhost:6600.\nSix runs in the background: to stop it, use Quit in Settings (it also stops by itself a few minutes after\nyou close the tab).',
  },
}[os];

const engineDir = path.join(root, platform.engineDir);
const engineFiles = [platform.engine, ...readdirSync(engineDir).filter((f) => platform.libraries.test(f))];
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
// The launcher ("Six" runs it with no window) and the version it checks for updates against.
await build({
  entryPoints: [path.join(web, 'src/launcher/launch.ts')],
  outfile: path.join(out, 'web/launch.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  logLevel: 'warning',
});
// Shown the moment Six is opened, until the server is up.
cpSync(path.join(web, 'loading.html'), path.join(out, 'web/loading.html'));
const asset = platform.archive.slice(`Six-${version}-`.length);
writeFileSync(path.join(out, 'web/version.json'), `${JSON.stringify({ version, asset })}\n`);

mkdirSync(path.join(out, 'engine'), { recursive: true });
for (const f of engineFiles) cpSync(path.join(engineDir, f), path.join(out, 'engine', f));
mkdirSync(path.join(out, `runs/rl/gen-${generation}`), { recursive: true });
cpSync(net, path.join(out, `runs/rl/gen-${generation}/net.onnx`));

mkdirSync(path.join(out, 'node'), { recursive: true });
cpSync(process.execPath, path.join(out, platform.node));

const licenses = path.join(out, 'licenses');
mkdirSync(licenses, { recursive: true });
cpSync(path.join(root, 'LICENSE'), path.join(out, 'LICENSE.txt'));
for (const [from, to] of platform.licenses) cpSync(path.resolve(thirdParty, from), path.join(licenses, to));
const nodeLicense = await fetch(`https://raw.githubusercontent.com/nodejs/node/${process.version}/LICENSE`);
if (!nodeLicense.ok) throw new Error(`could not fetch the Node.js license (${nodeLicense.status})`);
writeFileSync(path.join(licenses, 'node-LICENSE.txt'), await nodeLicense.text());

if (windows) {
  // Six.exe (engine/tools/launcher.cpp) starts everything with no window.
  const launcher = path.join(engineDir, 'Six.exe');
  if (!existsSync(launcher)) throw new Error('missing Six.exe: build the engine first (engine\\build.cmd dml)');
  cpSync(launcher, path.join(out, 'Six.exe'));
} else {
  const mac = os === 'mac';
  const start = path.join(out, mac ? 'Start Six.command' : 'start-six.sh');
  // The launcher keeps running in the background (it opens the browser); this script returns at once.
  writeFileSync(start, `#!/bin/sh
# Starts Six in the background and opens it at http://localhost:6600. Quit it from Settings in the app; it also stops
# by itself a few minutes after the last tab closes.
cd "$(dirname "$0")"
${mac ? '# Downloaded files are quarantined; once this script is allowed to run, clear the flag on the rest.\nxattr -dr com.apple.quarantine . 2>/dev/null\n' : ''}nohup ./node/node web/launch.mjs >/dev/null 2>&1 &
${mac ? `# Nothing to watch here: close this Terminal window.
(sleep 1; osascript -e 'tell application "Terminal" to close (every window whose name contains "Start Six")' >/dev/null 2>&1) &
` : ''}exit 0
`);
  chmodSync(start, 0o755);
  chmodSync(path.join(out, 'node/node'), 0o755);
  chmodSync(path.join(out, 'engine/sixengine'), 0o755);
}

writeFileSync(path.join(out, 'README.txt'), `Six ${version}: hex tic-tac-toe with a self-trained bot
https://github.com/CixMango/Six

Start: ${platform.start}

${platform.gpu}, with network generation ${Number(generation)}.
Give it more thinking time on the home screen for stronger play; 10 s or more is well beyond the website.

Friends on your LAN or Hamachi can join by the link Six shows, if your firewall lets port 6600 through.

Saved games go in the "data" folder next to this file (with six.log, if something goes wrong).
Each time Six opens it checks for a new version and offers to update; your saved games are kept.

License: MIT (LICENSE.txt), including the network. The bundled Node.js, ONNX Runtime${windows ? ' and DirectML' : ''} keep their own
licenses (licenses folder).
`);

const archive = path.join(web, 'release', platform.archive);
rmSync(archive, { force: true });
if (windows) {
  // Windows' own tar writes zip files (Git's GNU tar doesn't).
  const tar = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
  execFileSync(tar, ['-a', '-c', '-f', archive, 'Six'], { cwd: path.dirname(out), stdio: 'inherit' });
} else if (os === 'mac') {
  // ditto keeps the executable bits that Finder's unzip needs.
  execFileSync('ditto', ['-c', '-k', '--keepParent', 'Six', archive], { cwd: path.dirname(out), stdio: 'inherit' });
} else {
  execFileSync('tar', ['-czf', archive, 'Six'], { cwd: path.dirname(out), stdio: 'inherit' });
}
console.log(`wrote ${archive}`);
console.log(readdirSync(out).join('  '));
