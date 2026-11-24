import { useEffect, useRef, useState } from 'preact/hooks';
import { RoundHeader } from '../components/Header';
import { Octopus } from '../components/Icons';
import { Registre } from '../components/Registre';
import { SeaScroll } from '../../../shared/SeaScroll';
import { sum } from '../game/scoring';
import { currentCards, dealerIndex, type Game } from '../game/state';
import type { ScreenProps } from './types';

export function Bids({ state, dispatch }: ScreenProps) {
  const game = state.game as Game;
  const cards = currentCards(game);
  const dealer = dealerIndex(game);
  const total = sum(game.bids);
  const [showScores, setShowScores] = useState(false);

  const hint = total > cards ? 'Trop de paris : ça va se bousculer à bord !' : total < cards ? 'Il restera des plis à prendre.' : 'Pile le compte !';

  return (
    <>
      <RoundHeader round={game.round} cards={cards} dealer={game.players[dealer]} onHome={() => dispatch({ type: 'goHome' })} />
      <div class="screen-body">
        <SeaScroll contentClass="pad stack stack--9">
          <div>
            <h1 class="title">Les paris</h1>
            <p class="hint">Tout le monde part de 0. Après le poing levé, ajustez chaque pari.</p>
          </div>
          {game.players.map((name, i) => {
            const bid = game.bids[i];
            return (
              <div class="card bid-row" key={i}>
                <div class="bid-row__name">
                  <strong>{name}</strong>
                  {i === dealer && (
                    <span class="dealer-tag">
                      <Octopus size={20} />
                      donne
                    </span>
                  )}
                </div>
                <button type="button" class="round-btn round-btn--minus" disabled={bid <= 0} aria-label={`Diminuer le pari de ${name}`} onClick={() => dispatch({ type: 'bid/set', index: i, value: bid - 1 })}>
                  −
                </button>
                <span class="bid-row__value" aria-live="polite" aria-label={`Pari de ${name} : ${bid}`}>
                  {bid}
                </span>
                <button type="button" class="round-btn round-btn--plus" disabled={bid >= cards} aria-label={`Augmenter le pari de ${name}`} onClick={() => dispatch({ type: 'bid/set', index: i, value: bid + 1 })}>
                  +
                </button>
              </div>
            );
          })}
          <div class="summary">
            <strong>
              Total des paris : {total} pour {cards} {cards > 1 ? 'cartes' : 'carte'}
            </strong>
            <span>{hint}</span>
          </div>
        </SeaScroll>
      </div>
      <footer class="footer footer--row">
        <button type="button" class="btn btn--outline btn--side" onClick={() => setShowScores(true)}>
          Voir les scores
        </button>
        <button type="button" class="btn btn--gold btn--lg btn--grow" onClick={() => dispatch({ type: 'go', screen: 'play' })}>
          Lancer la manche
        </button>
      </footer>
      {showScores && <ScoresSheet game={game} onClose={() => setShowScores(false)} />}
    </>
  );
}

function ScoresSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const done = game.history.length;
  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet__head">
          <h2 id="sheet-title" class="title title--md">
            Le registre
          </h2>
          <span class="hint">{done === 0 ? 'Aucune manche jouée' : `Après ${done} manche${done > 1 ? 's' : ''}`}</span>
        </div>
        <Registre game={game} live={false} />
        <button ref={closeBtn} type="button" class="btn btn--gold btn--lg btn--block" onClick={onClose}>
          Retour aux paris
        </button>
      </div>
    </div>
  );
}
