import type { Hex } from '../shared/hex.ts';
import { Game, otherPlayer, type Player } from '../shared/rules.ts';
import { buildReplay, type ReplayRecord } from '../shared/replay.ts';
import { botName } from '../shared/botMeta.ts';
import { AFTER_BLUNDER_MS, BLUNDER_CALL_MS, followProof, type Evaluation } from '../shared/winChance.ts';
import type { ClientMessage, RoomBot, RoomStatus, RoomView, ServerMessage, SideChoice } from '../shared/protocol.ts';

// No I or O, so codes read clearly out loud.
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const DISCONNECT_GRACE_MS = 120_000;
const BOT_SEAT = '@bot';

type Send = (msg: ServerMessage) => void;
type Cancel = () => void;

interface ClientEntry {
  id: string;
  name: string;
  send: Send | null;
  roomCode: string | null;
}

interface Room {
  code: string;
  radius: number;
  game: Game;
  seats: Record<Player, string | null>;
  status: RoomStatus;
  resignedBy: Player | null;
  abandonedBy: Player | null;
  rematch: Set<Player>;
  replayId: string | null;
  gameNumber: number;
  graceTimers: Map<Player, Cancel>;
  // Friend-vs-bot rooms only; the host watches.
  bot: RoomBot | null;
  host: string | null;
  botThinking: boolean;
  // Last judged turn end, used for blunder calls (see followProof).
  judged: { stones: number; evaluation: Evaluation } | null;
  proof: Player | null;
}

export interface RoomManagerOptions {
  saveReplay: (record: ReplayRecord) => void | Promise<void>;
  random?: () => number;
  setTimer?: (fn: () => void, ms: number) => Cancel;
  graceMs?: number;
  botTurn?: (moves: Hex[], radius: number, bot: string, level: number) => Promise<Hex[]>;
  judge?: (moves: Hex[], radius: number) => Promise<Evaluation>;
  precheck?: (moves: Hex[], radius: number) => Promise<void>;
}

// Authoritative state for Hamachi games: friend vs friend, or friend vs bot with the host watching.
export class RoomManager {
  private readonly clients = new Map<string, ClientEntry>();
  private readonly rooms = new Map<string, Room>();
  private readonly random: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => Cancel;
  private readonly graceMs: number;

  constructor(private readonly options: RoomManagerOptions) {
    this.random = options.random ?? Math.random;
    this.setTimer =
      options.setTimer ??
      ((fn, ms) => {
        const t = setTimeout(fn, ms);
        return () => clearTimeout(t);
      });
    this.graceMs = options.graceMs ?? DISCONNECT_GRACE_MS;
  }

  // A returning client gets its seat back.
  connect(clientId: string, name: string, send: Send): void {
    const existing = this.clients.get(clientId);
    const entry: ClientEntry = existing ?? { id: clientId, name, send: null, roomCode: null };
    entry.name = name;
    entry.send = send;
    this.clients.set(clientId, entry);
    send({ type: 'welcome', clientId });
    const room = entry.roomCode ? this.rooms.get(entry.roomCode) : undefined;
    if (room) {
      const side = this.sideOf(room, clientId);
      if (side) {
        room.graceTimers.get(side)?.();
        room.graceTimers.delete(side);
      }
      this.broadcast(room);
    }
  }

  disconnect(clientId: string): void {
    const entry = this.clients.get(clientId);
    if (!entry) return;
    entry.send = null;
    const room = entry.roomCode ? this.rooms.get(entry.roomCode) : undefined;
    if (!room) {
      this.clients.delete(clientId);
      return;
    }
    const side = this.sideOf(room, clientId);
    if (side && room.status === 'playing') {
      room.graceTimers.get(side)?.();
      room.graceTimers.set(
        side,
        this.setTimer(() => {
          room.graceTimers.delete(side);
          if (room.status === 'playing' && !this.isConnected(room.seats[side])) {
            room.abandonedBy = side;
            this.finish(room);
          }
        }, this.graceMs),
      );
    }
    this.broadcast(room);
    this.dropRoomIfEmpty(room);
  }

