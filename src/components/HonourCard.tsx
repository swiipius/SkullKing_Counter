import { useEffect, useState } from 'preact/hooks';
import { newId, type Game } from '../game/state';
import { enqueue, flushOutbox, statusOf, type SubmitStatus } from '../leaderboard/api';
import { Chest } from './Icons';

const ordinal = (n: number) => (n === 1 ? '1re' : `${n}e`);

function headline(status: Extract<SubmitStatus, { kind: 'done' }>): { title: string; detail: string } {
  const inTop = status.entries.filter((e) => e.inTop).sort((a, b) => a.position - b.position);
  if (inTop.length === 0) {
    return {
      title: 'Scores enregistrés',
      detail: `Personne n'entre dans le top 10 cette fois.${status.best !== null ? ` Le meilleur à battre : ${status.best}.` : ''}`,
    };
  }
  if (inTop.length === 1) {
    const e = inTop[0];
    return { title: `${e.name} entre au tableau d'honneur à la ${ordinal(e.position)} place !`, detail: 'Scores de la partie enregistrés.' };
  }
  if (inTop.length > 3) {
    const lead = inTop[0];
    return {
      title: `${inTop.length} pirates entrent au tableau d'honneur, ${lead.name} à la ${ordinal(lead.position)} place !`,
      detail: 'Scores de la partie enregistrés.',
    };
  }
  const names = inTop.map((e) => `${e.name} (${ordinal(e.position)})`);
  const list = `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
  return { title: `${list} entrent au tableau d'honneur !`, detail: 'Scores de la partie enregistrés.' };
}

/** Sends the finished game once, then shows how the crew did on the leaderboard. */
export function HonourCard({ game, onOpenBoard }: { game: Game; onOpenBoard: () => void }) {
  const [id] = useState(() => game.id ?? newId());
  const [status, setStatus] = useState<SubmitStatus>(() => statusOf(id) ?? { kind: 'sending' });

  useEffect(() => {
    enqueue({ id, players: game.players, rounds: game.history });
    const refresh = () => flushOutbox().then(() => setStatus(statusOf(id) ?? { kind: 'offline' }));
    refresh();
    window.addEventListener('online', refresh);
    return () => window.removeEventListener('online', refresh);
  }, [id]);

  if (status.kind === 'sending') {
    return (
      <div class="honour-card honour-card--muted" role="status">
        <Chest size={30} />
        <div>
          <strong>Envoi au tableau d'honneur…</strong>
        </div>
      </div>
    );
  }

  if (status.kind === 'offline') {
    return (
      <div class="honour-card honour-card--muted" role="status">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0M3 3l18 18" />
        </svg>
        <div>
          <strong>Pas de réseau à bord</strong>
          <span>Les scores partiront tout seuls dès le retour de la connexion.</span>
        </div>
      </div>
    );
  }

  if (status.kind === 'error') {
    return (
      <div class="honour-card honour-card--muted" role="status">
        <div>
          <strong>Scores non enregistrés</strong>
          <span>Le tableau d'honneur a refusé cette partie ({status.message}).</span>
        </div>
      </div>
    );
  }

  const { title, detail } = headline(status);
  const glory = status.entries.some((e) => e.inTop);
  return (
    <div class={`honour-card ${glory ? 'honour-card--glory' : ''}`} role="status">
      <Chest size={34} />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
        <button type="button" class="link-btn" onClick={onOpenBoard}>
          Voir le tableau d'honneur
        </button>
      </div>
    </div>
  );
}
