/**
 * Talks to the leaderboard through the site's own /api path (the crew-code proxy
 * forwards it to the Raspberry Pi). Finished games wait in an outbox on the phone
 * until they are accepted, so no score is lost without network.
 */
import type { RoundRecord } from '../game/scoring';

export interface TopEntry {
  rank: number;
  name: string;
  score: number;
}

export interface Board {
  top: TopEntry[];
  games: number;
  /** When this board was received (ms since epoch). */
  fetchedAt: number;
}

export interface SubmittedEntry {
  name: string;
  score: number;
  position: number;
  inTop: boolean;
}

export interface GameSubmission {
  id: string;
  players: string[];
  rounds: RoundRecord[];
}

export type SubmitStatus =
  | { kind: 'sending' }
  | { kind: 'offline' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; entries: SubmittedEntry[]; best: number | null };

const OUTBOX = 'skullking-counter:outbox';
const BOARD = 'skullking-counter:board';
const RESULTS = 'skullking-counter:results';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/* ---------- board ---------- */

export const cachedBoard = (): Board | null => read<Board | null>(BOARD, null);

function remember(top: TopEntry[], games: number): Board {
  const b = { top, games, fetchedAt: Date.now() };
  write(BOARD, b);
  return b;
}

/** Latest board from the server; throws when unreachable (caller shows the cached one). */
export async function fetchBoard(): Promise<Board> {
  const res = await fetch('/api/leaderboard', { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { top: TopEntry[]; games: number };
  return remember(data.top, data.games);
}

/* ---------- outbox ---------- */

const outbox = () => read<GameSubmission[]>(OUTBOX, []);
const results = () => read<Record<string, SubmitStatus>>(RESULTS, {});

export function statusOf(id: string): SubmitStatus | null {
  const done = results()[id];
  if (done) return done;
  return outbox().some((g) => g.id === id) ? { kind: 'offline' } : null;
}

/** Queue a finished game (once). */
export function enqueue(game: GameSubmission) {
  if (results()[game.id] || outbox().some((g) => g.id === game.id)) return;
  write(OUTBOX, [...outbox(), game]);
}

async function send(game: GameSubmission): Promise<SubmitStatus> {
  let res: Response;
  try {
    res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(game),
    });
  } catch {
    return { kind: 'offline' };
  }
  // Server or Pi temporarily unavailable: keep the game and retry later.
  if (res.status >= 500 || res.status === 401 || res.status === 429) return { kind: 'offline' };
  const data = (await res.json().catch(() => ({}))) as {
    top?: TopEntry[];
    games?: number;
    entries?: SubmittedEntry[];
    error?: string;
  };
  if (!res.ok) return { kind: 'error', message: data.error ?? `HTTP ${res.status}` };
  const top = data.top ?? [];
  remember(top, data.games ?? 0);
  return { kind: 'done', entries: data.entries ?? [], best: top[0]?.score ?? null };
}

let flushing: Promise<void> | null = null;

/** Send every queued game; games that cannot be sent stay queued. */
export function flushOutbox(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    for (const game of outbox()) {
      const status = await send(game);
      if (status.kind === 'offline') break; // no network: try again later
      write(RESULTS, { ...results(), [game.id]: status });
      write(OUTBOX, outbox().filter((g) => g.id !== game.id));
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}
