/**
 * Leaderboard API (Skull King, Flip 7) — runs on the Raspberry Pi (Docker), reached
 * only through the Vercel crew-code proxy, which adds the shared X-Api-Key header.
 *
 *   GET  /api/health                         → { ok: true }   (no key, for monitoring)
 *   GET  /api/skull-king/leaderboard         → { top, wins, games }
 *   POST /api/skull-king/games               → { top, wins, games, entries }  (10 rounds of bids + tricks)
 *   GET  /api/flip-7/leaderboard?target=150  → { top, wins, games }  (target 100, 150 or 200)
 *   POST /api/flip-7/games                   → { top, wins, games, entries }  (every round's cards)
 *   GET  /api/leaderboard, POST /api/games   → old Skull King paths, kept for phones with an older app
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { SKULL_KING, board, openDb, saveGame } from './db.ts';
import { validateFlip7 } from './flip7.ts';
import { validateGame } from './validate.ts';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';
const API_KEY = process.env.API_KEY ?? '';
const DB_PATH = process.env.DB_PATH ?? './leaderboard.db';
const MAX_BODY = 64 * 1024;

if (API_KEY.length < 8) {
  console.error('API_KEY is missing or too short (8 characters minimum).');
  process.exit(1);
}

const db = openDb(DB_PATH);

/* ---------- small helpers ---------- */

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function keyMatches(given: string | string[] | undefined): boolean {
  if (typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(API_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

/** At most 20 game submissions per minute per client (the proxy forwards the client IP). */
const hits = new Map<string, number[]>();
function rateLimited(req: IncomingMessage): boolean {
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '?').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 20;
}

/** Reads a game submission; answers the error itself and returns undefined when it can't. */
async function submission(req: IncomingMessage, res: ServerResponse): Promise<unknown> {
  if (rateLimited(req)) {
    send(res, 429, { error: 'too many requests' });
    return undefined;
  }
  try {
    return await readJson(req);
  } catch (err) {
    send(res, 400, { error: (err as Error).message });
    return undefined;
  }
}

/* ---------- routes ---------- */

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/health') return send(res, 200, { ok: true });
  if (!keyMatches(req.headers['x-api-key'])) return send(res, 401, { error: 'unauthorized' });

  try {
    // Skull King (new paths + the old ones used before the multi-game site)
    if (route === 'GET /api/skull-king/leaderboard' || route === 'GET /api/leaderboard') return send(res, 200, board(db, SKULL_KING));
    if (route === 'POST /api/skull-king/games' || route === 'POST /api/games') {
      const body = await submission(req, res);
      if (body === undefined) return;
      const check = validateGame(body);
      if (!check.ok) return send(res, 422, { error: check.error });
      const { created, entries } = saveGame(db, check.game, check.totals, SKULL_KING);
      return send(res, created ? 201 : 200, { ...board(db, SKULL_KING), entries });
    }

    // Flip 7: one board per target (100, 150, 200)
    if (route === 'GET /api/flip-7/leaderboard') {
      const target = Number(url.searchParams.get('target') ?? 200);
      if (![100, 150, 200].includes(target)) return send(res, 400, { error: 'target must be 100, 150 or 200' });
      return send(res, 200, board(db, { game: 'flip-7', target }));
    }
    if (route === 'POST /api/flip-7/games') {
      const body = await submission(req, res);
      if (body === undefined) return;
      const check = validateFlip7(body);
      if (!check.ok) return send(res, 422, { error: check.error });
      const key = { game: 'flip-7', target: check.game.target };
      const { created, entries } = saveGame(db, check.game, check.totals, key);
      return send(res, created ? 201 : 200, { ...board(db, key), entries });
    }

    return send(res, 404, { error: 'not found' });
  } catch (err) {
    console.error(route, err);
    return send(res, 500, { error: 'server error' });
  }
});

server.listen(PORT, HOST, () => console.log(`Leaderboard API on http://${HOST}:${PORT} (db: ${DB_PATH})`));

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close();
    db.close();
    process.exit(0);
  });
}
