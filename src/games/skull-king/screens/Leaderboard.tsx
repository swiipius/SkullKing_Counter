import { useEffect, useState } from 'preact/hooks';
import { HomeButton } from '../components/Header';
import { SeaScroll } from '../../../shared/SeaScroll';
import { cachedBoard, fetchBoard, flushOutbox, type Board } from '../leaderboard/api';
import type { ScreenProps } from './types';

function HonourRow({ rank, name, value }: { rank: number; name: string; value: string }) {
  const tier = rank <= 3 ? `top honour__row--${rank}` : 'rest';
  return (
    <li class={`honour__row honour__row--${tier}`}>
      <span class="honour__medal" aria-label={`${rank === 1 ? '1re' : `${rank}e`} place`}>
        {rank}
      </span>
      <strong class="honour__name">{name}</strong>
      <strong class="honour__score">{value}</strong>
    </li>
  );
}

const timeFmt =new Intl.DateTimeFormat('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

export function Leaderboard({ dispatch }: ScreenProps) {
  const [board, setBoard] = useState<Board | null>(cachedBoard);
  const [status, setStatus] = useState<'loading' | 'live' | 'offline'>('loading');

  useEffect(() => {
    let alive = true;
    // Send games still waiting on this phone first, so they show up in the board.
    flushOutbox()
      .then(fetchBoard)
      .then((b) => alive && (setBoard(b), setStatus('live')))
      .catch(() => alive && setStatus('offline'));
    return () => {
      alive = false;
    };
  }, []);

  const games = board?.games ?? 0;
  const statusText =
    status === 'loading'
      ? 'Mise à jour…'
      : status === 'live'
        ? `À jour · ${games} partie${games > 1 ? 's' : ''} enregistrée${games > 1 ? 's' : ''}`
        : board
          ? `Hors ligne · dernier tableau connu (${timeFmt.format(board.fetchedAt)})`
          : 'Hors ligne · tableau indisponible';

  return (
    <>
      <div class="screen-body">
        <SeaScroll contentClass="pad stack stack--10">
          <div class="title-row">
            <HomeButton onClick={() => dispatch({ type: 'goHome' })} />
            <h1 class="title title--md">Tableau d'honneur</h1>
          </div>
          {board && board.top.length > 0 ? (
            <>
              <section class="stack stack--9" aria-labelledby="board-scores">
                <div>
                  <h2 id="board-scores" class="title title--sm">Les plus gros butins</h2>
                  <p class="hint hint--small">Les 10 meilleurs scores, toutes parties confondues.</p>
                </div>
                <ol class="honour">
                  {board.top.map((e, i) => (
                    <HonourRow key={i} rank={e.rank} name={e.name} value={String(e.score)} />
                  ))}
                </ol>
              </section>
              <section class="stack stack--9 honour-section" aria-labelledby="board-wins">
                <div>
                  <h2 id="board-wins" class="title title--sm">Les plus grands capitaines</h2>
                  <p class="hint hint--small">Le plus de parties gagnées. Une égalité en tête compte pour chacun.</p>
                </div>
                <ol class="honour">
                  {board.wins.map((e, i) => (
                    <HonourRow key={i} rank={e.rank} name={e.name} value={`${e.wins} victoire${e.wins > 1 ? 's' : ''}`} />
                  ))}
                </ol>
              </section>
            </>
          ) : (
            status !== 'loading' && (
              <p class="summary">
                <strong>Le tableau est encore vierge.</strong>
                <span>Terminez une partie pour graver les premiers noms.</span>
              </p>
            )
          )}
        </SeaScroll>
      </div>
      <footer class="footer footer--status">
        <span class={`led led--${status}`} aria-hidden="true" />
        <span role="status">{statusText}</span>
      </footer>
    </>
  );
}
