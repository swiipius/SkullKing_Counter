/**
 * Flip 7 — scoring rules (The Op Games, ruleset 3.1).
 *
 * A round score depends only on the cards a player kept at the end of the round:
 *   bust → 0
 *   otherwise: (sum of number cards) × 2 if the ×2 card is kept
 *              + every +2…+10 modifier kept
 *              + 15 when 7 different numbers were collected ("Flip 7")
 * The game ends at the end of a round when someone has reached the target
 * (200 officially, chosen by the players here) with a single highest total;
 * a tie for the highest total plays another round.
 */

export const NUMBER_CARDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const MODIFIERS = [2, 4, 6, 8, 10] as const;
export const FLIP7_SIZE = 7;
export const FLIP7_BONUS = 15;
export const OFFICIAL_TARGET = 200;
export const TARGET_PRESETS = [100, 150, 200] as const;
export const MIN_TARGET = 20;
export const MAX_TARGET = 1000;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;

/** The cards one player kept at the end of a round. */
export interface Hand {
  bust: boolean;
  /** Distinct number cards, 0–12. */
  numbers: number[];
  /** Distinct +2…+10 modifiers. */
  mods: number[];
  x2: boolean;
}

export interface Round {
  hands: Hand[];
}

export const emptyHand = (): Hand => ({ bust: false, numbers: [], mods: [], x2: false });
export const bustHand = (): Hand => ({ bust: true, numbers: [], mods: [], x2: false });

export const isFlip7 = (h: Hand) => !h.bust && h.numbers.length >= FLIP7_SIZE;

export function handScore(h: Hand): number {
  if (h.bust) return 0;
  const numbers = h.numbers.reduce((a, n) => a + n, 0);
  const mods = h.mods.reduce((a, m) => a + m, 0);
  return numbers * (h.x2 ? 2 : 1) + mods + (isFlip7(h) ? FLIP7_BONUS : 0);
}

export function totals(rounds: Round[], playerCount: number): number[] {
  const sum = new Array<number>(playerCount).fill(0);
  for (const r of rounds) r.hands.forEach((h, i) => (sum[i] += handScore(h)));
  return sum;
}

/** Index of the winner once the game is over, or null while it goes on. */
export function winner(totalsNow: number[], target: number): number | null {
  const best = Math.max(...totalsNow);
  if (best < target) return null;
  const leaders = totalsNow.filter((t) => t === best).length;
  return leaders === 1 ? totalsNow.indexOf(best) : null;
}

/** Toggle a number card; refused when 7 numbers are already picked. */
export function toggleNumber(h: Hand, n: number): Hand {
  if (h.numbers.includes(n)) return { ...h, bust: false, numbers: h.numbers.filter((x) => x !== n) };
  if (h.numbers.length >= FLIP7_SIZE) return h;
  return { ...h, bust: false, numbers: [...h.numbers, n].sort((a, b) => a - b) };
}

export function toggleMod(h: Hand, m: number): Hand {
  const mods = h.mods.includes(m) ? h.mods.filter((x) => x !== m) : [...h.mods, m].sort((a, b) => a - b);
  return { ...h, bust: false, mods };
}

export const toggleX2 = (h: Hand): Hand => ({ ...h, bust: false, x2: !h.x2 });

/** Checks a hand sent by a phone (used by the leaderboard server too). */
export function isValidHand(h: unknown): h is Hand {
  if (!h || typeof h !== 'object') return false;
  const x = h as Hand;
  if (typeof x.bust !== 'boolean' || typeof x.x2 !== 'boolean') return false;
  if (!Array.isArray(x.numbers) || !Array.isArray(x.mods)) return false;
  if (x.numbers.length > FLIP7_SIZE || new Set(x.numbers).size !== x.numbers.length) return false;
  if (!x.numbers.every((n) => (NUMBER_CARDS as readonly number[]).includes(n))) return false;
  if (new Set(x.mods).size !== x.mods.length || !x.mods.every((m) => (MODIFIERS as readonly number[]).includes(m))) return false;
  if (x.bust && (x.numbers.length > 0 || x.mods.length > 0 || x.x2)) return false;
  return true;
}
