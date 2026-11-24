import type { ComponentChildren } from 'preact';
import { ROUND_COUNT } from '../game/scoring';
import { navigate } from '../../../shared/router';

/**
 * Back to the "Salle de jeux" landing page (same chevron as in Flip 7).
 * `onClick` runs first so the game remembers where to resume.
 */
export function HomeButton({ onClick, floating }: { onClick: () => void; floating?: boolean }) {
  return (
    <button
      type="button"
      class={`icon-btn ${floating ? 'icon-btn--floating' : ''}`}
      aria-label="Retour à la salle de jeux"
      onClick={() => {
        onClick();
        navigate('/');
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

interface Props {
  round: number;
  cards: number;
  dealer: string;
  onHome: () => void;
  children?: ComponentChildren;
}

export function RoundHeader({ round, cards, dealer, onHome, children }: Props) {
  return (
    <header class="round-header">
      <HomeButton onClick={onHome} />
      <div class="round-header__text">
        <span class="round-header__title">
          Manche {round} / {ROUND_COUNT}
        </span>
        <span class="round-header__sub">
          {cards} {cards > 1 ? 'cartes' : 'carte'} · donneur : {dealer}
        </span>
      </div>
      {children}
    </header>
  );
}
