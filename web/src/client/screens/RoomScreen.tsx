import { SettingsButton } from '../components/Settings.tsx';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useLocation, useParams, useSearch } from 'wouter';
import { Check, Copy, Flag, LocateFixed, LogOut, Minus, Plus, ShieldAlert } from 'lucide-react';
import type { Hex } from '../../shared/hex.ts';
import { Game, otherPlayer, type Player } from '../../shared/rules.ts';
import { ROOM_BOTS, type RoomBotId, type RoomView } from '../../shared/protocol.ts';
import { BoardCanvas, type BoardHandle } from '../board/BoardCanvas.tsx';
import { BlunderCall, ChannelBug, Dock, LowerThird, ResultBand, Scorebug, SoundCheck } from '../components/Broadcast.tsx';
import { api, type ServerInfo } from '../lib/api.ts';
import { lastMoveInfo, parseLevel, parseRadius, summarizeTurn } from '../lib/gameView.ts';
import { playerName, savePlayerName } from '../lib/identity.ts';
import { RoomSocket, type ConnectionState } from '../lib/socket.ts';
import { useNarrow } from '../lib/useNarrow.ts';
import { useWinChance } from '../lib/useWinChance.ts';
import { blunderModeOn } from '../lib/blunderMode.ts';
import { threatMarks, useThreatHints } from '../lib/threatHints.ts';

function NamePlate({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    savePlayerName(clean);
    onDone(clean);
  };
  return (
    <form className="name-plate plate" onSubmit={submit}>
      <h1 className="name-plate-title caps">Join the match</h1>
      <label className="field-label" htmlFor="room-name">Your name</label>
      <input id="room-name" className="text-input" autoFocus maxLength={24} autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shown on the scoreboard" />
      <button type="submit" className="button is-primary" disabled={!name.trim()}>Take my seat</button>
      <SoundCheck />
    </form>
  );
}

