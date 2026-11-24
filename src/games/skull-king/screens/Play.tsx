import { RoundHeader } from '../components/Header';
import { Octopus } from '../components/Icons';
import { Registre } from '../components/Registre';
import { SeaScroll } from '../../../shared/SeaScroll';
import { ROUND_COUNT, playerStatus, sum, type Status } from '../game/scoring';
import { currentCards, dealerIndex, isRoundComplete, projectedRound, type Game } from '../game/state';
import type { ScreenProps } from './types';

const fmt = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0');

function statusLabel(s: Status): { text: string; tone: string } {
  switch (s.kind) {
    case 'dry':
      return { text: 'Au sec', tone: 'mint' };
    case 'made':
      return { text: 'Cap tenu !', tone: 'mint' };
    case 'need':
      return { text: `Encore ${s.missing} pli${s.missing > 1 ? 's' : ''}`, tone: 'lemon' };
    case 'sunk':
      return { text: 'Coulé !', tone: 'fraise' };
  }
}

export function Play({ state, dispatch }: ScreenProps) {
  const game = state.game as Game;
  const cards = currentCards(game);
  const dealer = dealerIndex(game);
  const played = sum(game.tricks);
  const done = isRoundComplete(game);
  const projected = projectedRound(game);
  const left = cards - played;
  const last = game.round >= ROUND_COUNT;

  return (
    <>
      <RoundHeader round={game.round} cards={cards} dealer={game.players[dealer]} onHome={() => dispatch({ type: 'goHome' })}>
        <div class="tricks-progress" aria-live="polite">
          <span>{done ? 'Manche jouée' : `Plis ${played} / ${cards}`}</span>
          <span class="dots" aria-hidden="true">
            {Array.from({ length: cards }, (_, d) => (
              <span key={d} class={`dot ${d < played ? 'dot--on' : ''}`} />
            ))}
          </span>
        </div>
      </RoundHeader>

      <div class="screen-body">
        <SeaScroll contentClass="pad pad--tight stack stack--6">
          {game.players.map((name, i) => {
            const bid = game.bids[i];
            const tricks = game.tricks[i];
            const st = statusLabel(playerStatus(bid, tricks, done));
            const pts = projected[i];
            return (
              <div class="card play-row" key={i}>
                <div class="play-row__who">
                  <div class="play-row__name">
                    <strong>{name}</strong>
                    {i === dealer && <Octopus size={22} label="donneur" />}
                  </div>
                  <div class="play-row__status">
                    <span class={`chip chip--${st.tone}`}>{st.text}</span>
                    <strong class={pts >= 0 ? 'pos' : 'neg'}>{fmt(pts)}</strong>
                  </div>
                </div>
                <div class="stat">
                  <span>Pari</span>
                  <strong>{bid}</strong>
                </div>
                <div class="stat stat--big">
                  <span>Plis</span>
                  <strong aria-live="polite">{tricks}</strong>
                </div>
                <button type="button" class="round-btn round-btn--minus round-btn--sm" disabled={tricks <= 0} aria-label={`Retirer un pli à ${name}`} onClick={() => dispatch({ type: 'trick/add', index: i, delta: -1 })}>
                  −
                </button>
                <button type="button" class="round-btn round-btn--plus round-btn--sm" disabled={done} aria-label={`Un pli de plus pour ${name}`} onClick={() => dispatch({ type: 'trick/add', index: i, delta: 1 })}>
                  +
                </button>
              </div>
            );
          })}
        </SeaScroll>
      </div>

      <section class="board" aria-label="Scores en direct">
        <div class="board__head">
          <h2 class="title title--sm">Le registre</h2>
          <span class="hint hint--small">total : or = 1er · fraise = dernier</span>
        </div>
        <Registre game={game} live compact />
      </section>

      <footer class="footer footer--row">
        <button type="button" class="btn btn--outline btn--side" onClick={() => dispatch({ type: 'go', screen: 'bids' })}>
          Modifier les paris
        </button>
        <button type="button" class={`btn btn--lg btn--grow ${done ? 'btn--gold' : 'btn--waiting'}`} disabled={!done} onClick={() => dispatch({ type: 'round/next' })}>
          {done ? (last ? 'Voir le trésor →' : 'Manche suivante →') : `Encore ${left} pli${left > 1 ? 's' : ''}`}
        </button>
      </footer>
    </>
  );
}
