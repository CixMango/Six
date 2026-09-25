const ID_KEY = 'six.clientId';
const NAME_KEY = 'six.name';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private windows may block storage; the session still works.
  }
}

let sessionId: string | null = null;

/** A stable id so a refreshed tab gets its seat back. */
export function clientId(): string {
  const stored = read(ID_KEY);
  if (stored) return stored;
  sessionId ??= Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
  write(ID_KEY, sessionId);
  return sessionId;
}

export function playerName(): string {
  return read(NAME_KEY) ?? '';
}

export function savePlayerName(name: string): void {
  write(NAME_KEY, name.trim().slice(0, 24));
}
