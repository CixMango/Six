export const BOT_META = {
  rookie: { name: 'Rookie', levelLabels: ['1', '2', '3', '4', '5'] },
  hexbot: { name: 'Six Classic', levelLabels: ['0.5 s', '1 s', '2.5 s', '5 s', '10 s', '20 s', '45 s'] },
  hexnet: { name: 'Six', levelLabels: ['0.5 s', '1 s', '2.5 s', '5 s', '10 s', '20 s', '45 s'] },
  // Runs in the browser (WebAssembly engine + ONNX Runtime Web).
  hexweb: { name: 'Six (browser)', levelLabels: ['0.5 s', '1 s', '2.5 s', '5 s', '10 s', '20 s', '45 s'] },
} as const;

export type BotId = keyof typeof BOT_META;

export const HEXBOT_MOVETIME_MS = [500, 1000, 2500, 5000, 10000, 20000, 45000] as const;

export function isBotId(value: unknown): value is BotId {
  return value === 'rookie' || value === 'hexbot' || value === 'hexnet' || value === 'hexweb';
}

// Engine bot levels are thinking times; Rookie's are strengths.
export function isTimedBot(id: BotId): boolean {
  return id !== 'rookie';
}

// e.g. "Rookie 3" or "Six 2.5 s"
export function botName(id: BotId, level: number, generation?: number | null): string {
  const meta = BOT_META[id];
  const gen = generation != null && id === 'hexnet' ? ` gen ${generation}` : '';
  return `${meta.name}${gen} ${meta.levelLabels[level - 1] ?? level}`;
}

// ?gen=300 in the URL; null means the newest.
export function parseGeneration(value: string | null): number | null {
  const n = Number(value);
  return value !== null && value !== '' && Number.isInteger(n) && n >= 0 ? n : null;
}
