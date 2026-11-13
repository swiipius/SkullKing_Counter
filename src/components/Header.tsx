import type { ComponentChildren } from 'preact';
import { ROUND_COUNT } from '../game/scoring';
import { AnchorIcon } from './Icons';

export function HomeButton({ onClick, floating }: { onClick: () => void; floating?: boolean }) {
  return (
    <button type="button" class={`icon-btn ${floating ? 'icon-btn--floating' : ''}`} aria-label="Retour à l'accueil" onClick={onClick}>
      <AnchorIcon />
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
