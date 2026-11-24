/** Flip 7 leaderboard: one board per ranked target (100, 150, 200 pts). */
import { createLeaderboard } from '../../shared/leaderboard';
import { TARGET_PRESETS } from './rules';
import type { Game } from './state';

export const client = createLeaderboard({
  api: '/api/flip-7',
  keys: { outbox: 'flip7-counter:outbox', board: 'flip7-counter:board', results: 'flip7-counter:results' },
});

export const isRankedTarget = (t: number) => (TARGET_PRESETS as readonly number[]).includes(t);

/** Queue a finished game for its board; custom targets are not ranked. Returns false when not ranked. */
export function submitGame(game: Game): boolean {
  if (game.winner === null || !isRankedTarget(game.target)) return false;
  client.enqueue({ id: game.id, players: game.players, target: game.target, rounds: game.history }, String(game.target));
  return true;
}