function SharePlate({ code, info }: { code: string; info: ServerInfo | null }) {
  const [copied, setCopied] = useState(false);
  const base = info?.hamachiUrl ?? info?.lanUrls[0] ?? location.origin;
  const link = `${base}/room/${code}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="share-plate plate" aria-label={`Invite a friend to room ${code}`}>
      <p className="share-code caps">{code}</p>
      <p className="field-label">Send your friend this link</p>
      <div className="share-link-row">
        <input className="text-input share-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Room link" />
        <button type="button" className="button" onClick={copy}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="notice">
        {info?.hamachiUrl
          ? 'They need to be on your Hamachi network. The game starts as soon as they open it.'
          : "Hamachi isn't connected on this PC, so this link only works on your local network."}
      </p>
      <SoundCheck />
    </section>
  );
}

export function RoomScreen() {
  const [, navigate] = useLocation();
  const { code: routeCode } = useParams<{ code: string }>();
  const params = new URLSearchParams(useSearch());
  const [name, setName] = useState(playerName);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [error, setError] = useState('');
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const socket = useRef<RoomSocket | null>(null);
  const board = useRef<BoardHandle>(null);
  const narrow = useNarrow();
  const codeInUrl = useRef(routeCode !== 'new');

  useEffect(() => {
    api.info().then(setInfo).catch(() => setInfo(null));
  }, []);

  useEffect(() => {
    if (!name) return;
    const s = new RoomSocket(name);
    socket.current = s;
    const offState = s.onState(setConnection);
    const offMessage = s.onMessage((msg) => {
      if (msg.type === 'room') {
        setRoom(msg.room);
        setError('');
        if (!codeInUrl.current) {
          codeInUrl.current = true;
          navigate(`/room/${msg.room.code}`, { replace: true });
        }
      } else if (msg.type === 'error') {
        setError(msg.message);
      } else if (msg.type === 'left') {
        navigate('/');
      }
    });
    if (routeCode === 'new') {
      const side = params.get('side');
      // Friend vs bot: `side` is the friend's and the bot takes the other one.
      const botId = params.get('bot') as RoomBotId | null;
      const bot = botId && ROOM_BOTS.includes(botId) ? { id: botId, level: parseLevel(params.get('level')), blunders: blunderModeOn() } : undefined;
      s.send({ type: 'room:create', radius: parseRadius(params.get('radius')), side: side === 'X' || side === 'O' ? side : 'random', bot });
    } else {
      s.send({ type: 'room:join', code: routeCode });
    }
    return () => {
      offState();
      offMessage();
      s.close();
      socket.current = null;
    };
    // The socket lives for the whole screen; swapping the URL from "new" to the code must not rebuild it.
  }, [name]);

  const game = useMemo(() => (room ? Game.fromMoves(room.moves.map(([q, r]) => ({ q, r })), room.radius) : new Game(parseRadius(params.get('radius')))), [room]);
  const version = room ? room.gameNumber * 100_000 + room.moves.length : 0;
  const [showThreats, toggleThreats] = useThreatHints();
  const [blunderMode] = useState(blunderModeOn);
  const { chance, blunder, ratings } = useWinChance(game.moves, game.radius, room?.result?.winner ?? game.winner, Boolean(room) && blunderMode);

  if (!name) {
    return (
      <main className="stage">
        <BoardCanvas game={game} version={0} interactive={false} label="Empty board" />
        <ChannelBug tag="Hamachi" detail={routeCode === 'new' ? 'New room' : `Room ${routeCode}`} />
        <NamePlate onDone={setName} />
      </main>
    );
  }

  const you = room?.you ?? null;
  const watching = room?.watching ?? false;
  const bot = room?.bot ?? null;
  const friendSeat = bot ? otherPlayer(bot.seat) : null;
  const names: Record<Player, string> = {
    X: room?.seats.X?.name ?? 'Waiting…',
    O: room?.seats.O?.name ?? 'Waiting…',
  };
  const playing = room?.status === 'playing';
  const finished = room?.status === 'finished';
  const yourTurn = playing && you === game.current;
  const opponent = you ? otherPlayer(you) : null;
  const opponentAway = playing && opponent && room?.seats[opponent] && !room.seats[opponent]!.connected;
  const friendAway = playing && watching && friendSeat && room?.seats[friendSeat] && !room.seats[friendSeat]!.connected;
  const botToMove = playing && bot !== null && game.current === bot.seat;

  const onPlace = (cell: Hex) => {
    if (!yourTurn) return;
    setConfirmResign(false);
    socket.current?.send({ type: 'game:place', q: cell.q, r: cell.r, index: game.moves.length });
  };

  let title = 'Connecting to the room';
  let detail = '';
  let tone: Player | null = null;
  if (connection === 'reconnecting') {
    title = 'Reconnecting…';
    detail = 'Your seat is held while the connection comes back.';
  } else if (error && !room) {
    title = 'Could not open this room';
    detail = error;
  } else if (room?.status === 'waiting' && bot) {
    title = 'Waiting for your friend';
    detail = `They play ${friendSeat} against ${bot.name}, and you watch. ${friendSeat === 'X' ? 'They open' : `${bot.name} opens`} once they join.`;
    tone = friendSeat;
  } else if (room?.status === 'waiting') {
    title = 'Waiting for your friend';
    detail = `You play ${you}. ${you === 'X' ? 'You open once they join.' : 'They open once they join.'}`;
    tone = you;
  } else if (friendAway) {
    title = `${names[friendSeat!]} lost connection`;
    detail = `They have two minutes to come back before ${bot!.name} is awarded the game.`;
    tone = friendSeat;
  } else if (playing && opponentAway) {
    title = `${names[opponent!]} lost connection`;
    detail = 'They have two minutes to come back before the game is awarded to you.';
    tone = opponent;
  } else if (playing) {
    const summary = summarizeTurn(game, names);
    if (botToMove) {
      title = `${bot!.name} is thinking`;
      detail = summary?.text ?? '';
      tone = bot!.seat;
    } else if (!summary) {
      title = yourTurn ? 'Your move: open the game' : `${names[game.current]} opens the game`;
      if (watching) title = `${names[game.current]} opens the game`;
      detail = yourTurn ? 'Place your first stone anywhere in the lit area.' : '';
      tone = game.current;
    } else {
      title = summary.text;
      tone = summary.player;
    }
  }

  const rematchAsked = finished && you !== null && room!.rematch.includes(you);
  const rematchOffered = finished && opponent !== null && room!.rematch.includes(opponent);

  return (
    <main className="stage">
      <BoardCanvas
        ref={board}
        game={game}
        version={version}
        interactive={Boolean(yourTurn)}
        onPlace={onPlace}
        alarm={Boolean(chance?.proven) && !game.winner}
        marks={showThreats ? threatMarks(game) : undefined}
        label={room ? `Room ${room.code}` : 'Room'}
        inset={
          narrow
            ? { top: 150, right: 16, bottom: room?.status === 'waiting' ? 420 : 160, left: 16 }
            : { top: 110, right: 24, bottom: 90, left: room?.status === 'waiting' ? 460 : 24 }
        }
      />
      <ChannelBug
        tag={playing ? 'Live' : 'Hamachi'}
        live={playing}
        detail={room ? `Room ${room.code} · ${bot && friendSeat ? `${room.seats[friendSeat] ? names[friendSeat] : 'Your friend'} vs ${bot.name}${watching ? ' · Watching' : ''}` : `Radius ${room.radius}`}` : undefined}
      />
      <SettingsButton />
      {room && room.status !== 'waiting' && (
        <Scorebug
          names={names}
          lastMove={lastMoveInfo(game)}
          onShowLastStone={() => board.current?.showLastStone()}
          current={game.current}
          stonesLeft={game.stonesLeft}
          turn={game.turn}
          winner={room.result?.winner ?? null}
          finished={Boolean(finished)}
          you={you}
          chance={chance}
          ratings={ratings}
        />
      )}
      <BlunderCall blunder={blunder} names={names} />

      {room?.status === 'waiting' && <SharePlate code={room.code} info={info} />}

      {!finished &&
        (confirmResign ? (
          <LowerThird title="Resign this game?" detail={`${opponent ? names[opponent] : 'Your opponent'} will be recorded as the winner.`} player={you}>
            <div className="lt-actions">
              <button type="button" className="button" onClick={() => { socket.current?.send({ type: 'game:resign' }); setConfirmResign(false); }}>Resign</button>
              <button type="button" className="button is-quiet" onClick={() => setConfirmResign(false)}>Keep playing</button>
            </div>
          </LowerThird>
        ) : (
          <LowerThird title={title} detail={error && room ? error : detail} player={tone} />
        ))}

      {finished && room?.result && (
        <ResultBand
          winner={room.result.winner}
          reason={room.result.reason}
          names={names}
          turn={game.turn}
          stones={game.moves.length}
          note={
            watching
              ? `${names[friendSeat!]} can start a rematch. Colors swap.`
              : bot
                ? 'A rematch starts right away. Colors swap.'
                : rematchOffered && !rematchAsked
                  ? `${names[opponent!]} wants a rematch. Colors swap.`
                  : rematchAsked
                    ? `Waiting for ${names[opponent!]} to accept.`
                    : undefined
          }
          actions={[
            ...(watching
              ? []
              : [{ label: rematchAsked ? 'Rematch requested' : rematchOffered ? 'Accept rematch' : 'Rematch', onClick: () => socket.current?.send({ type: 'game:rematch' }), primary: true, disabled: rematchAsked }]),
            { label: 'Review with coach', onClick: () => room.replayId && navigate(`/review/${room.replayId}`), disabled: !room.replayId, primary: watching },
            { label: 'Leave room', onClick: () => socket.current?.send({ type: 'room:leave' }) },
          ]}
        />
      )}

      <Dock
        actions={[
          { icon: LocateFixed, label: 'Recenter on the stones', onClick: () => board.current?.recenter() },
          { icon: Minus, label: 'Zoom out', onClick: () => board.current?.zoomBy(0.8) },
          { icon: Plus, label: 'Zoom in', onClick: () => board.current?.zoomBy(1.25) },
          { icon: ShieldAlert, label: showThreats ? 'Hide threats' : 'Show threats', onClick: toggleThreats, pressed: showThreats },
          { icon: Flag, label: 'Resign', onClick: () => setConfirmResign(true), disabled: !playing || !you, tone: 'danger' },
          { icon: LogOut, label: 'Leave room', onClick: () => (socket.current ? socket.current.send({ type: 'room:leave' }) : navigate('/')) },
        ]}
      />
    </main>
  );
}
