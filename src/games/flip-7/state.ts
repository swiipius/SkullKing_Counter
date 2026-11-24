import {
  MAX_PLAYERS,
  MAX_TARGET,
  MIN_PLAYERS,
  MIN_TARGET,
  OFFICIAL_TARGET,
  bustHand,
  isValidHand,
  totals,
  winner,
  type Hand,
  type Round,
} from './rules';

export type Screen = 'setup' | 'round' | 'end';

export interface Game {
  id: string;
  players: string[];
  firstDealer: number;
  target: number;
  /** Current round, 1-based. */
  round: number;
  /** Cards entered for the current round; null = not entered yet. */
  hands: (Hand | null)[];
  history: Round[];
  /** Set when a winner is known. */
  winner: number | null;
}

export interface State {
  version: 1;
  screen: Screen;
  crew: { players: string[]; firstDealer: number };
  target: number;
  game: Game | null;
}

export type Action =
  | { type: 'go'; screen: Screen }
  | { type: 'crew/rename'; index: number; name: string }
  | { type: 'crew/add' }
  | { type: 'crew/remove'; index: number }
  | { type: 'crew/move'; index: number; delta: -1 | 1 }
  | { type: 'crew/dealer'; index: number }
  | { type: 'target'; value: number }
  | { type: 'start' }
  | { type: 'rematch' }
  | { type: 'hand'; index: number; hand: Hand | null }
  | { type: 'round/next' };

export const defaultName = (i: number) => `Joueur ${i + 1}`;

export function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('-');
}

export function initialState(players: string[] = ['', '', '']): State {
  return { version: 1, screen: 'setup', crew: { players, firstDealer: 0 }, target: OFFICIAL_TARGET, game: null };
}

const clampTarget = (v: number) => Math.min(MAX_TARGET, Math.max(MIN_TARGET, Math.round(v)));

function newGame(players: string[], firstDealer: number, target: number): Game {
  return { id: newId(), players, firstDealer, target, round: 1, hands: players.map(() => null), history: [], winner: null };
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const copy = list.slice();
  [copy[a], copy[b]] = [copy[b], copy[a]];
  return copy;
}

export function reducer(state: State, action: Action): State {
  const { crew, game } = state;
  switch (action.type) {
    case 'go':
      return { ...state, screen: action.screen };

    case 'crew/rename': {
      const players = crew.players.slice();
      players[action.index] = action.name.slice(0, 20);
      return { ...state, crew: { ...crew, players } };
    }
    case 'crew/add':
      if (crew.players.length >= MAX_PLAYERS) return state;
      return { ...state, crew: { ...crew, players: [...crew.players, ''] } };
    case 'crew/remove': {
      if (crew.players.length <= MIN_PLAYERS) return state;
      const players = crew.players.filter((_, i) => i !== action.index);
      let fd = crew.firstDealer;
      if (fd > action.index) fd -= 1;
      else if (fd === action.index) fd = Math.min(fd, players.length - 1);
      return { ...state, crew: { players, firstDealer: fd } };
    }
    case 'crew/move': {
      const from = action.index;
      const to = from + action.delta;
      if (to < 0 || to >= crew.players.length) return state;
      let fd = crew.firstDealer;
      if (fd === from) fd = to;
      else if (fd === to) fd = from;
      return { ...state, crew: { players: swap(crew.players, from, to), firstDealer: fd } };
    }
    case 'crew/dealer':
      return { ...state, crew: { ...crew, firstDealer: action.index } };

    case 'target':
      return { ...state, target: clampTarget(action.value) };

    case 'start': {
      const players = crew.players.map((n, i) => n.trim() || defaultName(i));
      return { ...state, crew: { ...crew, players }, screen: 'round', game: newGame(players, crew.firstDealer, state.target) };
    }

    case 'rematch': {
      if (!game) return state;
      const fd = (game.firstDealer + 1) % game.players.length;
      return { ...state, crew: { players: game.players, firstDealer: fd }, screen: 'round', game: newGame(game.players, fd, game.target) };
    }

    case 'hand': {
      if (!game || game.winner !== null) return state;
      if (action.hand !== null && !isValidHand(action.hand)) return state;
      const hands = game.hands.slice();
      hands[action.index] = action.hand;
      return { ...state, game: { ...game, hands } };
    }

    case 'round/next': {
      if (!game || !roundComplete(game) || game.winner !== null) return state;
      const history = [...game.history, { hands: game.hands as Hand[] }];
      const won = winner(totals(history, game.players.length), game.target);
      if (won !== null) return { ...state, screen: 'end', game: { ...game, history, winner: won } };
      return { ...state, game: { ...game, history, round: game.round + 1, hands: game.players.map(() => null) } };
    }
  }
}

/* ---------- selectors ---------- */

export const roundComplete = (g: Game) => g.hands.every((h) => h !== null);

export const dealerIndex = (g: Game) => (g.firstDealer + g.round - 1) % g.players.length;

/** Totals including the hands already entered for the current round. */
export function liveTotals(g: Game): number[] {
  if (g.winner !== null) return totals(g.history, g.players.length);
  // Hands not entered yet count as 0 for now.
  const current: Round = { hands: g.hands.map((h) => h ?? bustHand()) };
  return totals([...g.history, current], g.players.length);
}

export function ranking(g: Game) {
  const t = totals(g.history, g.players.length);
  const sorted = g.players.map((name, index) => ({ index, name, total: t[index], rank: 0 })).sort((a, b) => b.total - a.total);
  sorted.forEach((p, k) => {
    p.rank = k > 0 && sorted[k - 1].total === p.total ? sorted[k - 1].rank : k + 1;
  });
  return sorted;
}
