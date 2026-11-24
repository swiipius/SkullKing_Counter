import { DatabaseSync } from 'node:sqlite';

export const TOP_SIZE = 10;

/** Which leaderboard a game belongs to. Skull King has one board (target 0); Flip 7 one per target. */
export interface BoardKey {
  game: string;
  target: number;
}

export const SKULL_KING: BoardKey = { game: 'skull-king', target: 0 };

export interface TopEntry {
  rank: number;
  name: string;
  score: number;
}

export interface WinEntry {
  /** Shared rank when several players have the same number of wins. */
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
  /** Position among all scores of the same board (1 = best). */
  position: number;
  /** True when the score is in the top 10. */
  inTop: boolean;
}

/** A validated game ready to store: raw rounds are kept so scores can be re-checked later. */
export interface StoredGame {
  id: string;
  players: string[];
  rounds: unknown[];
}

function columns(db: DatabaseSync, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[]).map((c) => c.name);
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
  `);
  // Migration (v1 → v2): every table learns which game and target it belongs to.
  // Rows from before the multi-game site are Skull King games.
  for (const table of ['games', 'scores']) {
    const cols = columns(db, table);
    if (!cols.includes('game')) db.exec(`ALTER TABLE ${table} ADD COLUMN game TEXT NOT NULL DEFAULT 'skull-king'`);
    if (!cols.includes('target')) db.exec(`ALTER TABLE ${table} ADD COLUMN target INTEGER NOT NULL DEFAULT 0`);
  }
  db.exec(`
    DROP INDEX IF EXISTS scores_rank;
    CREATE INDEX IF NOT EXISTS scores_board_rank ON scores (game, target, score DESC, id ASC);
    CREATE INDEX IF NOT EXISTS scores_game ON scores (game_id);
  `);
  return db;
}

export function board(db: DatabaseSync, key: BoardKey = SKULL_KING): Board {
  const rows = db
    .prepare('SELECT name, score FROM scores WHERE game = ? AND target = ? ORDER BY score DESC, id ASC LIMIT ?')
    .all(key.game, key.target, TOP_SIZE) as unknown as { name: string; score: number }[];
  const { games } = db.prepare('SELECT COUNT(*) AS games FROM games WHERE game = ? AND target = ?').get(key.game, key.target) as { games: number };
  return { top: rows.map((r, i) => ({ rank: i + 1, name: r.name, score: r.score })), wins: winsBoard(db, key), games };
}

/**
 * Players with the most victories. A victory = the best total of a game; a tie for
 * first gives a victory to each tied player. Names are grouped without case
 * ("marie" = "Marie") and shown with their latest spelling.
 */
export function winsBoard(db: DatabaseSync, key: BoardKey = SKULL_KING): WinEntry[] {
  const rows = db
    .prepare(
      `SELECT s.name AS name, COUNT(*) AS wins, MAX(s.id) AS last
         FROM scores s
         JOIN (SELECT game_id, MAX(score) AS best FROM scores WHERE game = ? AND target = ? GROUP BY game_id) b
           ON b.game_id = s.game_id AND s.score = b.best
        GROUP BY LOWER(s.name)
        ORDER BY wins DESC, LOWER(s.name) ASC
        LIMIT ?`,
    )
    .all(key.game, key.target, TOP_SIZE) as unknown as { name: string; wins: number }[];
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
              1 + (SELECT COUNT(*) FROM scores o
                    WHERE o.game = s.game AND o.target = s.target
                      AND (o.score > s.score OR (o.score = s.score AND o.id < s.id))) AS position
         FROM scores s WHERE s.game_id = ? ORDER BY s.id`,
    )
    .all(gameId) as unknown as { name: string; score: number; position: number }[];
  return rows.map((r) => ({ ...r, inTop: r.position <= TOP_SIZE }));
}

/**
 * Stores a validated game and one score per player. Sending the same game twice
 * (retry after a network error) stores nothing new and returns the same result.
 */
export function saveGame(
  db: DatabaseSync,
  game: StoredGame,
  totals: number[],
  key: BoardKey = SKULL_KING,
): { created: boolean; entries: SubmittedEntry[] } {
  db.exec('BEGIN IMMEDIATE');
  try {
    const res = db
      .prepare('INSERT OR IGNORE INTO games (id, players, rounds, game, target) VALUES (?, ?, ?, ?, ?)')
      .run(game.id, JSON.stringify(game.players), JSON.stringify(game.rounds), key.game, key.target);
    const created = Number(res.changes) > 0;
    if (created) {
      const insert = db.prepare('INSERT INTO scores (game_id, name, score, game, target) VALUES (?, ?, ?, ?, ?)');
      game.players.forEach((name, i) => insert.run(game.id, name, totals[i], key.game, key.target));
    }
    db.exec('COMMIT');
    return { created, entries: entriesFor(db, game.id) };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
