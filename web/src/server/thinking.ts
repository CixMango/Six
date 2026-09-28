// How far each running search is, so the page waiting on it can show Six's speed. Pages name their search with a
// random id and poll GET /api/thinking/<id> while they wait.
export interface Progress {
  nodes: number;
  ms: number;
  /** The position budget, or null when thinking by time. */
  budget: number | null;
  done: boolean;
}

const live = new Map<string, Progress & { at: number }>();
const KEEP_MS = 60_000;
const ID = /^[a-z0-9-]{8,40}$/;

export function validThinkId(value: unknown): string | undefined {
  return typeof value === 'string' && ID.test(value) ? value : undefined;
}

/** Starts tracking a search; the returned function takes the engine's progress reports. */
export function trackProgress(id: string | undefined, budget: number | null): ((nodes: number, ms: number) => void) | undefined {
  if (!id) return undefined;
  const now = Date.now();
  for (const [key, p] of live) if (now - p.at > KEEP_MS) live.delete(key);
  live.set(id, { nodes: 0, ms: 0, budget, done: false, at: now });
  return (nodes, ms) => live.set(id, { nodes, ms, budget, done: false, at: Date.now() });
}

export function finishProgress(id: string | undefined): void {
  const p = id ? live.get(id) : undefined;
  if (p) live.set(id!, { ...p, done: true, at: Date.now() });
}

export function readProgress(id: string): Progress | null {
  const p = live.get(id);
  return p ? { nodes: p.nodes, ms: p.ms, budget: p.budget, done: p.done } : null;
}
