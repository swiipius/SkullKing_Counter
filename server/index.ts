/**
 * Skull King leaderboard API — runs on the Raspberry Pi (Docker), reached only
 * through the Vercel crew-code proxy, which adds the shared X-Api-Key header.
 *
 *   GET  /api/health        → { ok: true }            (no key, for monitoring)
 *   GET  /api/leaderboard   → { top, games }
 *   POST /api/games         → { top, games, entries }  (a finished game: players + 10 rounds)
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { board, openDb, saveGame } from './db.ts';
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

/* ---------- routes ---------- */

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/health') return send(res, 200, { ok: true });
  if (!keyMatches(req.headers['x-api-key'])) return send(res, 401, { error: 'unauthorized' });

  try {
    if (route === 'GET /api/leaderboard') return send(res, 200, board(db));

    if (route === 'POST /api/games') {
      if (rateLimited(req)) return send(res, 429, { error: 'too many requests' });
      let body: unknown;
      try {
        body = await readJson(req);
      } catch (err) {
        return send(res, 400, { error: (err as Error).message });
      }
      const check = validateGame(body);
      if (!check.ok) return send(res, 422, { error: check.error });
      const { created, entries } = saveGame(db, check.game, check.totals);
      return send(res, created ? 201 : 200, { ...board(db), entries });
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
