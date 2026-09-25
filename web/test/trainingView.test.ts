import { describe, expect, it } from 'vitest';
import type { GenerationRecord, RivalResult, TrainingView } from '../src/client/lib/api.ts';
import { ACTIVE_WINDOW_MS, boutVerdict, describeAge, describeOurSide, describeShape, extraBouts, intervalSentence, loopState, rivalOutcome, rowLeader, signedElo, tapeRows, turnTime } from '../src/client/lib/trainingView.ts';

const view = (overrides: Partial<TrainingView>): TrainingView => ({
  started: true, generation: 3, paused: false, lastActivity: null, history: [], rivals: [], pauseApps: [], log: [], ...overrides,
});

describe('rival results', () => {
  const rival = (over: Partial<RivalResult> = {}): RivalResult => ({
    when: '2026-09-15T18:30:00', ours: 'HexNet gen-0013/net 2000ms', generation: 13, rival: 'Strix 256 sims live strong',
    pairs: 6, wins: 12, losses: 0, draws: 0, forfeits: 0, elo: 305, eloLow: 110, eloHigh: null, ...over,
  });

  it('says what a sweep bounds: the games, and Elo from one side only', () => {
    const won = rivalOutcome(rival());
    expect(won.record).toBe('12–0');
    expect(won.swept).toBe('ours');
    expect(won.sentence).toBe('Won all 12 games across 6 paired openings. 95% interval +110 Elo or more.');
    const lost = rivalOutcome(rival({ wins: 0, losses: 8, pairs: 4, elo: -305, eloLow: null, eloHigh: -110 }));
    expect(lost.swept).toBe('theirs');
    expect(lost.sentence).toBe('Lost all 8 games across 4 paired openings. 95% interval −110 Elo or less.');
  });

  it('gives a measured match its Elo, interval and verdict', () => {
    const close = rivalOutcome(rival({ wins: 7, losses: 5, elo: 60, eloLow: -40, eloHigh: 170 }));
    expect(close.record).toBe('7–5');
    expect(close.swept).toBeNull();
    expect(close.bout.elo).toBe(60);
    expect(close.sentence).toBe('12 games across 6 paired openings. 95% interval −40 to +170. Not separable yet.');
    const clear = rivalOutcome(rival({ wins: 9, losses: 3, elo: 180, eloLow: 40, eloHigh: 330 }));
    expect(clear.sentence).toBe('12 games across 6 paired openings. 95% interval +40 to +330. Measurably stronger.');
  });

  it('counts draws and forfeits when there were any', () => {
    const drawn = rivalOutcome(rival({ wins: 5, losses: 4, draws: 3, elo: 20, eloLow: -60, eloHigh: 100, forfeits: 1 }));
    expect(drawn.record).toBe('5–4–3');
    expect(drawn.sentence).toContain('1 game forfeited.');
    expect(rivalOutcome(rival({ forfeits: 2 })).sentence).toContain('2 games forfeited.');
  });

  it('names our side by generation and thinking time', () => {
    expect(describeOurSide(rival())).toBe('Gen 13 · 2 s a turn');
    expect(describeOurSide(rival({ ours: 'HexNet gen-0009/net 1000ms', generation: 9 }))).toBe('Gen 9 · 1 s a turn');
    expect(describeOurSide(rival({ ours: 'HexNet grow-b15c128/net 300ms', generation: null }))).toBe('HexNet grow-b15c128/net 300ms · 300 ms a turn');
  });

  it('reads an interval that runs off one end as a bound, not a number', () => {
    expect(intervalSentence({ wins: 12, losses: 0, elo: 305, eloLow: 110, eloHigh: null })).toBe('95% interval +110 Elo or more.');
    expect(intervalSentence({ wins: 0, losses: 12, elo: -305, eloLow: null, eloHigh: -110 })).toBe('95% interval −110 Elo or less.');
    expect(intervalSentence({ wins: 5, losses: 5, elo: 0, eloLow: -90, eloHigh: 90 })).toBe('95% interval −90 to +90.');
    expect(boutVerdict({ wins: 12, losses: 0, elo: 305, eloLow: 110, eloHigh: null })).toBe('stronger');
    expect(boutVerdict({ wins: 0, losses: 12, elo: -305, eloLow: null, eloHigh: -110 })).toBe('weaker');
  });
});

