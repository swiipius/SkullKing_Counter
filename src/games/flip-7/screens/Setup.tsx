import { useState } from 'preact/hooks';
import { navigate } from '../../../shared/router';
import { SeaScroll } from '../../../shared/SeaScroll';
import { MAX_PLAYERS, MIN_PLAYERS, MAX_TARGET, MIN_TARGET, OFFICIAL_TARGET, TARGET_PRESETS } from '../rules';
import { defaultName } from '../state';
import type { F7Props } from '../App';
import { playerFoil } from '../foil';

const PRESET_LABEL: Record<number, string> = { 100: 'rapide', 150: '', 200: 'officiel' };

export function Setup({ state, dispatch }: F7Props) {
  const { players, firstDealer } = state.crew;
  const n = players.length;
  const names = players.map((p, i) => p.trim() || defaultName(i));
  const isPreset = (TARGET_PRESETS as readonly number[]).includes(state.target);
  const [custom, setCustom] = useState(!isPreset);
  const [draft, setDraft] = useState(String(state.target));

  const start = () => {
    if (state.game && state.game.winner === null && !window.confirm('Une partie de Flip 7 est en cours. La remplacer ?')) return;
    dispatch({ type: 'start' });
  };

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
          <span class="f7-label" style={{ marginTop: 0 }}>
            LES JOUEURS
          </span>
          <p class="f7-hint">Dans l'ordre de la table.</p>
          {players.map((name, i) => (
            <div class="f7-crew" key={i}>
              <span class="f7-crew__num" style={{ background: playerFoil(i) }} aria-hidden="true">
                {i + 1}
              </span>
              <input
                class="f7-crew__input"
                type="text"
                value={name}
                placeholder={defaultName(i)}
                maxLength={20}
                autoComplete="off"
                aria-label={`Nom du joueur ${i + 1}`}
                onInput={(e) => dispatch({ type: 'crew/rename', index: i, name: e.currentTarget.value })}
              />
              <button type="button" class="f7-crew__btn" disabled={i === 0} aria-label={`Monter ${names[i]}`} onClick={() => dispatch({ type: 'crew/move', index: i, delta: -1 })}>
                ↑
              </button>
              <button type="button" class="f7-crew__btn" disabled={i === n - 1} aria-label={`Descendre ${names[i]}`} onClick={() => dispatch({ type: 'crew/move', index: i, delta: 1 })}>
                ↓
              </button>
              <button type="button" class="f7-crew__btn f7-crew__btn--remove" disabled={n <= MIN_PLAYERS} aria-label={`Retirer ${names[i]}`} onClick={() => dispatch({ type: 'crew/remove', index: i })}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" class="f7-add" disabled={n >= MAX_PLAYERS} onClick={() => dispatch({ type: 'crew/add' })}>
            + Ajouter un joueur · {n}
          </button>
          <label class="f7-custom">
            <span style={{ flex: '1 1 0' }}>Premier donneur</span>
            <select class="f7-select" value={firstDealer} onChange={(e) => dispatch({ type: 'crew/dealer', index: Number(e.currentTarget.value) })}>
              {names.map((nm, i) => (
                <option key={i} value={i}>
                  {nm}
                </option>
              ))}
            </select>
          </label>

          <span class="f7-label">OBJECTIF</span>
          <p class="f7-hint">Premier à atteindre ce score à la fin d'une manche.</p>
          <div class="f7-targets" role="group" aria-label="Points à atteindre">
            {TARGET_PRESETS.map((t) => (
              <button
                type="button"
                key={t}
                class="f7-target"
                aria-pressed={!custom && state.target === t}
                onClick={() => {
                  setCustom(false);
                  dispatch({ type: 'target', value: t });
                }}
              >
                <strong>{t}</strong>
                <small>{PRESET_LABEL[t]}</small>
              </button>
            ))}
            <button type="button" class="f7-target" aria-pressed={custom} onClick={() => setCustom(true)}>
              <strong>…</strong>
              <small>autre</small>
            </button>
          </div>
          {custom && (
            <label class="f7-custom">
              Objectif personnalisé
              <input
                type="number"
                inputMode="numeric"
                min={MIN_TARGET}
                max={MAX_TARGET}
                step={10}
                value={draft}
                onInput={(e) => {
                  setDraft(e.currentTarget.value);
                  const v = Number(e.currentTarget.value);
                  if (Number.isFinite(v) && v >= MIN_TARGET) dispatch({ type: 'target', value: v });
                }}
              />
            </label>
          )}
          <p class="f7-hint">
            {state.target === OFFICIAL_TARGET ? 'Règle officielle : ' : ''}environ {Math.max(2, Math.round(state.target / 30))} à {Math.max(3, Math.round(state.target / 18))} manches.
          </p>
        </SeaScroll>
      </div>
      <footer class="f7-footer">
        <button type="button" class="f7-btn f7-btn--gold f7-btn--grow" onClick={start}>
          C'est parti ! · {state.target} pts
        </button>
      </footer>
    </>
  );
}
