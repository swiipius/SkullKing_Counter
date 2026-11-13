import { HonourCard } from '../components/HonourCard';
import { Chest } from '../components/Icons';
import { Registre } from '../components/Registre';
import { SeaScroll } from '../components/SeaScroll';
import { ranking, type Game } from '../game/state';
import type { ScreenProps } from './types';

export function End({ state, dispatch }: ScreenProps) {
  const game = state.game as Game;
  const ranked = ranking(game);
  const [first, second, third, ...rest] = ranked;

  return (
    <>
      <div class="screen-body">
        <SeaScroll contentClass="pad stack stack--10">
          <div class="end__title">
            <h1 class="title title--lg">Fin de la traversée</h1>
            <p>Le trésor revient à…</p>
          </div>
          <div class="podium">
            {second && (
              <div class="podium__place">
                <strong class="podium__name">{second.name}</strong>
                <div class="podium__block podium__block--2">
                  <span>{second.rank}</span>
                  <strong>{second.total}</strong>
                </div>
              </div>
            )}
            <div class="podium__place podium__place--first">
              <Chest />
              <strong class="podium__name podium__name--first">{first.name}</strong>
              <div class="podium__block podium__block--1">
                <span>{first.rank}</span>
                <strong>{first.total}</strong>
              </div>
            </div>
            {third && (
              <div class="podium__place">
                <strong class="podium__name">{third.name}</strong>
                <div class="podium__block podium__block--3">
                  <span>{third.rank}</span>
                  <strong>{third.total}</strong>
                </div>
              </div>
            )}
          </div>
          <HonourCard game={game} onOpenBoard={() => dispatch({ type: 'go', screen: 'leaderboard' })} />
          {rest.map((p) => (
            <div class="rank-row" key={p.index}>
              <span class="rank-row__rank">{p.rank}</span>
              <strong class="rank-row__name">{p.name}</strong>
              <strong>{p.total}</strong>
            </div>
          ))}
          <h2 class="title title--sm">Le registre</h2>
          <Registre game={game} live={false} />
        </SeaScroll>
      </div>
      <footer class="footer footer--row">
        <button type="button" class="btn btn--outline btn--grow" onClick={() => dispatch({ type: 'go', screen: 'setup' })}>
          Nouvel équipage
        </button>
        <button type="button" class="btn btn--gold btn--lg btn--grow" onClick={() => dispatch({ type: 'game/rematch' })}>
          Revanche
        </button>
      </footer>
    </>
  );
}
