import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  TARGET_PRESETS,
  isValidHand,
  totals,
  winner,
  type Round,
} from '../src/games/flip-7/rules.ts';

export interface Flip7Submission {
  id: string;
  players: string[];
  target: number;
  rounds: Round[];
}

export type Flip7Validation =
  | { ok: true; game: Flip7Submission; totals: number[] }
  | { ok: false; error: string };

const ID = /^[A-Za-z0-9-]{8,64}$/;
const NAME = /^[^\u0000-\u001f\u007f<>]{1,20}$/;
const MAX_ROUNDS = 60;

/**
 * Checks a finished Flip 7 game and recomputes every score from the cards.
 * Only official-length presets (100 / 150 / 200) are ranked, and the game must
 * end exactly at the round where someone first reached the target alone.
 */
export function validateFlip7(body: unknown): Flip7Validation {
  if (!body || typeof body !== 'object') return { ok: false, error: 'body must be an object' };
  const b = body as Record<string, unknown>;

  if (typeof b.id !== 'string' || !ID.test(b.id)) return { ok: false, error: 'invalid id' };
  if (typeof b.target !== 'number' || !(TARGET_PRESETS as readonly number[]).includes(b.target)) {
    return { ok: false, error: 'target not ranked (100, 150 or 200 only)' };
  }

  if (!Array.isArray(b.players)) return { ok: false, error: 'players must be an array' };
  const n = b.players.length;
  if (n < MIN_PLAYERS || n > MAX_PLAYERS) return { ok: false, error: `players: ${MIN_PLAYERS} to ${MAX_PLAYERS}` };
  const players: string[] = [];
  for (const p of b.players) {
    const name = typeof p === 'string' ? p.trim() : '';
    if (!NAME.test(name)) return { ok: false, error: 'invalid player name' };
    players.push(name);
  }

  if (!Array.isArray(b.rounds) || b.rounds.length < 1 || b.rounds.length > MAX_ROUNDS) {
    return { ok: false, error: `rounds: 1 to ${MAX_ROUNDS}` };
  }
  const rounds: Round[] = [];
  for (let r = 0; r < b.rounds.length; r++) {
    const hands = (b.rounds[r] as { hands?: unknown } | null)?.hands;
    if (!Array.isArray(hands) || hands.length !== n) return { ok: false, error: `round ${r + 1}: one hand per player` };
    if (!hands.every(isValidHand)) return { ok: false, error: `round ${r + 1}: invalid cards` };
    rounds.push({ hands });
    const won = winner(totals(rounds, n), b.target);
    const last = r === b.rounds.length - 1;
    if (won !== null && !last) return { ok: false, error: `game already won at round ${r + 1}` };
    if (won === null && last) return { ok: false, error: 'game not finished' };
  }

  return { ok: true, game: { id: b.id, players, target: b.target, rounds }, totals: totals(rounds, n) };
}
