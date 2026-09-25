// Clamps to the first/last generation and snaps to the nearest one that exists. null if not a whole number.
export function resolveGeneration(text: string, generations: readonly number[]): number | null {
  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed) || generations.length === 0) return null;
  const wanted = Number(trimmed);
  return generations.reduce((best, g) => (Math.abs(g - wanted) < Math.abs(best - wanted) ? g : best), generations[0]!);
}
