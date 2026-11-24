import { useEffect, useState } from 'preact/hooks';
import type { SubmitStatus } from '../../../shared/leaderboard';
import { navigate } from '../../../shared/router';
import { client, isRankedTarget, submitGame } from '../leaderboard';
import { CandyScroll } from '../CandyScroll';
import type { F7Props } from '../App';
import { ranking, type Game } from '../state';
import { ScoreGrid } from './ScoreGrid';

const PODIUM = [
  { place: 2, height: 100, foil: 'var(--f7-sapphire)', color: '#fff', size: 30 },
  { place: 1, height: 140, foil: 'var(--f7-gold)', color: '#3a1d00', size: 42 },
  { place: 3, height: 76, foil: 'var(--f7-tangerine)', color: '#fff', size: 26 },
];

export function End({ state, dispatch }: F7Props) {
  const game = state.game as Game;
  const ranked = ranking(game);
  const winner = game.winner !== null ? game.players[game.winner] : ranked[0].name;

  return (
    <>
      <header class="f7-head">
        <button type="button" class="f7-icon-btn" aria-label="Retour à la salle de jeux" onClick={() => navigate('/')}>
          ‹
        </button>
        <div class="f7-head__text">
          <span class="f7-display f7-rainbow f7-head__title">FLIP 7</span>
        </div>
      </header>
      <div class="f7-body">
        <CandyScroll contentClass="f7-pad">
          <div class="f7-end-title">
            <span class="f7-hint" style={{ fontWeight: 800, color: 'var(--f7-soft)' }}>
              Manche {game.history.length} · objectif {game.target} pts atteint
            </span>
            <strong class="f7-display f7-rainbow">VICTOIRE DE {winner.toUpperCase()}</strong>
          </div>
          <div class="f7-podium">
            {PODIUM.map((p) => {
              const r = ranked[p.place - 1];
              if (!r) return null;
              return (
                <div key={p.place} class={`f7-podium__place ${p.place === 1 ? 'f7-podium__place--1' : ''}`}>
                  <span class="f7-podium__name" style={p.place === 1 ? { color: '#ffe08a', fontSize: '18px' } : undefined}>
                    {r.name}
                  </span>
                  <div class="f7-podium__block" style={{ height: `${p.height}px`, background: p.foil, color: p.color, textShadow: p.place === 1 ? 'none' : undefined }}>
                    <span style={{ fontSize: `${p.size}px` }}>{r.rank}</span>
                    <strong style={{ fontSize: p.place === 1 ? '20px' : '17px' }}>{r.total}</strong>
                  </div>
                </div>
              );
            })}
          </div>
          {ranked.slice(3).map((r) => (
            <div class="f7-rest" key={r.index}>
              <span>{r.rank}</span>
              <strong>{r.name}</strong>
              <strong>{r.total}</strong>
            </div>
          ))}
          <HonourCard game={game} onOpen={() => dispatch({ type: 'go', screen: 'leaderboard' })} />
          <span class="f7-caps" style={{ marginTop: '8px' }}>
            Toutes les manches
          </span>
          <ScoreGrid game={game} />
        </CandyScroll>
      </div>
      <footer class="f7-footer">
        <button type="button" class="f7-btn f7-btn--ghost f7-btn--grow" onClick={() => dispatch({ type: 'go', screen: 'setup' })}>
          Nouveaux joueurs
        </button>
        <button type="button" class="f7-btn f7-btn--gold" style={{ flex: '1.2 1 0' }} onClick={() => dispatch({ type: 'rematch' })}>
          Revanche
        </button>
      </footer>
    </>
  );
}

const ordinal = (n: number) => (n === 1 ? '1re' : `${n}e`);

/** Sends the finished game once (ranked targets only) and shows how the players did. */
function HonourCard({ game, onOpen }: { game: Game; onOpen: () => void }) {
  const ranked = isRankedTarget(game.target);
  const [status, setStatus] = useState<SubmitStatus>(() => client.statusOf(game.id) ?? { kind: 'sending' });

  useEffect(() => {
    if (!ranked) return;
    submitGame(game);
    const refresh = () => client.flushOutbox().then(() => setStatus(client.statusOf(game.id) ?? { kind: 'offline' }));
    refresh();
    window.addEventListener('online', refresh);
    return () => window.removeEventListener('online', refresh);
  }, [game.id]);

  if (!ranked) {
    return (
      <div class="f7-card f7-card--muted" role="status">
        <strong>Partie hors classement</strong>
        <span>Seules les parties en 100, 150 ou 200 pts entrent au tableau d'honneur.</span>
      </div>
    );
  }
  if (status.kind === 'sending') {
    return (
      <div class="f7-card f7-card--muted" role="status">
        <strong>Envoi au tableau d'honneur…</strong>
      </div>
    );
  }
  if (status.kind === 'offline') {
    return (
      <div class="f7-card f7-card--muted" role="status">
        <strong>Pas de réseau</strong>
        <span>Les scores partiront tout seuls dès le retour de la connexion.</span>
      </div>
    );
  }
  if (status.kind === 'error') {
    return (
      <div class="f7-card f7-card--muted" role="status">
        <strong>Scores non enregistrés</strong>
        <span>Le tableau d'honneur a refusé cette partie ({status.message}).</span>
      </div>
    );
  }
  const inTop = status.entries.filter((e) => e.inTop).sort((a, b) => a.position - b.position);
  const title =
    inTop.length === 0
      ? 'Scores enregistrés'
      : inTop.length === 1
        ? `${inTop[0].name} entre au tableau d'honneur à la ${ordinal(inTop[0].position)} place !`
        : inTop.length > 3
          ? `${inTop.length} joueurs entrent au tableau d'honneur, ${inTop[0].name} à la ${ordinal(inTop[0].position)} place !`
          : `${inTop.map((e) => `${e.name} (${ordinal(e.position)})`).join(', ').replace(/, ([^,]*)$/, ' et $1')} entrent au tableau d'honneur !`;
  const detail =
    inTop.length === 0
      ? `Personne n'entre dans le top 10 en ${game.target} pts.${status.best !== null ? ` Le meilleur à battre : ${status.best}.` : ''}`
      : `Parties en ${game.target} pts · scores enregistrés.`;
  return (
    <div class={`f7-card ${inTop.length === 0 ? 'f7-card--muted' : ''}`} role="status">
      <strong>{title}</strong>
      <span>{detail}</span>
      <button type="button" class="f7-link" onClick={onOpen}>
        Voir le tableau d'honneur
      </button>
    </div>
  );
}
