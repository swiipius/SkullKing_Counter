# Skull King – Pari, plis et bonbons

A private scorekeeper for the card game **Skull King**, for one phone passed around the table. French UI, pirate candy shop theme, classic official scoring, works offline.

- 2 to 8 players, 10 rounds (8 cards max with 8 players)
- Each round: deal reminder → bids (start at 0) → live trick tracking with the full score grid
- Classic scoring: exact bid = +20 per trick, missed = −10 per trick off; bid 0 = ±10 × cards
- Auto-save on the phone, resume after a reload
- Private: the whole site sits behind a shared **crew code**

Rules recap, decisions and backlog: [docs/PLAN.md](docs/PLAN.md).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173 (no crew code locally)
npm test           # scoring, game state and crew-code tests
npm run build      # type check + production build in dist/
```

## Deploy on Vercel (free Hobby plan)

1. **Push the repo to GitHub** (private repo is fine):
   ```bash
   git remote add origin git@github.com:<you>/skullking-counter.git
   git push -u origin main
   ```
2. **Import it in Vercel**: vercel.com → *Add New… → Project* → pick the repo. Vercel detects Vite; keep the defaults (`npm run build`, output `dist`).
3. **Set the crew code**: *Project → Settings → Environment Variables* → add `CREW_CODE` with the code you will give your friends, for *Production* (and *Preview* if you use it). Redeploy once so it is picked up.
4. **Use your OVH domain** (optional):
   - Vercel: *Project → Settings → Domains* → add e.g. `skull.yourdomain.fr`.
   - OVH: *Web Cloud → Domains → your domain → DNS zone → Add an entry* → `CNAME`, sub-domain `skull`, target `cname.vercel-dns.com.`
   - Vercel issues the HTTPS certificate automatically once the DNS has propagated.
5. Open the site on each phone, enter the crew code once ("Monter à bord"); it is remembered for a year. *Add to home screen* gives a full-screen app that also works offline.

### Changing the crew code

Change `CREW_CODE` in Vercel and redeploy: every phone is logged out and needs the new code.

## How the privacy works

`proxy.ts` is Vercel Routing Middleware (declared in `vercel.json`). It runs before every request:

- no valid cookie → it answers with the "Code d'équipage" page (HTTP 401);
- the form posts to `/__crew`; a correct code sets an `HttpOnly` cookie holding a SHA-256 hash of the code (never the code itself);
- a wrong code waits 0.8 s before answering, to slow down guessing;
- the site is marked `noindex` (header, meta tag and `robots.txt`) so it never shows up in search engines.

Only `/manifest.webmanifest`, `/icon.svg` and `/robots.txt` are public (browsers fetch them without cookies).

## Project layout

```
proxy.ts               crew-code gate (Vercel Routing Middleware)
src/game/scoring.ts    official rules: cards per round, round score, statuses
src/game/state.ts      game state reducer + selectors (bids, tricks, rounds, ranking)
src/game/storage.ts    auto-save in localStorage
src/screens/           Home, Setup, Deal, Bids, Play, End
src/components/        score grid, sea-and-anchor scrollbar, dealer dropdown, icons
public/sw.js           offline cache (service worker)
```

Saved games keep every round's bids and tricks (not just totals), so the planned leaderboard can re-check scores later.