  handle(clientId: string, msg: ClientMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    switch (msg.type) {
      case 'hello':
        client.name = msg.name;
        return;
      case 'room:create':
        return this.create(client, msg.radius, msg.side, msg.bot);
      case 'room:join':
        return this.join(client, msg.code.trim().toUpperCase());
      case 'room:leave':
        return this.leave(client);
      case 'game:place':
        return this.place(client, msg.q, msg.r, msg.index);
      case 'game:resign':
        return this.resign(client);
      case 'game:rematch':
        return this.requestRematch(client);
    }
  }

  private create(client: ClientEntry, radius: number, side: SideChoice, bot?: RoomBot): void {
    this.leave(client, { quiet: true });
    // In a bot room `side` is the friend's; the bot takes the other seat.
    const seat: Player = side === 'random' ? (this.random() < 0.5 ? 'X' : 'O') : side;
    const room: Room = {
      code: this.newCode(),
      radius,
      game: new Game(radius),
      seats: { X: null, O: null },
      status: 'waiting',
      resignedBy: null,
      abandonedBy: null,
      rematch: new Set(),
      replayId: null,
      gameNumber: 1,
      graceTimers: new Map(),
      bot: bot ?? null,
      host: bot ? client.id : null,
      botThinking: false,
      judged: null,
      proof: null,
    };
    if (bot) room.seats[otherPlayer(seat)] = BOT_SEAT;
    else room.seats[seat] = client.id;
    client.roomCode = room.code;
    this.rooms.set(room.code, room);
    this.broadcast(room);
  }

  private join(client: ClientEntry, code: string): void {
    const room = this.rooms.get(code);
    if (!room) return this.error(client, `No room with code ${code}. Check the link with your friend.`);
    if (this.sideOf(room, client.id) || room.host === client.id) return this.broadcast(room);
    const free: Player | undefined = room.seats.X === null ? 'X' : room.seats.O === null ? 'O' : undefined;
    if (!free) return this.error(client, 'That room is full.');
    this.leave(client, { quiet: true });
    room.seats[free] = client.id;
    client.roomCode = room.code;
    if (room.status === 'waiting') room.status = 'playing';
    this.broadcast(room);
    this.botMove(room);
  }

  private leave(client: ClientEntry, opts: { quiet?: boolean } = {}): void {
    const room = client.roomCode ? this.rooms.get(client.roomCode) : undefined;
    client.roomCode = null;
    if (room) {
      // The host of a bot room just stops watching; the friend's game carries on.
      if (room.host === client.id) room.host = null;
      const side = this.sideOf(room, client.id);
      if (side) {
        if (room.status === 'playing') {
          room.abandonedBy = side;
          this.finish(room);
        }
        room.seats[side] = null;
        room.rematch.clear();
        room.graceTimers.get(side)?.();
        room.graceTimers.delete(side);
      }
      this.broadcast(room);
      this.dropRoomIfEmpty(room);
    }
    if (!opts.quiet) client.send?.({ type: 'left' });
  }

  private place(client: ClientEntry, q: number, r: number, index: number): void {
    const room = this.roomOf(client);
    if (!room) return this.error(client, 'You are not in a room.');
    if (room.host === client.id) return this.error(client, "You're watching this game: your friend plays the bot.");
    const side = this.sideOf(room, client.id);
    if (room.status !== 'playing' || !side) return this.error(client, 'This game is not in progress.');
    if (index !== room.game.moves.length) return this.sendRoom(room, client);
    if (room.game.current !== side) return this.error(client, "It's not your turn.");
    const res = room.game.place(q, r);
    if (!res.ok) {
      const reason = { 'game-over': 'The game is already over.', occupied: 'That cell is taken.', 'out-of-range': 'That cell is out of range.' }[res.error];
      return this.error(client, reason);
    }
    if (res.won) this.finish(room);
    else {
      this.broadcast(room);
      this.botMove(room);
    }
  }

