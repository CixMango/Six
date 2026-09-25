import { beforeEach, describe, expect, it } from 'vitest';
import type { ReplayRecord } from '../src/shared/replay.ts';
import { parseClientMessage, type ClientMessage, type RoomView, type ServerMessage } from '../src/shared/protocol.ts';
import { RoomManager } from '../src/server/rooms.ts';

class FakeClient {
  inbox: ServerMessage[] = [];
  constructor(readonly id: string, readonly name: string) {}
  send = (msg: ServerMessage) => {
    this.inbox.push(msg);
  };
  get room(): RoomView | undefined {
    for (let i = this.inbox.length - 1; i >= 0; i--) {
      const m = this.inbox[i]!;
      if (m.type === 'room') return m.room;
      if (m.type === 'left') return undefined;
    }
    return undefined;
  }
  get lastError(): string | undefined {
    const e = [...this.inbox].reverse().find((m) => m.type === 'error');
    return e && e.type === 'error' ? e.message : undefined;
  }
}

describe('rooms', () => {
  let saved: ReplayRecord[];
  let timers: Array<{ fn: () => void; ms: number; cancelled: boolean }>;
  let manager: RoomManager;
  let host: FakeClient;
  let guest: FakeClient;

  const say = (c: FakeClient, msg: ClientMessage) => manager.handle(c.id, msg);
  const connect = (c: FakeClient) => manager.connect(c.id, c.name, c.send);
  const place = (c: FakeClient, q: number, r: number) =>
    say(c, { type: 'game:place', q, r, index: c.room!.moves.length });

  beforeEach(() => {
    saved = [];
    timers = [];
    let n = 0;
    manager = new RoomManager({
      saveReplay: (r) => {
        saved.push(r);
      },
      random: () => (n++ % 7) / 7,
      setTimer: (fn, ms) => {
        const t = { fn, ms, cancelled: false };
        timers.push(t);
        return () => {
          t.cancelled = true;
        };
      },
    });
    host = new FakeClient('host-client-1', 'Levi');
    guest = new FakeClient('guest-client-1', 'Sam');
    connect(host);
    connect(guest);
  });

  function startGame() {
    say(host, { type: 'room:create', radius: 9, side: 'X' });
    const code = host.room!.code;
    say(guest, { type: 'room:join', code: code.toLowerCase() });
    return code;
  }

  it('creates a waiting room and seats the host on the chosen side', () => {
    say(host, { type: 'room:create', radius: 8, side: 'O' });
    const room = host.room!;
    expect(room.status).toBe('waiting');
    expect(room.radius).toBe(8);
    expect(room.you).toBe('O');
    expect(room.seats.O).toEqual({ name: 'Levi', connected: true });
    expect(room.seats.X).toBeNull();
    expect(room.code).toMatch(/^[A-HJ-NP-Z]{4}$/);
  });

  it('starts when a guest joins, and both see the same state', () => {
    startGame();
    expect(host.room!.status).toBe('playing');
    expect(guest.room!.you).toBe('O');
    expect(guest.room!.seats.X?.name).toBe('Levi');
  });

  it('enforces turn order and stone indexes on the server', () => {
    startGame();
    place(guest, 0, 0);
    expect(guest.lastError).toMatch(/not your turn/i);
    place(host, 0, 0);
    expect(guest.room!.moves).toEqual([[0, 0]]);
    // A stale index (e.g. a double click) is ignored rather than applied twice.
    say(guest, { type: 'game:place', q: 1, r: 0, index: 0 });
    expect(guest.room!.moves).toHaveLength(1);
    place(guest, 1, 0);
    place(guest, 20, 0);
    expect(guest.lastError).toMatch(/out of range/i);
    place(guest, 2, 0);
    expect(host.room!.moves).toEqual([[0, 0], [1, 0], [2, 0]]);
  });

  it('finishes on six in a row and saves a validated replay', () => {
    startGame();
    const script: Array<[FakeClient, number, number]> = [
      [host, 0, 0], [guest, 0, 3], [guest, 1, 3], [host, 1, 0], [host, 2, 0], [guest, 3, 3], [guest, 4, 3],
      [host, 3, 0], [host, 4, 0], [guest, -3, 3], [guest, -4, 3], [host, 5, 0],
    ];
    for (const [c, q, r] of script) place(c, q, r);
    expect(host.room!.status).toBe('finished');
    expect(host.room!.result).toEqual({ winner: 'X', reason: 'six' });
    expect(saved).toHaveLength(1);
    expect(saved[0]!.mode).toBe('online');
    expect(saved[0]!.players.X.name).toBe('Levi');
    expect(host.room!.replayId).toBe(saved[0]!.id);
  });

  it('resigning ends the game for the other side; rematch swaps colors', () => {
    startGame();
    place(host, 0, 0);
    say(guest, { type: 'game:resign' });
    expect(host.room!.result).toEqual({ winner: 'X', reason: 'resign' });
    say(host, { type: 'game:rematch' });
    expect(guest.room!.rematch).toEqual(['X']);
    say(guest, { type: 'game:rematch' });
    expect(host.room!.status).toBe('playing');
    expect(host.room!.you).toBe('O');
    expect(guest.room!.you).toBe('X');
    expect(host.room!.moves).toEqual([]);
    expect(host.room!.gameNumber).toBe(2);
  });

  it('keeps a seat through a short disconnect, and awards the game after the grace period', () => {
    startGame();
    place(host, 0, 0);
    manager.disconnect(guest.id);
    expect(host.room!.seats.O?.connected).toBe(false);
    const reconnecting = new FakeClient(guest.id, 'Sam');
    manager.connect(reconnecting.id, reconnecting.name, reconnecting.send);
    expect(reconnecting.room!.you).toBe('O');
    expect(host.room!.seats.O?.connected).toBe(true);
    // The first timer was cancelled by the reconnect.
    expect(timers[0]!.cancelled).toBe(true);

    manager.disconnect(guest.id);
    const grace = timers.at(-1)!;
    grace.fn();
    expect(host.room!.result).toEqual({ winner: 'X', reason: 'abandoned' });
    expect(saved.at(-1)!.result.reason).toBe('abandoned');
  });

  it('rejects joining a full or missing room', () => {
    const code = startGame();
    const third = new FakeClient('third-client-1', 'Alex');
    connect(third);
    say(third, { type: 'room:join', code });
    expect(third.lastError).toMatch(/full/i);
    say(third, { type: 'room:join', code: 'ZZZZ' });
    expect(third.lastError).toMatch(/no room/i);
  });

  it('parses only well-formed client messages', () => {
    expect(parseClientMessage('{"type":"game:place","q":1,"r":-2,"index":3}')).toEqual({ type: 'game:place', q: 1, r: -2, index: 3 });
    expect(parseClientMessage('{"type":"game:place","q":1.5,"r":0,"index":0}')).toBeNull();
    expect(parseClientMessage('{"type":"room:create","radius":7,"side":"X"}')).toBeNull();
    expect(parseClientMessage('{"type":"room:join","code":"abcd"}')).toEqual({ type: 'room:join', code: 'ABCD' });
    expect(parseClientMessage('not json')).toBeNull();
    expect(parseClientMessage('{"type":"hello","clientId":"short","name":"x"}')).toBeNull();
  });
});

