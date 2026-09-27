import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { Hex } from '../shared/hex.ts';

// Long-running engine process (protocol in engine/src/main.cpp). One search at a time; restarts if it dies.
export class EngineProcess {
  private child: ChildProcessWithoutNullStreams | null = null;
  private listeners = new Set<(line: string) => void>();
  private stopListeners = new Set<(why: string) => void>();
  // The engine's last few lines on stderr, shown when it stops (they say why).
  private said: string[] = [];
  // It stopped on its own (a crash or a failed start), not because it was closed.
  crashed = false;
  // It stopped before its first answer: it couldn't start (a network the graphics card can't run, for example).
  failedToStart = false;
  private answered = false;
  private queue: Promise<unknown> = Promise.resolve();
  // A fresh process may build a TensorRT engine first, which can take a minute or two.
  private startedFresh = false;
  private pending = 0;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly exePath: string,
    private readonly args: string[] = [],
    private readonly env?: NodeJS.ProcessEnv,
    private readonly setup: string[] = [],
    // A net engine holds a CUDA context that keeps the GPU out of its full-speed state, so close it when idle.
    // The next request restarts it.
    private readonly idleCloseMs?: number,
  ) {}

  get running(): boolean {
    return this.child !== null && this.child.exitCode === null;
  }

  bestTurn(moves: readonly Hex[], radius: number, moveTimeMs: number): Promise<Hex[]> {
    return this.search(moves, radius, moveTimeMs).then((r) => r.cells);
  }

  // score is from the side to move.
  search(moves: readonly Hex[], radius: number, moveTimeMs: number): Promise<{ cells: Hex[]; score: number | null }> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    this.pending++;
    const run = this.queue.then(() => this.request(moves, radius, moveTimeMs));
    this.queue = run.catch(() => undefined);
    const done = () => {
      this.pending--;
      if (this.pending === 0 && this.idleCloseMs !== undefined) {
        this.idleTimer = setTimeout(() => {
          this.idleTimer = null;
          if (this.pending === 0) this.close();
        }, this.idleCloseMs);
        this.idleTimer.unref();
      }
    };
    run.then(done, done);
    return run;
  }

  close(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    const child = this.child;
    this.child = null;
    child?.stdin.write('quit\n');
    child?.kill();
  }

  private ensureStarted(): ChildProcessWithoutNullStreams {
    if (this.child && this.child.exitCode === null) return this.child;
    const child = spawn(this.exePath, this.args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: this.env });
    createInterface({ input: child.stdout }).on('line', (line) => {
      for (const listener of this.listeners) listener(line);
    });
    this.said = [];
    createInterface({ input: child.stderr }).on('line', (line) => {
      console.error(`[engine] ${line}`);
      this.said.push(line);
      if (this.said.length > 5) this.said.shift();
    });
    // Writing to a process that already died fails here; its exit is reported below.
    child.stdin.on('error', () => undefined);
    let stopped = false;
    const stop = (why: string) => {
      if (stopped) return;
      stopped = true;
      if (this.child !== child) return; // closed or replaced on purpose
      this.child = null;
      this.crashed = true;
      this.failedToStart = !this.answered;
      for (const listener of this.stopListeners) listener(why);
    };
    this.answered = false;
    child.on('error', (error) => stop(error.message));
    // 'close' comes after stderr is read to the end, so the reason is in `said` by then.
    child.on('close', (code, signal) => stop(signal ? `killed by ${signal}` : `exit code ${code}`));
    this.child = child;
    this.startedFresh = true;
    for (const line of this.setup) child.stdin.write(`${line}\n`);
    return child;
  }

  private request(moves: readonly Hex[], radius: number, moveTimeMs: number): Promise<{ cells: Hex[]; score: number | null }> {
    const child = this.ensureStarted();
    const grace = this.startedFresh ? 180_000 : 10_000;
    this.startedFresh = false;
    let score: number | null = null;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        if (this.child === child) this.child = null;
        child.kill();
        reject(new Error('The engine did not answer in time.'));
      }, moveTimeMs + grace);
      const onStop = (why: string) => {
        cleanup();
        reject(new Error(`The engine stopped (${why})${this.said.length ? `: ${this.said.join(' / ')}` : ''}`));
      };
      const onLine = (line: string) => {
        const info = /^info .*\bscore (-?\d+)/.exec(line);
        if (info) score = Number(info[1]);
        if (line.startsWith('error')) {
          cleanup();
          reject(new Error(`Engine ${line}`));
        } else if (line.startsWith('bestmove')) {
          cleanup();
          this.answered = true;
          const numbers = line.split(/\s+/).slice(1).map(Number);
          if (numbers.some(Number.isNaN) || numbers.length === 0 || numbers.length % 2 !== 0) {
            reject(new Error(`Engine sent an unreadable move: ${line}`));
            return;
          }
          const cells: Hex[] = [];
          for (let i = 0; i < numbers.length; i += 2) cells.push({ q: numbers[i]!, r: numbers[i + 1]! });
          resolve({ cells, score });
        }
      };
      const cleanup = () => {
        clearTimeout(timer);
        this.listeners.delete(onLine);
        this.stopListeners.delete(onStop);
      };
      this.listeners.add(onLine);
      this.stopListeners.add(onStop);
      const flat = moves.map((m) => `${m.q} ${m.r}`).join(' ');
      child.stdin.write(`position radius ${radius}${flat ? ` moves ${flat}` : ''}\n`);
      child.stdin.write(`go movetime ${Math.round(moveTimeMs)}\n`);
    });
  }
}
