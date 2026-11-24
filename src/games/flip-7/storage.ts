import { initialState, type State } from './state';

const KEY = 'flip7-counter:v1';
const SKULL_KING_KEY = 'skullking-counter:v1';

/** The crew last used in Skull King, offered when Flip 7 starts for the first time. */
function lastCrew(): string[] | null {
  try {
    const sk = JSON.parse(localStorage.getItem(SKULL_KING_KEY) ?? 'null') as { crew?: { players?: unknown } } | null;
    const players = sk?.crew?.players;
    if (Array.isArray(players) && players.length >= 2 && players.every((p) => typeof p === 'string')) return players as string[];
  } catch {
    /* ignore */
  }
  return null;
}

function isValid(s: unknown): s is State {
  if (!s || typeof s !== 'object') return false;
  const x = s as State;
  if (x.version !== 1 || !x.crew || !Array.isArray(x.crew.players) || typeof x.target !== 'number') return false;
  if (x.game) {
    const g = x.game;
    const n = g.players?.length ?? 0;
    if (n < 2 || !Array.isArray(g.hands) || g.hands.length !== n || !Array.isArray(g.history)) return false;
  }
  return true;
}

export function loadState(): State {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (isValid(parsed)) {
      if (!parsed.game && parsed.screen !== 'setup') parsed.screen = 'setup';
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return initialState(lastCrew() ?? undefined);
}

export function saveState(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

/** Summary for the landing page card. */
export function flip7Status(): { inProgress: boolean; label: string } {
  try {
    const s: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (isValid(s) && s.game) {
      const g = s.game;
      if (g.winner !== null) return { inProgress: true, label: `Partie terminée · ${g.players.length} joueurs` };
      return { inProgress: true, label: `Manche ${g.round} · objectif ${g.target} · ${g.players.length} joueurs` };
    }
  } catch {
    /* ignore */
  }
  return { inProgress: false, label: 'Aucune partie en cours' };
}
