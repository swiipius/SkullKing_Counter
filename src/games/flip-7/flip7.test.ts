import { describe, expect, it } from 'vitest';
import { bustHand, emptyHand, handScore, isValidHand, toggleMod, toggleNumber, toggleX2, winner, type Hand } from './rules';
import { initialState, liveTotals, ranking, reducer, roundComplete, type Action, type State } from './state';

const hand = (numbers: number[], mods: number[] = [], x2 = false): Hand => ({ bust: false, numbers, mods, x2 });

describe('handScore', () => {
  it('adds the number cards', () => {
    expect(handScore(hand([3, 7, 12]))).toBe(22);
  });
  it('0 counts as a card worth nothing', () => {
    expect(handScore(hand([0, 5]))).toBe(5);
  });
  it('×2 doubles the numbers only, then modifiers are added', () => {
    expect(handScore(hand([5, 10], [4, 6], true))).toBe(15 * 2 + 10);
  });
  it('modifiers score even without numbers; ×2 alone scores nothing', () => {
    expect(handScore(hand([], [8]))).toBe(8);
    expect(handScore(hand([], [], true))).toBe(0);
  });
  it('7 different numbers give the +15 Flip 7 bonus', () => {
    expect(handScore(hand([0, 1, 2, 3, 4, 5, 6]))).toBe(21 + 15);
    expect(handScore(hand([0, 1, 2, 3, 4, 5, 6], [10], true))).toBe(42 + 10 + 15);
  });
  it('a bust scores 0', () => {
    expect(handScore(bustHand())).toBe(0);
  });
});

describe('card toggles', () => {
  it('a number can be picked once and removed', () => {
    let h = toggleNumber(emptyHand(), 7);
    h = toggleNumber(h, 3);
    expect(h.numbers).toEqual([3, 7]);
    expect(toggleNumber(h, 7).numbers).toEqual([3]);
  });
  it('refuses an 8th number', () => {
    let h = emptyHand();
    for (const n of [0, 1, 2, 3, 4, 5, 6]) h = toggleNumber(h, n);
    expect(toggleNumber(h, 9).numbers).toHaveLength(7);
  });
  it('picking a card cancels a bust', () => {
    expect(toggleMod(bustHand(), 4)).toEqual(hand([], [4]));
    expect(toggleX2(bustHand()).bust).toBe(false);
  });
});

describe('isValidHand', () => {
  it('accepts real hands', () => {
    expect(isValidHand(hand([1, 12], [2, 10], true))).toBe(true);
    expect(isValidHand(bustHand())).toBe(true);
  });
  it.each([
    ['duplicate number', hand([5, 5])],
    ['number 13', hand([13])],
    ['eight numbers', hand([0, 1, 2, 3, 4, 5, 6, 7])],
    ['unknown modifier', hand([], [3])],
    ['bust with cards', { ...bustHand(), numbers: [4] }],
  ])('rejects %s', (_l, h) => {
    expect(isValidHand(h)).toBe(false);
  });
});

describe('winner', () => {
  it('nobody before the target', () => {
    expect(winner([140, 120], 150)).toBeNull();
  });
  it('the highest total once someone reaches it', () => {
    expect(winner([152, 171, 90], 150)).toBe(1);
  });
  it('a tie for the highest total plays another round', () => {
    expect(winner([171, 171, 90], 150)).toBeNull();
  });
});

const run = (actions: Action[], from: State) => actions.reduce(reducer, from);

describe('game flow', () => {
  const start = (target = 100) =>
    run([{ type: 'target', value: target }, { type: 'start' }], initialState(['Marie', 'Léa', '']));

  it('starts with the chosen target and default names', () => {
    const s = start(150);
    expect(s.game?.target).toBe(150);
    expect(s.game?.players).toEqual(['Marie', 'Léa', 'Joueur 3']);
    expect(s.screen).toBe('round');
  });

  it('clamps strange targets', () => {
    expect(run([{ type: 'target', value: 5 }], initialState()).target).toBe(20);
    expect(run([{ type: 'target', value: 99999 }], initialState()).target).toBe(1000);
  });

  it('waits for every player before the next round', () => {
    let s = start();
    s = reducer(s, { type: 'hand', index: 0, hand: hand([12, 11]) });
    expect(roundComplete(s.game!)).toBe(false);
    s = reducer(s, { type: 'round/next' });
    expect(s.game?.round).toBe(1);
    expect(liveTotals(s.game!)).toEqual([23, 0, 0]);
  });

  it('ends when someone reaches the target alone, and ranks the players', () => {
    let s = start(100);
    const play = (a: Hand, b: Hand, c: Hand) =>
      run(
        [
          { type: 'hand', index: 0, hand: a },
          { type: 'hand', index: 1, hand: b },
          { type: 'hand', index: 2, hand: c },
          { type: 'round/next' },
        ],
        s,
      );
    s = play(hand([12, 11, 10], [10]), hand([5]), bustHand()); // 43, 5, 0
    expect(s.game?.round).toBe(2);
    s = play(hand([12, 11, 10, 9], [], true), hand([3]), hand([1])); // +84 → 127
    expect(s.screen).toBe('end');
    expect(s.game?.winner).toBe(0);
    expect(ranking(s.game!).map((r) => r.name)).toEqual(['Marie', 'Léa', 'Joueur 3']);
    expect(reducer(s, { type: 'hand', index: 0, hand: hand([1]) })).toBe(s);
  });

  it('rematch keeps the players and target, next dealer', () => {
    const s = reducer(start(150), { type: 'rematch' });
    expect(s.game?.target).toBe(150);
    expect(s.game?.firstDealer).toBe(1);
    expect(s.game?.history).toEqual([]);
  });

  it('ignores an invalid hand', () => {
    const s = start();
    expect(reducer(s, { type: 'hand', index: 0, hand: hand([5, 5]) })).toBe(s);
  });
});
