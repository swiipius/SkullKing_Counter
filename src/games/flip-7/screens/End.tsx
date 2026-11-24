import { navigate } from '../../../shared/router';
import { SeaScroll } from '../../../shared/SeaScroll';
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
        <SeaScroll contentClass="f7-pad">
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
          <span class="f7-caps" style={{ marginTop: '8px' }}>
            Toutes les manches
          </span>
          <ScoreGrid game={game} />
        </SeaScroll>
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
