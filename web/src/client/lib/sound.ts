// Sound effects, synthesized with the Web Audio API so there are no audio files to ship.

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

/** Soft-clipping curve for the horn's rasp. */
function rasp(amount: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  return curve;
}

// The host's volume is stored on the server (/api/sound) and applies to every browser at the table.
// The cached value is used right away and refreshed in the background.
let volume = 0.8;
let fetchedAt = 0;
/** Without a host (public site) the volume is per browser. */
const LOCAL_KEY = 'six.blunderVolume';
const LOCAL_DEFAULT = 0.1;

function localVolume(): number {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    const n = Number(stored);
    return stored !== null && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : LOCAL_DEFAULT;
  } catch {
    return LOCAL_DEFAULT;
  }
}

export const soloSound = import.meta.env.VITE_SOLO_SOUND === '1';
if (soloSound) volume = localVolume();

export function blunderVolume(): number {
  return volume;
}

export interface SoundSettings {
  /** This browser's volume: the host's on the host's PC, the friend's anywhere else. */
  volume: number;
  host: number;
  friend: number;
  /** Only the host's PC may change them. */
  canChange: boolean;
}

export async function loadBlunderVolume(): Promise<SoundSettings> {
  if (soloSound) {
    volume = localVolume();
    return { volume, host: volume, friend: volume, canChange: true };
  }
  try {
    const res = await fetch('/api/sound');
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as SoundSettings;
    volume = body.volume;
    fetchedAt = Date.now();
    return body;
  } catch {
    return { volume, host: volume, friend: volume, canChange: false }; // no server (public site)
  }
}

export async function setBlunderVolume(next: { host?: number; friend?: number }): Promise<void> {
  if (next.host !== undefined) volume = Math.min(1, Math.max(0, next.host));
  if (soloSound) {
    try {
      localStorage.setItem(LOCAL_KEY, String(volume));
    } catch {
      // Private windows may block storage; the volume holds for this visit.
    }
    return;
  }
  await fetch('/api/sound', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
}

/** Optional custom clip; falls back to the synthesized horn. */
const BLUNDER_FILE = '/sounds/blunder.mp3';
let blunderClip: Promise<AudioBuffer | null> | null = null;

function loadClip(ctx: AudioContext): Promise<AudioBuffer | null> {
  // The public site always uses the synthesized horn.
  if (soloSound) return Promise.resolve(null);
  blunderClip ??= fetch(BLUNDER_FILE)
    .then((res) => (res.ok && !(res.headers.get('content-type') ?? '').includes('text/html') ? res.arrayBuffer() : null))
    .then((bytes) => (bytes ? ctx.decodeAudioData(bytes) : null))
    .catch(() => null);
  return blunderClip;
}

export function playBlunder(level?: number): void {
  // Refresh the host's volume for next time; this call uses the cached value.
  if (!soloSound && level === undefined && Date.now() - fetchedAt > 5000) void loadBlunderVolume();
  const volume = level ?? blunderVolume();
  if (volume <= 0) return;
  const ctx = audio();
  if (!ctx) return;
  const out = ctx.createGain();
  out.gain.value = volume;
  out.connect(ctx.destination);
  void loadClip(ctx).then((clip) => {
    if (!clip) return playWarHorn(ctx, out);
    const source = ctx.createBufferSource();
    source.buffer = clip;
    source.connect(out);
    source.start();
  });
}

/** Low brass call with vibrato, a rise of a fourth and a drum hit, in a reverb hall. About 3 s. */
function playWarHorn(ctx: AudioContext, out: AudioNode): void {
  const t = ctx.currentTime + 0.03;
  const end = t + 3.1;

  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(out);

  // Reverb: synthetic impulse response of decaying noise.
  const hall = ctx.createConvolver();
  const length = Math.floor(ctx.sampleRate * 2.8);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6;
  }
  hall.buffer = impulse;
  const wet = ctx.createGain();
  wet.gain.value = 0.45;
  hall.connect(wet).connect(master);

  // Detuned saws an octave apart through an opening low-pass, then soft-clipped.
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.value = 4;
  tone.frequency.setValueAtTime(260, t);
  tone.frequency.exponentialRampToValueAtTime(1500, t + 0.45);
  tone.frequency.setValueAtTime(1500, t + 1.3);
  tone.frequency.exponentialRampToValueAtTime(2400, t + 1.55);
  tone.frequency.exponentialRampToValueAtTime(380, end);
  const shaper = ctx.createWaveShaper();
  shaper.curve = rasp(2.2);
  const body = ctx.createGain();
  body.gain.setValueAtTime(0.0001, t);
  body.gain.exponentialRampToValueAtTime(0.5, t + 0.35);
  body.gain.setValueAtTime(0.5, t + 1.3);
  body.gain.exponentialRampToValueAtTime(0.75, t + 1.5);
  body.gain.setValueAtTime(0.75, t + 2.2);
  body.gain.exponentialRampToValueAtTime(0.0001, end);
  tone.connect(shaper).connect(body);
  body.connect(master);
  body.connect(hall);

  const vibrato = ctx.createOscillator();
  const depth = ctx.createGain();
  vibrato.frequency.value = 5.2;
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(5, t + 1.2);
  vibrato.connect(depth);
  vibrato.start(t);
  vibrato.stop(end);

  // D2 rising to G2 for the peak.
  const low = 73.42;
  const high = 98;
  for (const [ratio, detune, level] of [[1, -6, 0.6], [1, 7, 0.6], [2, 3, 0.35], [3, -4, 0.12]] as const) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(low * ratio * 0.97, t);
    osc.frequency.exponentialRampToValueAtTime(low * ratio, t + 0.25);
    osc.frequency.setValueAtTime(low * ratio, t + 1.3);
    osc.frequency.exponentialRampToValueAtTime(high * ratio, t + 1.42);
    osc.frequency.setValueAtTime(high * ratio, t + 2.4);
    osc.frequency.exponentialRampToValueAtTime(high * ratio * 0.94, end);
    depth.connect(osc.detune);
    gain.gain.value = level;
    osc.connect(gain).connect(tone);
    osc.start(t);
    osc.stop(end);
  }

  const drum = ctx.createOscillator();
  const drumGain = ctx.createGain();
  const hit = t + 1.3;
  drum.type = 'sine';
  drum.frequency.setValueAtTime(95, hit);
  drum.frequency.exponentialRampToValueAtTime(42, hit + 0.5);
  drumGain.gain.setValueAtTime(0.0001, hit);
  drumGain.gain.exponentialRampToValueAtTime(0.9, hit + 0.01);
  drumGain.gain.exponentialRampToValueAtTime(0.0001, hit + 0.9);
  drum.connect(drumGain);
  drumGain.connect(master);
  drumGain.connect(hall);
  drum.start(hit);
  drum.stop(hit + 1);
}
