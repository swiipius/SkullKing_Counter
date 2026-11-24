import { initialState, type AppState } from './state';

const KEY = 'skullking-counter:v1';

function isNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'number' && Number.isFinite(x));
}

/** Light shape check so a corrupted or old save never crashes the app. */
function isValid(s: unknown): s is AppState {
  if (!s || typeof s !== 'object') return false;
  const a = s as AppState;
  if (a.version !== 1 || typeof a.screen !== 'string') return false;
  if (!a.crew || !Array.isArray(a.crew.players)) return false;
  if (a.game) {
    const g = a.game;
    const n = g.players?.length ?? 0;
    if (n < 2 || !isNumberArray(g.bids) || !isNumberArray(g.tricks)) return false;
    if (g.bids.length !== n || g.tricks.length !== n || !Array.isArray(g.history)) return false;
  }
  return true;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed)) return initialState();
    if (!parsed.game && parsed.screen !== 'setup') parsed.screen = 'home';
    return parsed;
  } catch {
    return initialState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode or storage full: the game still works, it just won't survive a reload */
  }
}

/** Summary for the landing page card. */
export function skullKingStatus(): { inProgress: boolean; label: string } {
  try {
    const raw = localStorage.getItem(KEY);
    const s: unknown = raw ? JSON.parse(raw) : null;
    if (isValid(s) && s.game) {
      const g = s.game;
      const n = g.players.length;
      if (g.history.length >= 10) return { inProgress: true, label: `Partie terminée · ${n} pirates` };
      return { inProgress: true, label: `Partie en cours · manche ${g.round} · ${n} pirates` };
    }
  } catch {
    /* ignore */
  }
  return { inProgress: false, label: 'Aucune partie en cours' };
}
