import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_COUNT,
  cardsForRound,
  roundScore,
  sum,
  totals,
  type RoundRecord,
} from './scoring';

export type Screen = 'home' | 'setup' | 'deal' | 'bids' | 'play' | 'end' | 'leaderboard';

const GAME_SCREENS: Screen[] = ['deal', 'bids', 'play', 'end'];

export interface Game {
  /** Unique id, sent with the scores so a retry never counts a game twice. */
  id?: string;
  players: string[];
  firstDealer: number;
  /** Current round, 1-based. */
  round: number;
  bids: number[];
  tricks: number[];
  /** Closed rounds, oldest first: history[r - 1] is round r. */
  history: RoundRecord[];
}

export interface Crew {
  players: string[];
  firstDealer: number;
}

export interface AppState {
  version: 1;
  screen: Screen;
  crew: Crew;
  game: Game | null;
  /** Where "Reprendre la partie" goes back to. */
  resumeScreen: Screen;
}

export type Action =
  | { type: 'go'; screen: Screen }
  | { type: 'goHome' }
  | { type: 'resume' }
  | { type: 'crew/rename'; index: number; name: string }
  | { type: 'crew/add' }
  | { type: 'crew/remove'; index: number }
  | { type: 'crew/move'; index: number; delta: -1 | 1 }
  | { type: 'crew/dealer'; index: number }
  | { type: 'game/start' }
  | { type: 'game/rematch' }
  | { type: 'bid/set'; index: number; value: number }
  | { type: 'trick/add'; index: number; delta: -1 | 1 }
  | { type: 'round/next' };

export function initialState(): AppState {
  return {
    version: 1,
    screen: 'home',
    crew: { players: ['', '', '', ''], firstDealer: 0 },
    game: null,
    resumeScreen: 'deal',
  };
}

export const defaultName = (index: number) => `Pirate ${index + 1}`;

const zeros = (n: number) => new Array<number>(n).fill(0);

/** Random id; crypto.randomUUID needs HTTPS, so fall back on Math.random over plain HTTP (LAN dev). */
export function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('-');
}

function newGame(players: string[], firstDealer: number): Game {
  return { id: newId(), players, firstDealer, round: 1, bids: zeros(players.length), tricks: zeros(players.length), history: [] };
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const copy = list.slice();
  [copy[a], copy[b]] = [copy[b], copy[a]];
  return copy;
}

export function reducer(state: AppState, action: Action): AppState {
  const { crew, game } = state;
  switch (action.type) {
    case 'go':
      return { ...state, screen: action.screen };

    case 'goHome': {
      const inGame = GAME_SCREENS.includes(state.screen);
      return { ...state, screen: 'home', resumeScreen: inGame ? state.screen : state.resumeScreen };
    }

    case 'resume':
      return game ? { ...state, screen: state.resumeScreen } : state;

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

    case 'game/start': {
      const players = crew.players.map((n, i) => n.trim() || defaultName(i));
      return {
        ...state,
        crew: { ...crew, players },
        game: newGame(players, crew.firstDealer),
        screen: 'deal',
        resumeScreen: 'deal',
      };
    }

    case 'game/rematch': {
      if (!game) return state;
      const fd = (game.firstDealer + 1) % game.players.length;
      return {
        ...state,
        crew: { players: game.players, firstDealer: fd },
        game: newGame(game.players, fd),
        screen: 'deal',
        resumeScreen: 'deal',
      };
    }

    case 'bid/set': {
      if (!game) return state;
      const cards = cardsForRound(game.round, game.players.length);
      const bids = game.bids.slice();
      bids[action.index] = Math.max(0, Math.min(cards, Math.round(action.value)));
      return { ...state, game: { ...game, bids } };
    }

    case 'trick/add': {
      if (!game) return state;
      const cards = cardsForRound(game.round, game.players.length);
      const current = game.tricks[action.index];
      if (action.delta > 0 && sum(game.tricks) >= cards) return state;
      if (action.delta < 0 && current <= 0) return state;
      const tricks = game.tricks.slice();
      tricks[action.index] = current + action.delta;
      return { ...state, game: { ...game, tricks } };
    }

    case 'round/next': {
      if (!game || !isRoundComplete(game)) return state;
      const history = [...game.history, { bids: game.bids.slice(), tricks: game.tricks.slice() }];
      if (game.round >= ROUND_COUNT) {
        return { ...state, game: { ...game, history }, screen: 'end', resumeScreen: 'end' };
      }
      const n = game.players.length;
      return {
        ...state,
        game: { ...game, history, round: game.round + 1, bids: zeros(n), tricks: zeros(n) },
        screen: 'deal',
        resumeScreen: 'deal',
      };
    }
  }
}

/* ---------- selectors ---------- */

export const currentCards = (game: Game) => cardsForRound(game.round, game.players.length);

export const dealerIndex = (game: Game) => (game.firstDealer + game.round - 1) % game.players.length;

export const isRoundComplete = (game: Game) => sum(game.tricks) >= currentCards(game);

export const isFinished = (game: Game) => game.history.length >= ROUND_COUNT;

/** Points each player would get if the current round ended now. */
export function projectedRound(game: Game): number[] {
  const cards = currentCards(game);
  return game.bids.map((bid, i) => roundScore(bid, game.tricks[i], cards));
}

/** Totals, optionally including the live projection of the current round. */
export function liveTotals(game: Game, includeCurrent: boolean): number[] {
  const base = totals(game.history, game.players.length);
  if (!includeCurrent || isFinished(game)) return base;
  const proj = projectedRound(game);
  return base.map((v, i) => v + proj[i]);
}

export interface Ranked {
  index: number;
  name: string;
  total: number;
  rank: number;
}

/** Players sorted by total, ties share a rank. */
export function ranking(game: Game): Ranked[] {
  const t = liveTotals(game, false);
  const sorted = game.players
    .map((name, index) => ({ index, name, total: t[index], rank: 0 }))
    .sort((a, b) => b.total - a.total);
  sorted.forEach((p, k) => {
    p.rank = k > 0 && sorted[k - 1].total === p.total ? sorted[k - 1].rank : k + 1;
  });
  return sorted;
}
