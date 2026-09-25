import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { summarize, validateReplay, type ReplayRecord, type ReplaySummary } from '../shared/replay.ts';

// One JSON file per game, validated on read and write.
export class ReplayStore {
  private summaries: Map<string, ReplaySummary> | null = null;

  constructor(private readonly dir: string) {}

  async save(record: ReplayRecord): Promise<void> {
    const valid = validateReplay(record);
    await mkdir(this.dir, { recursive: true });
    const file = path.join(this.dir, `${valid.id}.json`);
    const temp = `${file}.tmp`;
    await writeFile(temp, JSON.stringify(valid), 'utf8');
    await rename(temp, file);
    (await this.index()).set(valid.id, summarize(valid));
  }

  async get(id: string): Promise<ReplayRecord | null> {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) return null;
    try {
      return validateReplay(JSON.parse(await readFile(path.join(this.dir, `${id}.json`), 'utf8')));
    } catch {
      return null;
    }
  }

  async list(): Promise<ReplaySummary[]> {
    return [...(await this.index()).values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private async index(): Promise<Map<string, ReplaySummary>> {
    if (this.summaries) return this.summaries;
    const map = new Map<string, ReplaySummary>();
    let files: string[] = [];
    try {
      files = (await readdir(this.dir)).filter((f) => f.endsWith('.json'));
    } catch {
      // No replays saved yet.
    }
    for (const f of files) {
      const record = await this.get(f.slice(0, -'.json'.length));
      if (record) map.set(record.id, summarize(record));
    }
    this.summaries = map;
    return map;
  }
}
