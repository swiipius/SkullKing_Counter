/**
 * Vercel Routing Middleware: keeps the whole site private behind a shared crew code.
 *
 * - The code lives in the CREW_CODE environment variable (Vercel → Settings → Environment Variables).
 * - Once entered, a cookie remembers it on the phone for one year.
 * - Changing CREW_CODE logs every phone out (the cookie holds a hash of the code).
 */
import { next } from '@vercel/functions';

const COOKIE = 'sk_crew';
const ONE_YEAR = 60 * 60 * 24 * 365;
/** Files the browser fetches without cookies (PWA install), harmless to expose. */
const PUBLIC_PATHS = new Set([
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/robots.txt',
]);

async function tokenFor(code: string): Promise<string> {
  const data = new TextEncoder().encode(`skullking-crew:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison of two hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** Reads a Vercel environment variable without depending on Node's type definitions. */
const env = (name: string): string | undefined =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function proxy(request: Request) {
  const url = new URL(request.url);
  if (PUBLIC_PATHS.has(url.pathname)) return next();

  const code = env('CREW_CODE');
  if (!code) return loginPage(503, "Le code d'équipage n'est pas encore configuré (variable CREW_CODE sur Vercel).");
  const expected = await tokenFor(code);

  if (url.pathname === '/__crew') {
    if (request.method !== 'POST') return Response.redirect(new URL('/', url), 303);
    const form = await request.formData().catch(() => null);
    const given = String(form?.get('code') ?? '').trim();
    if (given && safeEqual(await tokenFor(given), expected)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Set-Cookie': `${COOKIE}=${expected}; Max-Age=${ONE_YEAR}; Path=/; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
        },
      });
    }
    await sleep(800); // slows down guessing
    return loginPage(401, 'Mauvais code, moussaillon. Réessayez.');
  }

  const cookie = readCookie(request.headers.get('cookie'), COOKIE);
  const crew = Boolean(cookie && safeEqual(cookie, expected));

  if (url.pathname.startsWith('/api/')) {
    return crew ? forwardToLeaderboard(request, url) : json(401, { error: 'crew code required' });
  }
  if (crew) return next();
  return loginPage(401);
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * The leaderboard API lives on the Raspberry Pi. Only this proxy knows its key,
 * so the API is reachable only by phones that passed the crew code.
 */
async function forwardToLeaderboard(request: Request, url: URL): Promise<Response> {
  const base = env('LEADERBOARD_API_URL');
  const key = env('LEADERBOARD_API_KEY');
  if (!base || !key) return json(503, { error: 'leaderboard not configured' });

  const init: RequestInit = {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
      'X-Api-Key': key,
      'X-Forwarded-For': request.headers.get('x-forwarded-for') ?? '',
    },
    signal: AbortSignal.timeout(8000),
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.arrayBuffer();

  try {
    const res = await fetch(new URL(url.pathname + url.search, base), init);
    return new Response(res.body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return json(502, { error: 'leaderboard unreachable' });
  }
}

function loginPage(status: number, error?: string): Response {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#2b1a11">
<title>Skull King – Code d'équipage</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Pirata+One&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:Nunito,system-ui,sans-serif;color:#f3e6c8;background:#140c08;display:flex;justify-content:center}
main{width:100%;max-width:480px;min-height:100dvh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:26px;padding:32px 24px;
background-color:#2b1a11;background-image:radial-gradient(120% 45% at 50% 0%,rgba(255,186,90,.22),rgba(0,0,0,0) 70%),repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 62px,rgba(0,0,0,.4) 62px 65px)}
h1{margin:0;font-family:'Pirata One',Georgia,serif;font-weight:400;font-size:66px;line-height:.9;color:#e8b04a}
.tag{margin:4px 0 0;font-size:17px;font-weight:700;text-align:center}
form{width:100%;padding:22px;border-radius:20px;display:flex;flex-direction:column;gap:12px;background:#f3e6c8;color:#2a1a10;border:2px solid #8a5a2b;box-shadow:0 8px 0 rgba(0,0,0,.3)}
label{font-size:14px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#6b4320}
input{height:54px;border-radius:12px;border:2px solid #8a5a2b;background:#fffaf0;padding:0 14px;font:800 22px Nunito,sans-serif;letter-spacing:4px;color:#2a1a10}
input:focus{outline:3px solid #e8b04a;outline-offset:1px}
button{height:58px;border:0;border-radius:16px;background:#e8b04a;color:#2a1a10;font:900 20px Nunito,sans-serif;box-shadow:0 5px 0 #a8741f;cursor:pointer}
button:active{transform:translateY(3px);box-shadow:0 2px 0 #a8741f}
.note{margin:0;font-size:14px;color:#5a3a24}
.error{margin:0;padding:10px 12px;border-radius:10px;background:#fbdbe4;color:#7a1530;font-weight:800}
</style>
</head>
<body>
<main>
<svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#e8b04a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c-4.4 0-8 3.2-8 7.3 0 2.4 1.2 4.4 3 5.7V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3c1.8-1.3 3-3.3 3-5.7C20 6.2 16.4 3 12 3Z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 20v-2M14 20v-2M12 13.5l-.8 1.5h1.6Z"/></svg>
<div><h1>Skull King</h1><p class="tag">Pari, plis et bonbons</p></div>
<form method="post" action="/__crew">
<label for="code">Code d'équipage</label>
${error ? `<p class="error" role="alert">${error}</p>` : ''}
<input id="code" name="code" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required autofocus>
<button type="submit">Monter à bord</button>
<p class="note">Réservé à l'équipage. Le code est retenu sur ce téléphone.</p>
</form>
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
