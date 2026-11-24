import { useEffect, useState } from 'preact/hooks';
import { navigate } from '../../../shared/router';
import { SeaScroll } from '../../../shared/SeaScroll';
import type { Board } from '../../../shared/leaderboard';
import type { F7Props } from '../App';
import { client, isRankedTarget } from '../leaderboard';
import { TARGET_PRESETS } from '../rules';

const MEDALS = ['var(--f7-gold)', 'var(--f7-sapphire)', 'var(--f7-tangerine)'];
const timeFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

function Row({ rank, name, value }: { rank: number; name: string; value: string }) {
  const top = rank <= 3;
  return (
    <li class="f7-honour">
      <span
        class="f7-honour__medal"
        style={top ? { background: MEDALS[rank - 1], color: rank === 1 ? '#3a1d00' : '#fff', width: '36px', height: '36px' } : undefined}
        aria-label={`${rank === 1 ? '1re' : `${rank}e`} place`}
      >
        {rank}
      </span>
      <strong class="f7-honour__name">{name}</strong>
      <strong class="f7-honour__value">{value}</strong>
    </li>
  );
}

export function Leaderboard({ state, dispatch, fromHub }: F7Props & { fromHub: boolean }) {
  const initial = state.game && isRankedTarget(state.game.target) ? state.game.target : isRankedTarget(state.target) ? state.target : 200;
  const [target, setTarget] = useState(initial);
  const [board, setBoard] = useState<Board | null>(() => client.cachedBoard(String(initial)));
  const [status, setStatus] = useState<'loading' | 'live' | 'offline'>('loading');

  useEffect(() => {
    let alive = true;
    setBoard(client.cachedBoard(String(target)));
    setStatus('loading');
    client
      .flushOutbox()
      .then(() => client.fetchBoard(String(target)))
      .then((b) => alive && (setBoard(b), setStatus('live')))
      .catch(() => alive && setStatus('offline'));
    return () => {
      alive = false;
    };
  }, [target]);

  const games = board?.games ?? 0;
  const statusText =
    status === 'loading'
      ? 'Mise à jour…'
      : status === 'live'
        ? `À jour · ${games} partie${games > 1 ? 's' : ''} en ${target} pts`
        : board
          ? `Hors ligne · dernier tableau connu (${timeFmt.format(board.fetchedAt)})`
          : 'Hors ligne · tableau indisponible';

  const toGame = Boolean(state.game) && !fromHub;
  const back = () => (toGame && state.game ? dispatch({ type: 'go', screen: state.game.winner !== null ? 'end' : 'round' }) : navigate('/'));

  return (
    <>
      <header class="f7-head">
        <button type="button" class="f7-icon-btn" aria-label={toGame ? 'Retour à la partie' : 'Retour à la salle de jeux'} onClick={back}>
          ‹
        </button>
        <div class="f7-head__text">
          <span class="f7-display f7-rainbow" style={{ fontSize: '24px', lineHeight: 1.05 }}>
            TABLEAU D'HONNEUR
          </span>
        </div>
      </header>
      <div class="f7-body">
        <SeaScroll contentClass="f7-pad">
          <div class="f7-tabs" role="tablist" aria-label="Longueur de partie">
            {TARGET_PRESETS.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={t === target} class="f7-tab" onClick={() => setTarget(t)}>
                {t} pts
              </button>
            ))}
          </div>
          {board && board.top.length > 0 ? (
            <>
              <span class="f7-caps" style={{ color: '#ffe08a' }}>
                Les plus gros scores
              </span>
              <ol class="f7-honours">
                {board.top.map((e, i) => (
                  <Row key={i} rank={e.rank} name={e.name} value={String(e.score)} />
                ))}
              </ol>
              <span class="f7-caps" style={{ color: '#ff8cf5', marginTop: '8px' }}>
                Le plus de victoires
              </span>
              <ol class="f7-honours">
                {board.wins.map((e, i) => (
                  <Row key={i} rank={e.rank} name={e.name} value={`${e.wins} victoire${e.wins > 1 ? 's' : ''}`} />
                ))}
              </ol>
            </>
          ) : (
            status !== 'loading' && (
              <div class="f7-progress">Aucune partie en {target} pts pour l'instant. Terminez-en une pour graver les premiers noms.</div>
            )
          )}
          <p class="f7-hint">Seules les parties en 100, 150 ou 200 pts sont classées.</p>
        </SeaScroll>
      </div>
      <footer class="f7-footer" style={{ justifyContent: 'center', gap: '8px', fontSize: '13px', color: 'var(--f7-muted)' }}>
        <span class={`f7-led f7-led--${status}`} aria-hidden="true" />
        <span role="status">{statusText}</span>
      </footer>
    </>
  );
}
