import { HomeButton } from '../components/Header';
import { DealerOctopus } from '../components/Icons';
import { ROUND_COUNT } from '../game/scoring';
import { currentCards, dealerIndex, type Game } from '../game/state';
import type { ScreenProps } from './types';

export function Deal({ state, dispatch }: ScreenProps) {
  const game = state.game as Game;
  const cards = currentCards(game);
  const dealer = game.players[dealerIndex(game)];
  return (
    <main class="screen deal">
      <button type="button" class="deal__tap" aria-label={`${dealer} distribue ${cards} cartes. Touchez quand c'est fait pour saisir les paris.`} onClick={() => dispatch({ type: 'go', screen: 'bids' })}>
        <span class="deal__round">
          Manche {game.round} sur {ROUND_COUNT}
        </span>
        <span class="coin coin--xl">
          <span class="coin__value">{cards}</span>
          <span class="coin__unit">{cards > 1 ? 'cartes' : 'carte'}</span>
        </span>
        <span class="deal__dealer">
          <DealerOctopus />
          <strong>{dealer} distribue</strong>
        </span>
        <span class="deal__hint">Touchez l'écran quand chacun a ses cartes</span>
      </button>
      <HomeButton floating />
    </main>
  );
}
