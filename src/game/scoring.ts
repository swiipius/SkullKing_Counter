/**
 * Skull King — classic scoring ("Skull King's scoring"), official 2021 rules.
 * v1 scope: no bonus points, no Rascal scoring, no Kraken.
 */

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const ROUND_COUNT = 10;

/** One played round: the bid and the tricks won, one entry per player (table order). */
export interface RoundRecord {
  bids: number[];
  tricks: number[];
}

/**
 * Cards dealt in a round. Round n deals n cards; with 8 players the deck
 * runs out, so rounds 9 and 10 deal 8 cards (official rule: repeat the count).
 */
export function cardsForRound(round: number, playerCount: number): number {
  return playerCount >= 8 ? Math.min(round, 8) : round;
}

/**
 * Points for one player in one round.
 * - bid ≥ 1, exact: +20 per trick won
 * - bid ≥ 1, missed: −10 per trick of difference
 * - bid 0, no trick: +10 × cards dealt
 * - bid 0, at least one trick: −10 × cards dealt
 */
export function roundScore(bid: number, tricks: number, cards: number): number {
  if (bid === 0) return tricks === 0 ? 10 * cards : -10 * cards;
  return bid === tricks ? 20 * bid : -10 * Math.abs(bid - tricks);
}

/** Points of every player for one recorded round. */
export function roundScores(record: RoundRecord, round: number): number[] {
  const cards = cardsForRound(round, record.bids.length);
  return record.bids.map((bid, i) => roundScore(bid, record.tricks[i] ?? 0, cards));
}

/** Running totals after all recorded rounds. */
export function totals(history: RoundRecord[], playerCount: number): number[] {
  const sum = new Array<number>(playerCount).fill(0);
  history.forEach((record, r) => {
    roundScores(record, r + 1).forEach((v, i) => {
      sum[i] += v;
    });
  });
  return sum;
}

export type Status =
  | { kind: 'dry' } // bid 0, no trick yet: "Au sec"
  | { kind: 'made' } // tricks === bid: "Cap tenu !"
  | { kind: 'need'; missing: number } // still tricks to win: "Encore X plis"
  | { kind: 'sunk' }; // over the bid, or round over and under it: "Coulé !"

/** Live status of a player during a round. */
export function playerStatus(bid: number, tricks: number, roundOver: boolean): Status {
  if (bid === 0) return tricks === 0 ? { kind: 'dry' } : { kind: 'sunk' };
  if (tricks === bid) return { kind: 'made' };
  if (tricks > bid || roundOver) return { kind: 'sunk' };
  return { kind: 'need', missing: bid - tricks };
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
