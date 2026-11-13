import { useEffect, useState } from 'preact/hooks';
import { HomeButton } from '../components/Header';
import { SeaScroll } from '../components/SeaScroll';
import { cachedBoard, fetchBoard, flushOutbox, type Board } from '../leaderboard/api';
import type { ScreenProps } from './types';

const timeFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

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
          <p class="hint">Les 10 plus beaux butins de l'équipage, toutes parties confondues.</p>
          {board && board.top.length > 0 ? (
            <ol class="honour">
              {board.top.map((e) => (
                <li key={e.rank} class={`honour__row honour__row--${e.rank <= 3 ? `top honour__row--${e.rank}` : 'rest'}`}>
                  <span class="honour__medal" aria-label={`${e.rank}e place`}>
                    {e.rank}
                  </span>
                  <strong class="honour__name">{e.name}</strong>
                  <strong class="honour__score">{e.score}</strong>
                </li>
              ))}
            </ol>
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
