import { DatabaseSync } from 'node:sqlite';
import type { GameSubmission } from './validate.ts';

export const TOP_SIZE = 10;

export interface TopEntry {
  rank: number;
  name: string;
  score: number;
}

export interface WinEntry {
  /** Shared rank when several captains have the same number of wins. */
  rank: number;
  name: string;
  wins: number;
}

export interface Board {
  top: TopEntry[];
  wins: WinEntry[];
  games: number;
}

export interface SubmittedEntry {
  name: string;
  score: number;
  /** Position among all scores ever recorded (1 = best). */
  position: number;
  /** True when the score is in the top 10. */
  inTop: boolean;
}

export function openDb(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS games (
      id         TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      players    TEXT NOT NULL,
      rounds     TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scores (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      name    TEXT NOT NULL,
      score   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS scores_rank ON scores (score DESC, id ASC);
    CREATE INDEX IF NOT EXISTS scores_game ON scores (game_id);
  `);
  return db;
}

export function board(db: DatabaseSync): Board {
  const rows = db
    .prepare('SELECT name, score FROM scores ORDER BY score DESC, id ASC LIMIT ?')
    .all(TOP_SIZE) as unknown as { name: string; score: number }[];
  const { games } = db.prepare('SELECT COUNT(*) AS games FROM games').get() as { games: number };
  return { top: rows.map((r, i) => ({ rank: i + 1, name: r.name, score: r.score })), wins: winsBoard(db), games };
}

/**
 * Captains with the most victories. A victory = the best total of a game; a tie for
 * first gives a victory to each tied player. Names are grouped without case
 * ("marie" = "Marie") and shown with their latest spelling.
 */
export function winsBoard(db: DatabaseSync): WinEntry[] {
  const rows = db
    .prepare(
      `SELECT s.name AS name, COUNT(*) AS wins, MAX(s.id) AS last
         FROM scores s
         JOIN (SELECT game_id, MAX(score) AS best FROM scores GROUP BY game_id) b
           ON b.game_id = s.game_id AND s.score = b.best
        GROUP BY LOWER(s.name)
        ORDER BY wins DESC, LOWER(s.name) ASC
        LIMIT ?`,
    )
    .all(TOP_SIZE) as unknown as { name: string; wins: number }[];
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || rows[i - 1].wins !== r.wins) rank = i + 1;
    return { rank, name: r.name, wins: r.wins };
  });
}

function entriesFor(db: DatabaseSync, gameId: string): SubmittedEntry[] {
  const rows = db
    .prepare(
      `SELECT s.name, s.score,
              1 + (SELECT COUNT(*) FROM scores o WHERE o.score > s.score OR (o.score = s.score AND o.id < s.id)) AS position
         FROM scores s WHERE s.game_id = ? ORDER BY s.id`,
    )
    .all(gameId) as unknown as { name: string; score: number; position: number }[];
  return rows.map((r) => ({ ...r, inTop: r.position <= TOP_SIZE }));
}

/**
 * Stores a validated game and one score per player. Sending the same game twice
 * (retry after a network error) stores nothing new and returns the same result.
 */
export function saveGame(db: DatabaseSync, game: GameSubmission, totals: number[]): { created: boolean; entries: SubmittedEntry[] } {
  db.exec('BEGIN IMMEDIATE');
  try {
    const res = db
      .prepare('INSERT OR IGNORE INTO games (id, players, rounds) VALUES (?, ?, ?)')
      .run(game.id, JSON.stringify(game.players), JSON.stringify(game.rounds));
    const created = Number(res.changes) > 0;
    if (created) {
      const insert = db.prepare('INSERT INTO scores (game_id, name, score) VALUES (?, ?, ?)');
      game.players.forEach((name, i) => insert.run(game.id, name, totals[i]));
    }
    db.exec('COMMIT');
    return { created, entries: entriesFor(db, game.id) };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
