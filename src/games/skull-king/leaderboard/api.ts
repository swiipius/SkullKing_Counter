/** Skull King leaderboard: the shared client with Skull King's API path and its original storage keys. */
import type { RoundRecord } from '../game/scoring';
import { createLeaderboard } from '../../../shared/leaderboard';

export type { Board, SubmitStatus, SubmittedEntry, TopEntry, WinEntry } from '../../../shared/leaderboard';

export interface GameSubmission {
  id: string;
  players: string[];
  rounds: RoundRecord[];
}

const client = createLeaderboard({
  api: '/api/skull-king',
  keys: { outbox: 'skullking-counter:outbox', board: 'skullking-counter:board', results: 'skullking-counter:results' },
});

export const cachedBoard = () => client.cachedBoard();
export const fetchBoard = () => client.fetchBoard();
export const statusOf = client.statusOf;
export const flushOutbox = client.flushOutbox;
export const enqueue = (game: GameSubmission) => client.enqueue({ ...game });