  // Never throws: judging is optional.
  private async blundered(room: Room): Promise<boolean> {
    if (!this.options.judge || !room.bot?.blunders) return false;
    const stones = room.game.moves.length;
    const game = room.gameNumber;
    try {
      const evaluation = await this.options.judge([...room.game.moves], room.radius);
      if (room.gameNumber !== game) return false;
      const before = room.judged ?? { stones, evaluation: { winX: 0.5, proven: null } };
      const step = followProof(room.proof, before.stones, before.evaluation, stones, evaluation);
      room.proof = step.proof;
      room.judged = { stones, evaluation };
      return step.blunder !== null;
    } catch {
      return false;
    }
  }

  // A bot that fails to move forfeits.
  private botMove(room: Room): void {
    const botTurn = this.options.botTurn;
    if (!room.bot || !botTurn || room.botThinking || room.status !== 'playing') return;
    if (room.seats[room.game.current] !== BOT_SEAT) return;
    const side = room.game.current;
    const game = room.gameNumber;
    const stones = room.game.moves.length;
    room.botThinking = true;
    // The bot thinks while the friend's turn is judged; after a blunder it holds its answer until the call is shown.
    void Promise.all([botTurn([...room.game.moves], room.radius, room.bot.id, room.bot.level), this.blundered(room)])
      .then(([cells, blundered]) =>
        blundered ? new Promise<Hex[]>((resolve) => this.setTimer(() => resolve(cells), BLUNDER_CALL_MS + AFTER_BLUNDER_MS)) : cells)
      .then((cells) => {
        room.botThinking = false;
        // The game may have ended or restarted while it thought.
        if (room.status !== 'playing' || room.gameNumber !== game || room.game.moves.length !== stones) return;
        for (const cell of cells) {
          const res = room.game.place(cell.q, cell.r);
          if (!res.ok) throw new Error(`the bot proposed an illegal stone (${res.error})`);
          if (res.won) return this.finish(room);
          if (room.game.current !== side) break;
        }
        if (room.game.current === side) throw new Error('the bot did not finish its turn');
        this.broadcast(room);
        if (room.bot?.blunders) void this.options.precheck?.([...room.game.moves], room.radius).catch(() => undefined);
        this.botMove(room);
      })
      .catch((e: unknown) => {
        room.botThinking = false;
        if (room.status !== 'playing' || room.gameNumber !== game) return;
        console.error('Room bot failed', e);
        room.abandonedBy = side;
        this.finish(room);
      });
  }

  private resign(client: ClientEntry): void {
    const room = this.roomOf(client);
    const side = room && this.sideOf(room, client.id);
    if (!room || !side || room.status !== 'playing') return this.error(client, 'There is no game to resign.');
    room.resignedBy = side;
    this.finish(room);
  }

  private requestRematch(client: ClientEntry): void {
    const room = this.roomOf(client);
    const side = room && this.sideOf(room, client.id);
    if (!room || !side || room.status !== 'finished') return;
    room.rematch.add(side);
    if (room.bot) room.rematch.add(otherPlayer(side));
    if (room.rematch.size === 2) {
      room.seats = { X: room.seats.O, O: room.seats.X };
      room.game = new Game(room.radius);
      room.status = 'playing';
      room.resignedBy = null;
      room.abandonedBy = null;
      room.replayId = null;
      room.rematch.clear();
      room.gameNumber++;
      room.judged = null;
      room.proof = null;
    }
    this.broadcast(room);
    this.botMove(room);
  }

  private finish(room: Room): void {
    room.status = 'finished';
    for (const cancel of room.graceTimers.values()) cancel();
    room.graceTimers.clear();
    if (room.game.moves.length > 0) {
      const player = (side: Player) =>
        room.seats[side] === BOT_SEAT && room.bot
          ? { name: botName(room.bot.id, room.bot.level), kind: 'bot' as const, bot: `${room.bot.id}:${room.bot.level}` }
          : { name: this.clients.get(room.seats[side] ?? '')?.name ?? 'Player', kind: 'human' as const };
      const record = buildReplay({
        game: room.game,
        mode: 'online',
        players: { X: player('X'), O: player('O') },
        resignedBy: room.resignedBy,
        abandonedBy: room.abandonedBy,
      });
      room.replayId = record.id;
      void Promise.resolve(this.options.saveReplay(record)).catch((e: unknown) => {
        console.error('Could not save replay', e);
      });
    }
    this.broadcast(room);
  }

