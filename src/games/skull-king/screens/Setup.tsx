import { DealerSelect } from '../components/DealerSelect';
import { HomeButton } from '../components/Header';
import { Arrow, Cross } from '../components/Icons';
import { SeaScroll } from '../../../shared/SeaScroll';
import { MAX_PLAYERS, MIN_PLAYERS } from '../game/scoring';
import { defaultName, isFinished } from '../game/state';
import type { ScreenProps } from './types';

export function Setup({ state, dispatch }: ScreenProps) {
  const { players, firstDealer } = state.crew;
  const n = players.length;
  const shownNames = players.map((p, i) => p.trim() || defaultName(i));

  const start = () => {
    const running = state.game && !isFinished(state.game);
    if (running && !window.confirm('Une partie est en cours. La remplacer par une nouvelle ?')) return;
    dispatch({ type: 'game/start' });
  };

  return (
    <>
      <div class="screen-body">
        <SeaScroll contentClass="pad stack stack--10">
          <div class="title-row">
            <HomeButton onClick={() => dispatch({ type: 'goHome' })} />
            <h1 class="title">Votre équipage</h1>
          </div>
          <p class="hint">Inscrivez les pirates dans l'ordre de la table.</p>
          {players.map((name, i) => (
            <div class="card crew-row" key={i}>
              <span class="crew-row__num" aria-hidden="true">
                {i + 1}
              </span>
              <input
                class="crew-row__input"
                type="text"
                value={name}
                placeholder={defaultName(i)}
                maxLength={20}
                autoComplete="off"
                enterKeyHint="next"
                aria-label={`Nom du pirate ${i + 1}`}
                onInput={(e) => dispatch({ type: 'crew/rename', index: i, name: e.currentTarget.value })}
              />
              <button type="button" class="crew-row__btn" disabled={i === 0} aria-label={`Monter ${shownNames[i]} d'une place`} onClick={() => dispatch({ type: 'crew/move', index: i, delta: -1 })}>
                <Arrow dir="up" />
              </button>
              <button type="button" class="crew-row__btn" disabled={i === n - 1} aria-label={`Descendre ${shownNames[i]} d'une place`} onClick={() => dispatch({ type: 'crew/move', index: i, delta: 1 })}>
                <Arrow dir="down" />
              </button>
              <button type="button" class="crew-row__btn crew-row__btn--remove" disabled={n <= MIN_PLAYERS} aria-label={`Retirer ${shownNames[i]}`} onClick={() => dispatch({ type: 'crew/remove', index: i })}>
                <Cross />
              </button>
            </div>
          ))}
          <button type="button" class="btn btn--dashed" disabled={n >= MAX_PLAYERS} onClick={() => dispatch({ type: 'crew/add' })}>
            + Recruter un pirate · {n} / {MAX_PLAYERS}
          </button>
          <DealerSelect names={shownNames} value={firstDealer} onChange={(index) => dispatch({ type: 'crew/dealer', index })} />
          <p class="hint hint--small">Ensuite, la donne tourne dans l'ordre de la table.</p>
        </SeaScroll>
      </div>
      <footer class="footer">
        <button type="button" class="btn btn--gold btn--lg btn--block" onClick={start}>
          Larguer les amarres
        </button>
      </footer>
    </>
  );
}
