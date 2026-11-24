import { describe, expect, it } from 'vitest';
import { cardsForRound, playerStatus, roundScore, roundScores, totals } from './scoring';

describe('cardsForRound', () => {
  it('deals n cards in round n', () => {
    for (let r = 1; r <= 10; r++) expect(cardsForRound(r, 5)).toBe(r);
  });
  it('deals 10 cards in round 10 with 7 players', () => {
    expect(cardsForRound(10, 7)).toBe(10);
  });
  it('caps at 8 cards with 8 players (rounds 9 and 10)', () => {
    expect(cardsForRound(8, 8)).toBe(8);
    expect(cardsForRound(9, 8)).toBe(8);
    expect(cardsForRound(10, 8)).toBe(8);
  });
});

describe('roundScore — bid of 1 or more', () => {
  it('exact bid scores 20 per trick', () => {
    expect(roundScore(1, 1, 5)).toBe(20);
    expect(roundScore(3, 3, 5)).toBe(60);
    expect(roundScore(10, 10, 10)).toBe(200);
  });
  it('missed bid loses 10 per trick of difference, over or under', () => {
    expect(roundScore(2, 1, 5)).toBe(-10);
    expect(roundScore(2, 4, 5)).toBe(-20);
    expect(roundScore(5, 0, 5)).toBe(-50);
  });
  it('tricks won on a missed bid score nothing', () => {
    expect(roundScore(1, 3, 3)).toBe(-20);
  });
});

describe('roundScore — bid of 0', () => {
  it('no trick scores 10 × cards dealt', () => {
    expect(roundScore(0, 0, 1)).toBe(10);
    expect(roundScore(0, 0, 7)).toBe(70);
  });
  it('any trick loses 10 × cards dealt, whatever the number of tricks', () => {
    expect(roundScore(0, 1, 7)).toBe(-70);
    expect(roundScore(0, 4, 7)).toBe(-70);
  });
  it('uses the capped card count with 8 players', () => {
    expect(roundScore(0, 0, cardsForRound(10, 8))).toBe(80);
  });
});

describe('roundScores / totals', () => {
  it('scores a recorded round for every player', () => {
    expect(roundScores({ bids: [2, 0, 1], tricks: [2, 0, 1] }, 3)).toEqual([40, 30, 20]);
  });
  it('sums the history', () => {
    const history = [
      { bids: [1, 0], tricks: [1, 0] }, // round 1: +20, +10
      { bids: [0, 2], tricks: [1, 1] }, // round 2: -20, -10
    ];
    expect(totals(history, 2)).toEqual([0, 0]);
  });
});

describe('playerStatus', () => {
  it('bid 0', () => {
    expect(playerStatus(0, 0, false)).toEqual({ kind: 'dry' });
    expect(playerStatus(0, 1, false)).toEqual({ kind: 'sunk' });
  });
  it('bid ≥ 1 during the round', () => {
    expect(playerStatus(3, 1, false)).toEqual({ kind: 'need', missing: 2 });
    expect(playerStatus(3, 3, false)).toEqual({ kind: 'made' });
    expect(playerStatus(3, 4, false)).toEqual({ kind: 'sunk' });
  });
  it('under the bid once the round is over is sunk', () => {
    expect(playerStatus(3, 1, true)).toEqual({ kind: 'sunk' });
  });
});