describe('friend vs bot rooms', () => {
  let saved: ReplayRecord[];
  let manager: RoomManager;
  let host: FakeClient;
  let friend: FakeClient;
  let asked: Array<{ moves: Array<[number, number]>; radius: number; bot: string; level: number }>;
  // A queued Error makes the bot fail.
  let answers: Array<Array<[number, number]> | Error>;

  const say = (c: FakeClient, msg: ClientMessage) => manager.handle(c.id, msg);
  const place = (c: FakeClient, q: number, r: number) => say(c, { type: 'game:place', q, r, index: c.room!.moves.length });
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    saved = [];
    asked = [];
    answers = [];
    manager = new RoomManager({
      saveReplay: (r) => {
        saved.push(r);
      },
      random: () => 0.1,
      setTimer: () => () => undefined,
      botTurn: async (moves, radius, bot, level) => {
        asked.push({ moves: moves.map((m) => [m.q, m.r]), radius, bot, level });
        const next = answers.shift();
        if (!next || next instanceof Error) throw next ?? new Error('no answer queued');
        return next.map(([q, r]) => ({ q, r }));
      },
    });
    host = new FakeClient('host-client-1', 'Levi');
    friend = new FakeClient('friend-client-1', 'Sam');
    manager.connect(host.id, host.name, host.send);
    manager.connect(friend.id, friend.name, friend.send);
  });

  function open(friendSide: 'X' | 'O' = 'X') {
    say(host, { type: 'room:create', radius: 9, side: friendSide, bot: { id: 'hexnet', level: 2, blunders: true } });
    say(friend, { type: 'room:join', code: host.room!.code });
  }

  it('seats the bot opposite the friend and keeps the host watching, not playing', () => {
    say(host, { type: 'room:create', radius: 9, side: 'X', bot: { id: 'hexnet', level: 2 } });
    const waiting = host.room!;
    expect(waiting.status).toBe('waiting');
    expect(waiting.watching).toBe(true);
    expect(waiting.you).toBeNull();
    expect(waiting.bot).toEqual({ name: 'Six 1 s', seat: 'O' });
    expect(waiting.seats.O).toEqual({ name: 'Six 1 s', connected: true });
    expect(waiting.seats.X).toBeNull();

    say(friend, { type: 'room:join', code: waiting.code });
    expect(friend.room!.you).toBe('X');
    expect(friend.room!.watching).toBe(false);
    expect(host.room!.status).toBe('playing');
    expect(host.room!.seats.X?.name).toBe('Sam');
    // The host is not a player: placing does nothing but an error.
    place(host, 0, 0);
    expect(host.lastError).toMatch(/watching/i);
  });

  it('the bot plays its turns on its own, and both the friend and the host see them', async () => {
    open('X');
    answers.push([[1, 0], [2, 0]]);
    place(friend, 0, 0);
    await settle();
    expect(asked).toEqual([{ moves: [[0, 0]], radius: 9, bot: 'hexnet', level: 2 }]);
    expect(host.room!.moves).toEqual([[0, 0], [1, 0], [2, 0]]);
    expect(friend.room!.moves).toEqual(host.room!.moves);
  });

  it('the bot opens when it plays X', async () => {
    answers.push([[0, 0]]);
    open('O');
    await settle();
    expect(friend.room!.moves).toEqual([[0, 0]]);
    expect(friend.room!.you).toBe('O');
  });

  it('a game against the bot is saved with the bot as a bot, and a rematch needs only the friend', async () => {
    open('X');
    answers.push([[0, 3], [1, 3]], [[3, 3], [4, 3]]);
    for (const [q, r] of [[0, 0]] as const) place(friend, q, r);
    await settle();
    place(friend, 1, 0);
    place(friend, 2, 0);
    await settle();
    say(friend, { type: 'game:resign' });
    expect(host.room!.result).toEqual({ winner: 'O', reason: 'resign' });
    expect(saved.at(-1)!.players.O).toEqual({ name: 'Six 1 s', kind: 'bot', bot: 'hexnet:2' });
    expect(saved.at(-1)!.players.X).toEqual({ name: 'Sam', kind: 'human' });

    answers.push([[0, 0]]);
    say(friend, { type: 'game:rematch' });
    await settle();
    // Colors swap: the bot now opens as X, the friend plays O.
    expect(friend.room!.status).toBe('playing');
    expect(friend.room!.you).toBe('O');
    expect(friend.room!.bot).toEqual({ name: 'Six 1 s', seat: 'X' });
    expect(friend.room!.moves).toEqual([[0, 0]]);
  });

  it('a bot that cannot move forfeits instead of leaving the game stuck', async () => {
    open('X');
    answers.push(new Error('engine crashed'));
    place(friend, 0, 0);
    await settle();
    expect(host.room!.result).toEqual({ winner: 'X', reason: 'abandoned' });
  });

  it('after a blunder, the bot holds its answer until the call is over', async () => {
    const timers: Array<{ fn: () => void; ms: number }> = [];
    const verdicts = [{ winX: 0.5, proven: null }, { winX: 0, proven: 'O' as const }];
    const turns = [[[0, 3], [1, 3]], [[3, 3], [4, 3]]];
    manager = new RoomManager({
      saveReplay: () => undefined,
      random: () => 0.1,
      setTimer: (fn, ms) => {
        timers.push({ fn, ms });
        return () => undefined;
      },
      botTurn: async () => turns.shift()!.map(([q, r]) => ({ q: q!, r: r! })),
      judge: async () => verdicts.shift() ?? { winX: 0, proven: 'O' },
    });
    manager.connect(host.id, host.name, host.send);
    manager.connect(friend.id, friend.name, friend.send);
    open('X');
    place(friend, 0, 0); // judged even: the bot answers at once
    await settle();
    expect(friend.room!.moves).toHaveLength(3);
    place(friend, 1, 0);
    place(friend, 2, 0); // this turn hands O a proven win
    await settle();
    expect(friend.room!.moves).toHaveLength(5); // the bot is holding its stones
    const hold = timers.find((t) => t.ms >= 3400)!;
    expect(hold.ms).toBe(3900);
    hold.fn();
    await settle();
    expect(friend.room!.moves).toHaveLength(7);
  });

  it('only bots that run on the server can be seated', () => {
    expect(parseClientMessage('{"type":"room:create","radius":9,"side":"X","bot":{"id":"hexnet","level":2}}'))
      .toEqual({ type: 'room:create', radius: 9, side: 'X', bot: { id: 'hexnet', level: 2 } });
    expect(parseClientMessage('{"type":"room:create","radius":9,"side":"X","bot":{"id":"hexweb","level":2}}')).toBeNull();
    expect(parseClientMessage('{"type":"room:create","radius":9,"side":"X","bot":{"id":"hexnet","level":9}}')).toBeNull();
  });
});
