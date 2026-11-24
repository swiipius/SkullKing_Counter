import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_COUNT,
  cardsForRound,
  totals,
  type RoundRecord,
} from '../src/games/skull-king/game/scoring.ts';

export interface GameSubmission {
  id: string;
  players: string[];
  rounds: RoundRecord[];
}

export type Validation =
  | { ok: true; game: GameSubmission; totals: number[] }
  | { ok: false; error: string };

const ID = /^[A-Za-z0-9-]{8,64}$/;
// Letters, digits, spaces and common punctuation; no control characters.
const NAME = /^[^\u0000-\u001f\u007f<>]{1,20}$/;

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/**
 * Checks a finished game sent by the app and recomputes every score on the server,
 * so the leaderboard never trusts a total typed by a client.
 */
export function validateGame(body: unknown): Validation {
  if (!body || typeof body !== 'object') return { ok: false, error: 'body must be an object' };
  const b = body as Record<string, unknown>;

  if (typeof b.id !== 'string' || !ID.test(b.id)) return { ok: false, error: 'invalid id' };

  if (!Array.isArray(b.players)) return { ok: false, error: 'players must be an array' };
  const n = b.players.length;
  if (n < MIN_PLAYERS || n > MAX_PLAYERS) return { ok: false, error: `players: ${MIN_PLAYERS} to ${MAX_PLAYERS}` };
  const players: string[] = [];
  for (const p of b.players) {
    const name = typeof p === 'string' ? p.trim() : '';
    if (!NAME.test(name)) return { ok: false, error: 'invalid player name' };
    players.push(name);
  }

  if (!Array.isArray(b.rounds) || b.rounds.length !== ROUND_COUNT) {
    return { ok: false, error: `rounds: exactly ${ROUND_COUNT}` };
  }
  const rounds: RoundRecord[] = [];
  for (let r = 0; r < ROUND_COUNT; r++) {
    const round = b.rounds[r] as Record<string, unknown> | null;
    const cards = cardsForRound(r + 1, n);
    const bids = round?.bids;
    const tricks = round?.tricks;
    if (!Array.isArray(bids) || !Array.isArray(tricks) || bids.length !== n || tricks.length !== n) {
      return { ok: false, error: `round ${r + 1}: one bid and one trick count per player` };
    }
    if (!bids.every((v) => isCount(v) && v <= cards)) return { ok: false, error: `round ${r + 1}: bid out of range` };
    if (!tricks.every((v) => isCount(v) && v <= cards)) return { ok: false, error: `round ${r + 1}: tricks out of range` };
    const played = (tricks as number[]).reduce((a, v) => a + v, 0);
    if (played !== cards) return { ok: false, error: `round ${r + 1}: tricks must add up to ${cards}` };
    rounds.push({ bids: bids as number[], tricks: tricks as number[] });
  }

  return { ok: true, game: { id: b.id, players, rounds }, totals: totals(rounds, n) };
}
