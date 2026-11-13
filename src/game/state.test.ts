import { describe, expect, it } from 'vitest';
import {
  dealerIndex,
  initialState,
  isRoundComplete,
  liveTotals,
  ranking,
  reducer,
  type Action,
  type AppState,
} from './state';

const run = (actions: Action[], from: AppState = initialState()) => actions.reduce(reducer, from);

function startedGame(names = ['Ana', 'Ben', 'Cléo']) {
  let s = initialState();
  s = { ...s, crew: { players: names, firstDealer: 0 } };
  return reducer(s, { type: 'game/start' });
}

describe('crew setup', () => {
  it('fills empty names on start', () => {
    const s = run([{ type: 'crew/rename', index: 1, name: '  Marie ' }, { type: 'game/start' }]);
    expect(s.game?.players).toEqual(['Pirate 1', 'Marie', 'Pirate 3', 'Pirate 4']);
    expect(s.screen).toBe('deal');
  });
  it('keeps between 2 and 8 players', () => {
    let s = initialState();
    for (let i = 0; i < 10; i++) s = reducer(s, { type: 'crew/add' });
    expect(s.crew.players).toHaveLength(8);
    for (let i = 0; i < 10; i++) s = reducer(s, { type: 'crew/remove', index: 0 });
    expect(s.crew.players).toHaveLength(2);
  });
  it('moving a player keeps the first dealer on the same person', () => {
    let s = { ...initialState(), crew: { players: ['A', 'B', 'C'], firstDealer: 1 } };
    s = reducer(s, { type: 'crew/move', index: 1, delta: 1 });
    expect(s.crew.players).toEqual(['A', 'C', 'B']);
    expect(s.crew.firstDealer).toBe(2);
    s = reducer(s, { type: 'crew/move', index: 0, delta: -1 });
    expect(s.crew.players).toEqual(['A', 'C', 'B']);
  });
});

describe('a round', () => {
  it('bids start at 0 and are clamped to the cards dealt', () => {
    let s = startedGame();
    expect(s.game?.bids).toEqual([0, 0, 0]);
    s = reducer(s, { type: 'bid/set', index: 0, value: 5 });
    expect(s.game?.bids[0]).toBe(1); // round 1 = 1 card
    s = reducer(s, { type: 'bid/set', index: 0, value: -2 });
    expect(s.game?.bids[0]).toBe(0);
  });

  it('tricks can never exceed the cards dealt, minus works for corrections', () => {
    let s = startedGame();
    s = run([{ type: 'trick/add', index: 0, delta: 1 }, { type: 'trick/add', index: 1, delta: 1 }], s);
    expect(s.game?.tricks).toEqual([1, 0, 0]);
    expect(isRoundComplete(s.game!)).toBe(true);
    s = reducer(s, { type: 'trick/add', index: 0, delta: -1 });
    expect(isRoundComplete(s.game!)).toBe(false);
    s = reducer(s, { type: 'trick/add', index: 1, delta: -1 });
    expect(s.game?.tricks).toEqual([0, 0, 0]);
  });

  it('next round is refused until all tricks are played', () => {
    const s = reducer(startedGame(), { type: 'round/next' });
    expect(s.game?.round).toBe(1);
    expect(s.game?.history).toHaveLength(0);
  });

  it('locks the round and moves on with a new dealer', () => {
    let s = startedGame();
    s = run(
      [
        { type: 'bid/set', index: 0, value: 1 },
        { type: 'trick/add', index: 0, delta: 1 },
        { type: 'round/next' },
      ],
      s,
    );
    const g = s.game!;
    expect(g.round).toBe(2);
    expect(g.history).toEqual([{ bids: [1, 0, 0], tricks: [1, 0, 0] }]);
    expect(liveTotals(g, false)).toEqual([20, 10, 10]);
    expect(dealerIndex(g)).toBe(1);
    expect(g.bids).toEqual([0, 0, 0]);
    expect(s.screen).toBe('deal');
  });

  it('live totals include the projected current round', () => {
    let s = startedGame();
    s = reducer(s, { type: 'bid/set', index: 0, value: 1 });
    expect(liveTotals(s.game!, true)).toEqual([-10, 10, 10]);
    s = reducer(s, { type: 'trick/add', index: 0, delta: 1 });
    expect(liveTotals(s.game!, true)).toEqual([20, 10, 10]);
  });
});

describe('full game', () => {
  it('ends after round 10 and ranks the players', () => {
    let s = startedGame(['A', 'B']);
    for (let r = 1; r <= 10; r++) {
      // A bids everything and wins everything, B bids 0
      s = reducer(s, { type: 'bid/set', index: 0, value: r });
      for (let t = 0; t < r; t++) s = reducer(s, { type: 'trick/add', index: 0, delta: 1 });
      s = reducer(s, { type: 'round/next' });
    }
    expect(s.screen).toBe('end');
    const rank = ranking(s.game!);
    expect(rank[0]).toMatchObject({ name: 'A', total: 20 * 55, rank: 1 });
    expect(rank[1]).toMatchObject({ name: 'B', total: 10 * 55, rank: 2 });
  });

  it('rematch keeps the crew and moves the first dealer', () => {
    const s = reducer(startedGame(), { type: 'game/rematch' });
    expect(s.game?.players).toEqual(['Ana', 'Ben', 'Cléo']);
    expect(s.game?.firstDealer).toBe(1);
    expect(s.game?.history).toEqual([]);
  });
});

describe('home / resume', () => {
  it('remembers the screen to resume', () => {
    let s = startedGame();
    s = run([{ type: 'go', screen: 'bids' }, { type: 'goHome' }], s);
    expect(s.screen).toBe('home');
    s = reducer(s, { type: 'resume' });
    expect(s.screen).toBe('bids');
  });
});
