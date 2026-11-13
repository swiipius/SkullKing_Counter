import { describe, expect, it } from 'vitest';
import { board, openDb, saveGame } from './db.ts';
import { validateGame } from './validate.ts';

/** A complete 10-round game where `winner` bids and wins every trick, the others bid 0. */
function game(id: string, players: string[], winner = 0) {
  const rounds = Array.from({ length: 10 }, (_, r) => {
    const cards = players.length >= 8 ? Math.min(r + 1, 8) : r + 1;
    const bids = players.map((_, i) => (i === winner ? cards : 0));
    const tricks = players.map((_, i) => (i === winner ? cards : 0));
    return { bids, tricks };
  });
  return { id, players, rounds };
}

describe('validateGame', () => {
  it('accepts a complete game and recomputes the totals', () => {
    const v = validateGame(game('game-0001', ['Ana', 'Ben']));
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.totals).toEqual([20 * 55, 10 * 55]);
  });

  it('trims names', () => {
    const v = validateGame(game('game-0002', ['  Ana ', 'Ben']));
    expect(v.ok && v.game.players[0]).toBe('Ana');
  });

  it.each([
    ['missing id', { ...game('x', ['A', 'B']), id: undefined }],
    ['short id', game('abc', ['A', 'B'])],
    ['one player', game('game-0003', ['A'])],
    ['nine players', game('game-0004', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])],
    ['empty name', game('game-0005', ['A', '  '])],
    ['html in name', game('game-0006', ['<b>A</b>', 'B'])],
  ])('rejects %s', (_label, body) => {
    expect(validateGame(body).ok).toBe(false);
  });

  it('rejects tricks that do not add up to the cards dealt', () => {
    const g = game('game-0007', ['A', 'B']);
    g.rounds[4].tricks = [0, 0];
    expect(validateGame(g)).toEqual({ ok: false, error: 'round 5: tricks must add up to 5' });
  });

  it('rejects a bid above the cards dealt', () => {
    const g = game('game-0008', ['A', 'B']);
    g.rounds[0].bids = [2, 0];
    expect(validateGame(g).ok).toBe(false);
  });

  it('rejects a game that is not finished', () => {
    const g = game('game-0009', ['A', 'B']);
    g.rounds.pop();
    expect(validateGame(g).ok).toBe(false);
  });

  it('caps the cards at 8 with 8 players', () => {
    expect(validateGame(game('game-0010', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])).ok).toBe(true);
  });
});

describe('database', () => {
  const save = (db: ReturnType<typeof openDb>, body: ReturnType<typeof game>) => {
    const v = validateGame(body);
    if (!v.ok) throw new Error(v.error);
    return saveGame(db, v.game, v.totals);
  };

  it('stores every player and ranks the scores', () => {
    const db = openDb(':memory:');
    const r = save(db, game('game-1000', ['Ana', 'Ben', 'Cléo'], 1));
    expect(r.created).toBe(true);
    expect(r.entries.map((e) => [e.name, e.score, e.position])).toEqual([
      ['Ana', 550, 2],
      ['Ben', 1100, 1],
      ['Cléo', 550, 3],
    ]);
    const b = board(db);
    expect(b.games).toBe(1);
    expect(b.top.map((t) => t.name)).toEqual(['Ben', 'Ana', 'Cléo']);
  });

  it('ignores the same game sent twice', () => {
    const db = openDb(':memory:');
    save(db, game('game-2000', ['Ana', 'Ben']));
    const again = save(db, game('game-2000', ['Ana', 'Ben']));
    expect(again.created).toBe(false);
    expect(again.entries).toHaveLength(2);
    expect(board(db).games).toBe(1);
  });

  it('keeps only the 10 best scores and allows the same name twice', () => {
    const db = openDb(':memory:');
    for (let g = 0; g < 7; g++) save(db, game(`game-30${g}0`, ['Marie', 'Hugo'], g % 2));
    const b = board(db);
    expect(b.top).toHaveLength(10);
    expect(b.top.filter((t) => t.name === 'Marie').length).toBeGreaterThan(1);
    expect(b.top.map((t) => t.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const last = save(db, game('game-9999', ['Zoé', 'Noa'], 0));
    expect(last.entries.find((e) => e.name === 'Noa')?.inTop).toBe(false);
  });
});
