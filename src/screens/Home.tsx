import { BarrelRow, Skull } from '../components/Icons';
import { isFinished } from '../game/state';
import type { ScreenProps } from './types';

export function Home({ state, dispatch }: ScreenProps) {
  const { game } = state;
  const resumeLabel = game
    ? isFinished(game)
      ? `Partie terminée · ${game.players.length} pirates`
      : `Manche ${game.round} · ${game.players.length} pirates`
    : '';
  return (
    <main class="screen home">
      <div class="brand">
        <Skull size={78} />
        <h1 class="brand__title">Skull King</h1>
        <p class="brand__tagline">Pari, plis et bonbons</p>
      </div>
      <BarrelRow />
      <div class="spacer" />
      <div class="stack">
        <button type="button" class="btn btn--gold btn--xl" onClick={() => dispatch({ type: 'go', screen: 'setup' })}>
          Nouvelle partie
        </button>
        {game && (
          <button type="button" class="btn btn--outline btn--xl btn--two-lines" onClick={() => dispatch({ type: 'resume' })}>
            <span>Reprendre la partie</span>
            <small>{resumeLabel}</small>
          </button>
        )}
      </div>
    </main>
  );
}