  private view(room: Room, forClient: string): RoomView {
    const seat = (side: Player) => {
      const id = room.seats[side];
      if (!id) return null;
      if (id === BOT_SEAT && room.bot) return { name: botName(room.bot.id, room.bot.level), connected: true };
      return { name: this.clients.get(id)?.name ?? 'Player', connected: this.isConnected(id) };
    };
    const g = room.game;
    let result: RoomView['result'] = null;
    if (room.status === 'finished') {
      if (g.winner) result = { winner: g.winner, reason: 'six' };
      else if (room.resignedBy) result = { winner: otherPlayer(room.resignedBy), reason: 'resign' };
      else if (room.abandonedBy) result = { winner: otherPlayer(room.abandonedBy), reason: 'abandoned' };
      else result = { winner: null, reason: 'unfinished' };
    }
    return {
      code: room.code,
      radius: room.radius,
      status: room.status,
      seats: { X: seat('X'), O: seat('O') },
      moves: g.moves.map((m) => [m.q, m.r]),
      result,
      rematch: [...room.rematch],
      replayId: room.replayId,
      you: this.sideOf(room, forClient),
      gameNumber: room.gameNumber,
      bot: room.bot ? { name: botName(room.bot.id, room.bot.level), seat: room.seats.X === BOT_SEAT ? 'X' : 'O' } : null,
      watching: room.host !== null && room.host === forClient,
    };
  }

  private broadcast(room: Room): void {
    for (const id of this.people(room)) {
      if (!id) continue;
      const client = this.clients.get(id);
      if (client) this.sendRoom(room, client);
    }
  }

  private sendRoom(room: Room, client: ClientEntry): void {
    client.send?.({ type: 'room', room: this.view(room, client.id) });
  }

  private error(client: ClientEntry, message: string): void {
    client.send?.({ type: 'error', message });
  }

  // Seated players plus the watching host in a bot room.
  private people(room: Room): string[] {
    return [room.seats.X, room.seats.O, room.host].filter((id): id is string => id !== null && id !== BOT_SEAT);
  }

  private roomOf(client: ClientEntry): Room | undefined {
    return client.roomCode ? this.rooms.get(client.roomCode) : undefined;
  }

  private sideOf(room: Room, clientId: string): Player | null {
    if (room.seats.X === clientId) return 'X';
    if (room.seats.O === clientId) return 'O';
    return null;
  }

  private isConnected(clientId: string | null): boolean {
    if (clientId === BOT_SEAT) return false; // the bot never keeps a room open on its own
    return clientId !== null && this.clients.get(clientId)?.send != null;
  }

  private dropRoomIfEmpty(room: Room): void {
    const anyone = this.people(room).some((id) => this.isConnected(id));
    if (anyone) return;
    for (const cancel of room.graceTimers.values()) cancel();
    if (room.status === 'playing') {
      // Both players gone: hold the seats for the grace period, then save and close.
      this.setTimer(() => {
        if (this.people(room).some((id) => this.isConnected(id))) return;
        if (room.status === 'playing') this.finish(room);
        this.closeRoom(room);
      }, this.graceMs);
      return;
    }
    this.closeRoom(room);
  }

  private closeRoom(room: Room): void {
    this.rooms.delete(room.code);
    for (const id of this.people(room)) {
      const client = this.clients.get(id);
      if (client && client.roomCode === room.code) {
        client.roomCode = null;
        if (!client.send) this.clients.delete(client.id);
      }
    }
  }

  private newCode(): string {
    for (;;) {
      let code = '';
      for (let i = 0; i < 4; i++) code += CODE_LETTERS[Math.floor(this.random() * CODE_LETTERS.length)];
      if (!this.rooms.has(code)) return code;
    }
  }
}