describe('training view', () => {
  it('names the loop state from pause, start and recent activity', () => {
    const now = 1_000_000_000;
    expect(loopState(view({ started: false }), now)).toBe('not-started');
    expect(loopState(view({ paused: true, lastActivity: now }), now)).toBe('paused');
    expect(loopState(view({ lastActivity: now - 60_000 }), now)).toBe('running');
    expect(loopState(view({ lastActivity: now - ACTIVE_WINDOW_MS - 1 }), now)).toBe('stalled');
    expect(loopState(view({ lastActivity: null }), now)).toBe('stalled');
  });

  it('only calls a generation stronger or weaker when the interval excludes zero', () => {
    expect(boutVerdict({ wins: 30, losses: 10, elo: 190, eloLow: 60, eloHigh: 330 })).toBe('stronger');
    expect(boutVerdict({ wins: 22, losses: 18, elo: 35, eloLow: -60, eloHigh: 130 })).toBe('even');
    expect(boutVerdict({ wins: 8, losses: 32, elo: -240, eloLow: -400, eloHigh: -90 })).toBe('weaker');
  });

  it('formats Elo with a real minus sign and ages in plain words', () => {
    expect(signedElo(70.4)).toBe('+70');
    expect(signedElo(-12.6)).toBe('−13');
    expect(signedElo(0.2)).toBe('±0');
    expect(describeAge(20_000)).toBe('moments ago');
    expect(describeAge(5 * 60_000)).toBe('5 min ago');
    expect(describeAge(3 * 3600_000)).toBe('3 h ago');
  });

  it('builds mirrored rows and lights the better side only for self-play health, never for losses', () => {
    const newest: GenerationRecord = {
      generation: 5, finished: '2026-09-15T12:00:00',
      selfplay: { games: 600, rows: 15000, unfinished: 30, medianStones: 64 },
      training: { validation: { policy: 1.2, value: 0.5 } },
    };
    const previous: GenerationRecord = {
      generation: 4, finished: '2026-09-15T11:30:00',
      selfplay: { games: 600, rows: 14000, unfinished: 60, medianStones: 70 },
      training: { validation: { policy: 1.3, value: 0.48 } },
    };
    const rows = tapeRows(newest, previous);
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(rowLeader(byLabel['Unfinished']!)).toBe('newest');
    expect(byLabel['Unfinished']!.format(byLabel['Unfinished']!.newest!)).toBe('5.0%');
    // Training losses are displayed but never lit as a win.
    expect(rowLeader(byLabel['Move loss']!)).toBeNull();
    expect(rowLeader(byLabel['Result loss']!)).toBeNull();
    expect(rowLeader(byLabel['Games']!)).toBeNull();
    expect(tapeRows(newest, undefined).every((r) => r.previous === null)).toBe(true);
  });
});

describe('the matches beside the one against the previous generation', () => {
  it('leads with the older generation, and says how long a turn was', () => {
    const record: GenerationRecord = {
      generation: 15, finished: '2026-09-15T19:30:00',
      evaluation: {
        vsPrevious: { wins: 18, losses: 22, elo: -34.9, eloLow: -150, eloHigh: 72.9, moveMs: 300 },
        vsHexBot: { wins: 40, losses: 0, elo: 492.2, eloLow: 217, eloHigh: null, moveMs: 300 },
        vsAnchor: { against: 10, wins: 25, losses: 23, elo: 14.5, eloLow: -71.4, eloHigh: 102.3, moveMs: 300 },
      },
    };
    expect(extraBouts(record).map((b) => b.against)).toEqual(['Gen 10 at 300 ms a turn', 'Six Classic at 300 ms a turn']);
    expect(extraBouts({ generation: 1, finished: '2026-09-15T12:00:00' })).toEqual([]);
  });

  it('claims no time control on older records that never recorded one', () => {
    const record: GenerationRecord = {
      generation: 5, finished: '2026-09-15T15:00:00',
      evaluation: { vsHexBot: { wins: 39, losses: 1, elo: 636.4, eloLow: 442, eloHigh: null } },
    };
    expect(extraBouts(record)[0]!.against).toBe('Six Classic');
  });

  it('says a turn in seconds once it is a second or more', () => {
    expect(turnTime(300)).toBe('300 ms a turn');
    expect(turnTime(1000)).toBe('1 s a turn');
    expect(turnTime(10_000)).toBe('10 s a turn');
  });
});

describe('a network that changed shape', () => {
  it('names the shape in blocks and channels, and leaves anything else alone', () => {
    expect(describeShape('b10c128')).toBe('10×128');
    expect(describeShape('b15c192')).toBe('15×192');
    expect(describeShape('something-else')).toBe('something-else');
  });
});
