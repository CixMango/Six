import type { ClientMessage, ServerMessage } from '../../shared/protocol.ts';
import { clientId } from './identity.ts';

export type ConnectionState = 'connecting' | 'open' | 'reconnecting';

/** WebSocket to the Six server that says hello on every (re)connect and retries with backoff. */
export class RoomSocket {
  private ws: WebSocket | null = null;
  private readonly messageListeners = new Set<(msg: ServerMessage) => void>();
  private readonly stateListeners = new Set<(state: ConnectionState) => void>();
  private pending: ClientMessage[] = [];
  private attempts = 0;
  private stopped = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  state: ConnectionState = 'connecting';

  constructor(private name: string) {
    this.open();
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
    else this.pending.push(msg);
  }

  onMessage(listener: (msg: ServerMessage) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onState(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  close(): void {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
  }

  private open(): void {
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${scheme}://${location.host}/ws`);
    this.ws = ws;
    ws.onopen = () => {
      this.attempts = 0;
      ws.send(JSON.stringify({ type: 'hello', clientId: clientId(), name: this.name } satisfies ClientMessage));
      const queued = this.pending;
      this.pending = [];
      for (const msg of queued) ws.send(JSON.stringify(msg));
      this.setState('open');
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as ServerMessage;
        for (const listener of this.messageListeners) listener(msg);
      } catch {
        // Ignore anything that isn't a server message.
      }
    };
    ws.onclose = () => {
      if (this.stopped) return;
      this.setState('reconnecting');
      const delay = Math.min(5000, 300 * 2 ** this.attempts++);
      this.retryTimer = setTimeout(() => this.open(), delay);
    };
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    for (const listener of this.stateListeners) listener(state);
  }
}
