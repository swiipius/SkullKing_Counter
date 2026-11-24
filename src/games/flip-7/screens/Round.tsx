import { useEffect, useRef, useState } from 'preact/hooks';
import { navigate } from '../../../shared/router';
import { SeaScroll } from '../../../shared/SeaScroll';
import type { F7Props } from '../App';
import { numberFoil, playerFoil } from '../foil';
import {
  FLIP7_BONUS,
  FLIP7_SIZE,
  MODIFIERS,
  NUMBER_CARDS,
  bustHand,
  emptyHand,
  handScore,
  isFlip7,
  toggleMod,
  toggleNumber,
  toggleX2,
  type Hand,
} from '../rules';
import { dealerIndex, liveTotals, roundComplete, type Game } from '../state';
import { ScoreGrid } from './ScoreGrid';

const plus = (v: number) => (v > 0 ? `+${v}` : String(v));

export function RoundScreen({ state, dispatch }: F7Props) {
  const game = state.game as Game;
  const [picker, setPicker] = useState<number | null>(null);
  const [showScores, setShowScores] = useState(false);
  const totals = liveTotals(game);
  const dealer = dealerIndex(game);
  const missing = game.hands.filter((h) => h === null).length;
  const complete = roundComplete(game);

  return (
    <>
      <header class="f7-head">
        <button type="button" class="f7-icon-btn" aria-label="Retour à la salle de jeux" onClick={() => navigate('/')}>
          ‹
        </button>
        <div class="f7-head__text">
          <span class="f7-display f7-rainbow f7-head__title">FLIP 7</span>
          <span class="f7-head__sub">
            Manche {game.round} · objectif {game.target} pts · donne : {game.players[dealer]}
          </span>
        </div>
      </header>

      <div class="f7-body">
        <SeaScroll contentClass="f7-pad">
          {game.players.map((name, i) => {
            const h = game.hands[i];
            const pts = h ? handScore(h) : 0;
            const pct = Math.min(100, Math.round((Math.max(0, totals[i]) / game.target) * 100));
            const tag = !h
              ? { cls: 'todo', text: 'à saisir' }
              : h.bust
                ? { cls: 'bust', text: 'Sauté' }
                : isFlip7(h)
                  ? { cls: 'flip', text: `Flip 7 ! ${plus(pts)}` }
                  : { cls: 'gain', text: plus(pts) };
            return (
              <button type="button" key={i} class="f7-row" onClick={() => setPicker(i)} aria-label={`${name}, ${totals[i]} points, ${tag.text}. Saisir ses cartes`}>
                <span class="f7-row__top">
                  <span class="f7-row__name">{name}</span>
                  <span class={`f7-tag f7-tag--${tag.cls}`}>{tag.text}</span>
                  <span class="f7-row__total">{totals[i]}</span>
                </span>
                <span class="f7-bar" aria-hidden="true">
                  <span style={{ width: `${pct}%`, background: playerFoil(i) }} />
                </span>
                {i === dealer && <span class="f7-dealer">donne cette manche</span>}
              </button>
            );
          })}
          <p class="f7-hint">Touchez un joueur pour saisir les cartes qu'il garde à la fin de la manche.</p>
        </SeaScroll>
      </div>

      <footer class="f7-footer">
        <button type="button" class="f7-btn f7-btn--ghost f7-btn--side" onClick={() => setShowScores(true)}>
          Voir les scores
        </button>
        <button type="button" class={`f7-btn f7-btn--grow ${complete ? 'f7-btn--gold' : 'f7-btn--wait'}`} disabled={!complete} onClick={() => dispatch({ type: 'round/next' })}>
          {complete ? 'Manche suivante' : `Encore ${missing} joueur${missing > 1 ? 's' : ''}`}
        </button>
      </footer>

      {picker !== null && (
        <Picker
          name={game.players[picker]}
          initial={game.hands[picker]}
          onClose={() => setPicker(null)}
          onSave={(hand) => {
            dispatch({ type: 'hand', index: picker, hand });
            setPicker(null);
          }}
        />
      )}
      {showScores && (
        <Sheet onClose={() => setShowScores(false)} label="Scores de la partie">
          <div class="f7-sheet__head">
            <span class="f7-display f7-rainbow" style={{ fontSize: '24px' }}>
              LES SCORES
            </span>
            <span class="f7-hint">objectif {game.target} pts</span>
          </div>
          <ScoreGrid game={game} />
          <button type="button" class="f7-btn f7-btn--gold" onClick={() => setShowScores(false)}>
            Retour à la manche
          </button>
        </Sheet>
      )}
    </>
  );
}

function Sheet({ children, onClose, label }: { children: preact.ComponentChildren; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div class="f7-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} class="f7-sheet" role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function Picker({ name, initial, onSave, onClose }: { name: string; initial: Hand | null; onSave: (h: Hand) => void; onClose: () => void }) {
  const [hand, setHand] = useState<Hand>(initial && !initial.bust ? initial : emptyHand());
  const score = handScore(hand);
  const full = hand.numbers.length >= FLIP7_SIZE;
  const left = FLIP7_SIZE - hand.numbers.length;

  return (
    <Sheet onClose={onClose} label={`Cartes de ${name}`}>
      <div class="f7-sheet__head">
        <strong style={{ fontSize: '20px' }}>Cartes de {name}</strong>
        <span class="f7-display f7-goldtext f7-sheet__score" aria-live="polite">
          = {score}
        </span>
      </div>
      <span class="f7-caps">Chiffres</span>
      <div class="f7-candies">
        {NUMBER_CARDS.map((n) => {
          const on = hand.numbers.includes(n);
          return (
            <button
              type="button"
              key={n}
              class="f7-candy"
              aria-pressed={on}
              aria-label={`Carte ${n}`}
              disabled={!on && full}
              style={on ? { background: numberFoil(n) } : undefined}
              onClick={() => setHand(toggleNumber(hand, n))}
            >
              {n}
            </button>
          );
        })}
      </div>
      <span class="f7-caps">Bonus</span>
      <div class="f7-tokens">
        {MODIFIERS.map((m) => {
          const on = hand.mods.includes(m);
          return (
            <button type="button" key={m} class="f7-token" aria-pressed={on} style={on ? { background: 'var(--f7-sapphire)' } : undefined} onClick={() => setHand(toggleMod(hand, m))}>
              +{m}
            </button>
          );
        })}
        <button type="button" class="f7-token" aria-pressed={hand.x2} aria-label="Carte fois deux" style={hand.x2 ? { background: 'var(--f7-magenta)' } : undefined} onClick={() => setHand(toggleX2(hand))}>
          ×2
        </button>
      </div>
      <div class={`f7-progress ${full ? 'f7-progress--flip' : ''}`}>
        {full ? `Flip 7 ! +${FLIP7_BONUS} points de bonus` : `${hand.numbers.length} chiffre${hand.numbers.length > 1 ? 's' : ''} sur 7 · encore ${left} pour le Flip 7 (+${FLIP7_BONUS})`}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" class="f7-btn f7-btn--danger f7-btn--grow" onClick={() => onSave(bustHand())}>
          Sauté (0)
        </button>
        <button type="button" class="f7-btn f7-btn--gold" style={{ flex: '1.4 1 0' }} onClick={() => onSave(hand)}>
          Valider
        </button>
      </div>
    </Sheet>
  );
}
