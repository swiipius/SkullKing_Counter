import { useEffect, useState } from 'preact/hooks';

/**
 * Tiny path router: each game lives at its own address (/skull-king, /flip-7)
 * and the landing page at /. Vercel and the Docker server send every path to
 * index.html, so these addresses also work when opened directly.
 */
const EVENT = 'app:navigate';

export function navigate(to: string, replace = false) {
  if (replace) history.replaceState(null, '', to);
  else history.pushState(null, '', to);
  window.dispatchEvent(new Event(EVENT));
  window.scrollTo(0, 0);
}

export function usePath(): string {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const update = () => setPath(location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener(EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(EVENT, update);
    };
  }, []);
  return path;
}

/** Reads and removes the one-shot `?action=` the landing page passes to a game (resume, new, leaderboard). */
export function takeAction(): string | null {
  const url = new URL(location.href);
  const action = url.searchParams.get('action');
  if (action) {
    url.searchParams.delete('action');
    history.replaceState(null, '', url.pathname + url.search);
  }
  return action;
}
