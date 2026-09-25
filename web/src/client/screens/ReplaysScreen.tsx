import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import type { ReplaySummary } from '../../shared/replay.ts';
import { ChannelBug } from '../components/Broadcast.tsx';
import { api } from '../lib/api.ts';
import { HexoImport } from '../components/HexoImport.tsx';
import { swappedTeamColors } from '../lib/teamColors.ts';

const MODE_LABEL: Record<ReplaySummary['mode'], string> = {
  online: 'Hamachi',
  bot: 'VS bot',
  botmatch: 'Bot match',
  analysis: 'Study',
  hexo: 'HeXO',
};

const REASON_LABEL: Record<ReplaySummary['reason'], string> = {
  six: 'six in a row',
  resign: 'resignation',
  abandoned: 'opponent left',
  unfinished: 'unfinished',
};

const when = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function ReplaysScreen() {
  const [replays, setReplays] = useState<ReplaySummary[] | null>(null);
  const [error, setError] = useState('');
  const [, navigate] = useLocation();

  useEffect(() => {
    api.replays().then(setReplays).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="library">
      <ChannelBug tag="Replays" detail={replays ? `${replays.length} saved` : undefined} />
      <div className="library-inner">
        <header className="library-header">
          <h1 className="library-title caps">Replays</h1>
          <p className="notice">Every finished game on this PC. Open one for the coach's review of every turn.</p>
          <HexoImport onImport={async (link) => navigate(`/review/${await api.importHexo(link)}`)} />
        </header>

        {error && <p className="error-text">Replays could not load: {error}</p>}

        {replays === null && !error && (
          <div className="table-skeleton" aria-busy="true" aria-label="Loading replays">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        )}

        {replays && replays.length === 0 && (
          <section className="empty-state">
            <h2 className="empty-title">No games saved yet</h2>
            <p className="notice">Finish a game against Rookie, a friend, or start a bot match, and it lands here automatically.</p>
            <Link href="/bot?side=X&level=3&radius=9" className="button is-primary">Play the bot</Link>
          </section>
        )}

        {replays && replays.length > 0 && (
          <div className="table-scroll">
            <table className="replay-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col" className="col-mode">Mode</th>
                  <th scope="col">X</th>
                  <th scope="col">O</th>
                  <th scope="col" className="col-rules">Rules</th>
                  <th scope="col" className="num col-turns">Turns</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {replays.map((r) => (
                  <tr key={r.id} style={swappedTeamColors(r.swapColors)}>
                    <td>
                      <Link href={`/review/${r.id}`} className="row-link">
                        {when.format(new Date(r.createdAt))}
                      </Link>
                    </td>
                    <td className="caps mode-cell col-mode">{MODE_LABEL[r.mode]}</td>
                    <td className={r.winner === 'X' ? 'is-winner' : undefined}>
                      <span className="team-chip is-x" aria-hidden="true" />
                      {r.players.X.name}
                    </td>
                    <td className={r.winner === 'O' ? 'is-winner' : undefined}>
                      <span className="team-chip is-o" aria-hidden="true" />
                      {r.players.O.name}
                    </td>
                    <td className="col-rules">R{r.radius}</td>
                    <td className="num col-turns">{r.turns}</td>
                    <td>
                      {r.winner ? (
                        <>
                          <strong>{r.winner === 'X' ? r.players.X.name : r.players.O.name}</strong> by {REASON_LABEL[r.reason]}
                        </>
                      ) : (
                        REASON_LABEL[r.reason]
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
