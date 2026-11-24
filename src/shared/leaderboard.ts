/**
 * Leaderboard client shared by every game. It talks to the site's own /api path
 * (the crew-code proxy forwards it to the Raspberry Pi). Finished games wait in an
 * outbox on the phone until they are accepted, so no score is lost without network.
 */

export interface TopEntry {
  rank: number;
  name: string;
  score: number;
}

export interface WinEntry {
  rank: number;
  name: string;
  wins: number;
}

export interface Board {
  top: TopEntry[];
  wins: WinEntry[];
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

export type SubmitStatus =
  | { kind: 'sending' }
  | { kind: 'offline' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; entries: SubmittedEntry[]; best: number | null };

/** Anything a game sends: an id (for retries) plus its own data, checked again by the server. */
export interface Submission {
  id: string;
  [key: string]: unknown;
}

interface Options {
  /** API base, e.g. "/api/skull-king". */
  api: string;
  /** localStorage keys (kept stable so queued games survive app updates). */
  keys: { outbox: string; board: string; results: string };
}

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

export function createLeaderboard({ api, keys }: Options) {
  /** Boards are cached per variant ("" for games with a single board, "150" for Flip 7 at 150 pts…). */
  const boardKey = (variant: string) => (variant ? `${keys.board}:${variant}` : keys.board);
  const query = (variant: string) => (variant ? `?target=${encodeURIComponent(variant)}` : '');

  function cachedBoard(variant = ''): Board | null {
    const b = read<Board | null>(boardKey(variant), null);
    return b ? { ...b, wins: b.wins ?? [] } : null;
  }

  function remember(variant: string, data: { top?: TopEntry[]; wins?: WinEntry[]; games?: number }): Board {
    const b = { top: data.top ?? [], wins: data.wins ?? [], games: data.games ?? 0, fetchedAt: Date.now() };
    write(boardKey(variant), b);
    return b;
  }

  /** Latest board from the server; throws when unreachable (callers show the cached one). */
  async function fetchBoard(variant = ''): Promise<Board> {
    const res = await fetch(`${api}/leaderboard${query(variant)}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return remember(variant, (await res.json()) as { top: TopEntry[]; wins?: WinEntry[]; games: number });
  }

  const outbox = () => read<{ variant: string; game: Submission }[]>(keys.outbox, []).map((x) =>
    // Older Skull King outboxes stored the game itself.
    'game' in x && 'variant' in x ? x : { variant: '', game: x as unknown as Submission },
  );
  const results = () => read<Record<string, SubmitStatus>>(keys.results, {});

  function statusOf(id: string): SubmitStatus | null {
    const done = results()[id];
    if (done) return done;
    return outbox().some((o) => o.game.id === id) ? { kind: 'offline' } : null;
  }

  /** Queue a finished game once; `variant` picks the board (Flip 7 target). */
  function enqueue(game: Submission, variant = '') {
    if (results()[game.id] || outbox().some((o) => o.game.id === game.id)) return;
    write(keys.outbox, [...outbox(), { variant, game }]);
  }

  async function send(variant: string, game: Submission): Promise<SubmitStatus> {
    let res: Response;
    try {
      res = await fetch(`${api}/games`, {
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
      wins?: WinEntry[];
      games?: number;
      entries?: SubmittedEntry[];
      error?: string;
    };
    if (!res.ok) return { kind: 'error', message: data.error ?? `HTTP ${res.status}` };
    const b = remember(variant, data);
    return { kind: 'done', entries: data.entries ?? [], best: b.top[0]?.score ?? null };
  }

  let flushing: Promise<void> | null = null;

  /** Send every queued game; games that cannot be sent stay queued. */
  function flushOutbox(): Promise<void> {
    if (flushing) return flushing;
    flushing = (async () => {
      for (const { variant, game } of outbox()) {
        const status = await send(variant, game);
        if (status.kind === 'offline') break; // no network: try again later
        write(keys.results, { ...results(), [game.id]: status });
        write(keys.outbox, outbox().filter((o) => o.game.id !== game.id));
      }
    })().finally(() => {
      flushing = null;
    });
    return flushing;
  }

  return { cachedBoard, fetchBoard, statusOf, enqueue, flushOutbox };
}
