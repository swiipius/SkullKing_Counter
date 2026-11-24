import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { SKULL_KING, board, openDb, saveGame } from './db.ts';
import { validateFlip7 } from './flip7.ts';

const hand = (numbers: number[], mods: number[] = [], x2 = false) => ({ bust: false, numbers, mods, x2 });
const bust = { bust: true, numbers: [], mods: [], x2: false };

/** Ana scores 84 per round ((12+11+10+9) × 2), Ben busts every round. */
function anaWins(id: string, target: number) {
  const rounds = [];
  let total = 0;
  while (total < target) {
    rounds.push({ hands: [hand([12, 11, 10, 9], [], true), bust] });
    total += 84;
  }
  return { id, players: ['Ana', 'Ben'], target, rounds };
}

describe('validateFlip7', () => {
  it('accepts a game that ends when the target is reached', () => {
    const v = validateFlip7(anaWins('flip-0001', 150));
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.totals).toEqual([168, 0]);
  });

  it('only ranks 100, 150 and 200-point games', () => {
    expect(validateFlip7(anaWins('flip-0002', 120))).toEqual({ ok: false, error: 'target not ranked (100, 150 or 200 only)' });
  });

  it('rejects a game that is not finished', () => {
    const g = anaWins('flip-0003', 200);
    g.rounds.pop();
    expect(validateFlip7(g)).toEqual({ ok: false, error: 'game not finished' });
  });

  it('rejects rounds played after the game was already won', () => {
    const g = anaWins('flip-0004', 100);
    g.rounds.push({ hands: [bust, hand([3])] });
    expect(validateFlip7(g).ok).toBe(false);
  });

  it('a tie at the top keeps the game going', () => {
    const g = { id: 'flip-0005', players: ['Ana', 'Ben'], target: 100, rounds: [{ hands: [hand([12, 11, 10, 9], [10], true), hand([12, 11, 10, 9], [10], true)] }] };
    expect(validateFlip7(g)).toEqual({ ok: false, error: 'game not finished' });
  });

  it('rejects impossible cards', () => {
    const g = anaWins('flip-0006', 100);
    g.rounds[0].hands[0] = hand([12, 12]);
    expect(validateFlip7(g).ok).toBe(false);
  });
});

describe('boards per game and target', () => {
  it('keeps Skull King and each Flip 7 target apart', () => {
    const db = openDb(':memory:');
    const save = (body: ReturnType<typeof anaWins>) => {
      const v = validateFlip7(body);
      if (!v.ok) throw new Error(v.error);
      return saveGame(db, v.game, v.totals, { game: 'flip-7', target: v.game.target });
    };
    save(anaWins('flip-1001', 150));
    save(anaWins('flip-1002', 150));
    save(anaWins('flip-1003', 200));
    const b150 = board(db, { game: 'flip-7', target: 150 });
    expect(b150.games).toBe(2);
    expect(b150.wins).toEqual([{ rank: 1, name: 'Ana', wins: 2 }]);
    expect(board(db, { game: 'flip-7', target: 200 }).games).toBe(1);
    expect(board(db, SKULL_KING).games).toBe(0);
  });

  it('migrates a database created before the multi-game site', () => {
    const path = `/tmp/skullking-migration-${process.pid}.db`;
    const old = new DatabaseSync(path);
    old.exec(`
      CREATE TABLE games (id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT '', players TEXT NOT NULL, rounds TEXT NOT NULL);
      CREATE TABLE scores (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id TEXT NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL);
      INSERT INTO games (id, players, rounds) VALUES ('old-game-1', '["Léa","Hugo"]', '[]');
      INSERT INTO scores (game_id, name, score) VALUES ('old-game-1', 'Léa', 1100), ('old-game-1', 'Hugo', 550);
    `);
    old.close();
    const db = openDb(path);
    const sk = board(db, SKULL_KING);
    expect(sk.games).toBe(1);
    expect(sk.top[0]).toEqual({ rank: 1, name: 'Léa', score: 1100 });
    expect(board(db, { game: 'flip-7', target: 200 }).games).toBe(0);
    db.close();
  });
});
