import { flip7Status } from '../games/flip-7/storage';
import { skullKingStatus } from '../games/skull-king/game/storage';
import { navigate } from '../shared/router';
import './hub.css';

/**
 * Landing page: one card per game, each in its own colours. To add a game:
 * create src/games/<id>/, add its route in main.tsx and a card here.
 */
export function Hub() {
  const sk = skullKingStatus();
  const f7 = flip7Status();
  const go = (path: string) => (e: Event) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <main class="hub">
      <header class="hub__head">
        <h1>Salle de jeux</h1>
        <p>Choisissez votre partie</p>
      </header>

      <section class="hub-card hub-card--sk" aria-labelledby="hub-sk">
        <div class="hub-card__title">
          <h2 id="hub-sk" class="hub-sk__title">
            Skull King
          </h2>
          <span class="hub-sk__moon" aria-hidden="true" />
        </div>
        <p class="hub-card__status">{sk.label}</p>
        <div class="hub-card__actions">
          {sk.inProgress && (
            <a href="/skull-king?action=resume" class="hub-btn hub-btn--sk" onClick={go('/skull-king?action=resume')}>
              Reprendre
            </a>
          )}
          <a href="/skull-king?action=new" class={`hub-btn ${sk.inProgress ? 'hub-btn--sk-ghost' : 'hub-btn--sk'}`} onClick={go('/skull-king?action=new')}>
            Nouvelle partie
          </a>
        </div>
        <a href="/skull-king?action=leaderboard" class="hub-card__link hub-sk__link" onClick={go('/skull-king?action=leaderboard')}>
          Tableau d'honneur ›
        </a>
      </section>

      <section class="hub-card hub-card--f7" aria-labelledby="hub-f7">
        <h2 id="hub-f7" class="hub-f7__title">
          FLIP 7
        </h2>
        <p class="hub-card__status">{f7.label}</p>
        <div class="hub-card__actions">
          {f7.inProgress && (
            <a href="/flip-7?action=resume" class="hub-btn hub-btn--f7" onClick={go('/flip-7?action=resume')}>
              Reprendre
            </a>
          )}
          <a href="/flip-7?action=new" class={`hub-btn ${f7.inProgress ? 'hub-btn--f7-ghost' : 'hub-btn--f7'}`} onClick={go('/flip-7?action=new')}>
            Nouvelle partie
          </a>
        </div>
        <a href="/flip-7?action=leaderboard" class="hub-card__link hub-f7__link" onClick={go('/flip-7?action=leaderboard')}>
          Tableau d'honneur ›
        </a>
      </section>

      <section class="hub-card hub-card--soon">
        <h2>D'autres jeux arrivent</h2>
        <p>Chaque jeu = un dossier dans le code. Proposez le vôtre !</p>
      </section>

      <footer class="hub__foot">
        <span>Code source · licence MIT</span>
        <span aria-hidden="true">·</span>
        <span>Compteur non officiel</span>
      </footer>
    </main>
  );
}
