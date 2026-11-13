# Skull King Counter — Plan (Phase 1)

> Status: **draft, waiting for validation**.
> Workflow: **Phase 1** rules + functional plan → **Phase 2** UI sketches + prototype (no app code) → **Phase 3** code.

## 0. Decisions (from Q&A, 2026-11-13)
| Topic | Decision |
|---|---|
| Devices | **One shared phone** at the table, offline, no backend |
| Language | **French** UI (pirate-flavoured wording) |
| Scoring v1 | **Classic scoring only, no bonus points** (bonuses, Rascal, Cannonball, pirate abilities → later versions) |
| Live points | **Live trick tracking**: tap +1 per trick won, projected score updates live |
| Rounds | **Standard 10 rounds only** (round n = n cards, capped for 8 players) |
| Vibe | **The Pirate's Candies** (pirate candy shops, Strasbourg / Paris / Lyon) |
| Phase 2 deliverable | Moodboard → wireframes → hi-fi mockups → **clickable HTML prototype** with fake data |
| Players | Names only, **no avatars** in v1 |
| Kraken | **Not handled in v1**: a round ends only when tricks played = cards dealt |
| Live score view | **Full round grid** (rounds × players) under the players, current round live |
| Hosting | **Vercel front + Pi 4 API**: app on Vercel, on a subdomain of the existing OVH domain (CNAME); leaderboard API + database on the Pi 4 (see backlog). The game never depends on the Pi |
| Access | **Private via a shared crew code**: checked by Vercel middleware before the site loads, remembered ~1 year on each phone, code stored as an env variable, site set to `noindex` |

**v1 scope in one line:** set up 2–8 players, per round: deal reminder → bids → tap tricks live with the full score grid updating, classic scoring, auto-save.

---

## 1. Goal

A website that keeps score for a game of Skull King at the table:
- handles 2–8 players,
- records each player's **bid** every round,
- shows **live points** (during the round and on the overall scoreboard),
- applies the **official scoring rules** automatically, including bonuses,
- feels immersive: a pirate candy shop ("comptoir de pirate à bonbons") ambiance.

---

## 2. Official rules recap (scoring-relevant parts only)

Source: official Grandpa Beck's rulebook (2021 edition).

### 2.1 Round structure
- Standard game: **10 rounds**, round *n* deals *n* cards.
- **7–8 players**: the deck can't go to 10 cards → the card count is repeated in the final rounds (with 8 players, rounds 9 and 10 deal 8 cards).
- **2 players**: a ghost hand ("Greybeard") plays but never bids or scores → app just has 2 scoring players.
- Every player bids simultaneously (fist reveal) from **0 to the number of cards dealt**.
- Dealer rotates clockwise each round.

**Official round variants** (cards per round):
| Variant | Rounds |
|---|---|
| Standard | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| Even Keeled | 2, 2, 4, 4, 6, 6, 8, 8, 10, 10 |
| Skip to the Brawl | 6, 7, 8, 9, 10 |
| Swift-n-Salty Skirmish | 5, 5, 5, 5, 5 |
| Broadside Barrage | 10 × 10 |
| Whirlpool | 9, 9, 7, 7, 5, 5, 3, 3, 1, 1 |
| Past Your Bedtime | 1 round of 1 card |

### 2.2 Classic scoring ("Skull King's scoring") — default
| Situation | Points |
|---|---|
| Bid ≥ 1, **exact** | **+20 × tricks won** |
| Bid ≥ 1, missed | **−10 × |bid − tricks|** (tricks won score nothing) |
| Bid 0, took 0 tricks | **+10 × cards dealt this round** |
| Bid 0, took ≥ 1 trick | **−10 × cards dealt this round** |

> Sections 2.3 → 2.5 are **out of v1 scope** — kept here as reference for later versions.

### 2.3 Bonus points — **only if the bid is exact** (bid 0 included)
| Bonus | Points |
|---|---|
| Each standard 14 captured (yellow, purple, green) | +10 |
| Black 14 (Jolly Roger) captured | +20 |
| Each Mermaid captured by a Pirate | +20 |
| Each Pirate captured by the Skull King | +30 |
| Skull King captured by a Mermaid | +40 |
| Loot alliance: you played Loot, the trick winner captured it, **both** made their bid | +20 each |

Special cases the app must respect:
- Mermaid + Pirate + Skull King in the same trick → Mermaid wins, only the +40 is scored.
- **Kraken**: the trick is destroyed, nobody wins it → total tricks in a round can be **less** than cards dealt.
- **White Whale**: changes who wins, no direct scoring effect.
- **Tigress**: played as Pirate or Escape; counts as a Pirate for bonuses when played as Pirate.

### 2.4 Rascal's scoring (optional official alternative)
- Every player has the same **potential = 10 × cards dealt** each round, whatever their bid.
- Exact bid → 100 % of potential (+ 100 % bonuses); off by 1 → 50 % (+ 50 % bonuses); off by 2+ → 0.
- **Optional Cannonball / Grapeshot** (secret choice, revealed with bids):
  - Grapeshot = normal Rascal scoring above.
  - Cannonball = **15 × cards dealt** if exact, **0** otherwise; bonuses only if exact.

### 2.5 Advanced pirate abilities (optional, from the 2021 edition)
Only two abilities change the score — the app needs input for them:
- **Harry the Giant**: after winning a trick with him (or after the final trick), change your bid by **+1 / −1 / 0**.
- **Rascal of Roatan**: after winning a trick with him, wager **0, 10 or 20** points → gained if bid exact, lost otherwise.
- Rosie, Bendt, Juanita: no scoring impact, nothing to enter.

---

## 3. How the app works

### 3.1 Screens / flow (v1)
1. **Home** — New game · Resume current game · Past games.
2. **Setup**
   - Players: 2–8, **name only**, seating order (reorder), first dealer.
   - Rounds/cards computed automatically: 1→10, with 8 players rounds 9–10 deal 8 cards.

Each round then goes through 3 screens:

3. **Round screen A — Deal reminder**
   - Full-screen message: "Manche *n* — *Dealer* distribue *n* cartes".
   - **Tap anywhere** → screen B.
4. **Round screen B — Bids**
   - One person enters every player's bid after the fist reveal: 0…n selector per player.
   - Shows total of bids vs cards ("4 paris pour 5 cartes").
   - Every bid **starts at 0**; "Lancer la manche" is always enabled → screen C.
   - **"Voir les scores"** button next to it opens the full score grid in a bottom sheet ("Retour aux paris" closes it).
5. **Round screen C — Play (live)**
   - **Top: one row per player** — name · tricks needed (bid) · current tricks · **− / +** buttons.
   - **Below: the full score grid** (rounds × players, totals row), **pinned to the bottom of the screen** so it stays visible with up to 8 players; only the player list scrolls (sea-and-anchor scrollbar). The current round's column shows the projected points live after every tap (e.g. bid 2, 1 trick so far → −10; 2 tricks → +40).
   - **While tricks played < cards dealt**: + and − active, **"Manche suivante"** greyed out.
   - **When tricks played = cards dealt** (round done): **+ disabled, only − available** (to fix a mistake), **"Manche suivante" enabled**. A − tap reopens the round (+ active again, Next greyed again).
   - "Manche suivante" locks the round's points into the grid → screen A of the next round.
   - Score grid: alternating background per **player column** (not per row); current round row in gold; in the totals row the **leader is gold and the last player is strawberry pink**.
   - During the game the dealer is marked by a **pink octopus** (eight arms to deal), with a large octopus holding cards on the deal reminder. **Not on the crew screen**: there the first dealer is picked in a compact "Premier donneur" dropdown, and each player row has ↑ / ↓ buttons to reorder.
6. **End of game** (after the last round) — final ranking/podium + full grid, "Rematch with same crew".

### 3.2 Live points definition
- During the round: `projected = score(bid, tricks so far)` recomputed on each tap, shown in the current round's column of the grid.
- Totals row = locked rounds + current projection.

### 3.3 Validation rules (anti-mistake)
- Bid between 0 and cards dealt.
- Σ tricks can never exceed cards dealt (+ disabled once all tricks are played).
- A round can only be closed when Σ tricks = cards dealt (no Kraken in v1).

### 3.4 Other behaviour
- **Auto-save** in the browser (refresh / phone lock doesn't lose the game), resume on reopen.
- Corrections happen with the − button during the current round; editing an already-closed round → backlog.
- Dealer badge rotates automatically.
- Mobile-first (phone passed around the table), works on tablet/desktop; usable offline once loaded (PWA).
- Scoring logic isolated in a pure, unit-tested module (every rule above has a test).

### 3.5 Tech proposal (details decided in Phase 3)
Static site, no backend in v1: TypeScript + Vite (+ light framework), localStorage, PWA, **deployed on Vercel** behind the crew code middleware. The later leaderboard API runs on the Pi 4.

---

## 3.6 Phase 3 — code (v1 built, 2026-11-13)
- Stack: **Preact + TypeScript + Vite**, no backend; fonts self-hosted (offline).
- Crew code: Vercel Routing Middleware `proxy.ts` + `CREW_CODE` env variable (see README).
- Tests: 31 unit tests (scoring rules, game state, crew-code gate).
- Deployment: local git repo; the user pushes to GitHub and imports it in Vercel.
- Live (2026-11-13): https://skull.lordtwin.fr (OVH CNAME → Vercel), fallback https://skull-king-counter-dusky.vercel.app. Crew-code gate checked live.

## 3.7 Leaderboard (started 2026-11-13)
- Order: design (canvas board "4 · Tableau d'honneur") → build and test **locally** (API + SQLite on the Mac) → deploy to the Pi.
- Pi: `pierr@192.168.1.153` (Debian 13, arm64, Docker). HTTPS is terminated by a front proxy at 192.168.1.21, which sends `skull-api.lordtwin.fr` to the Pi on **port 3000**.
- Port 3000 note: the Pi already runs a Next.js server on `[::1]:3000` (IPv6 localhost only), so the API container must publish on IPv4 only (`0.0.0.0:3000`), not on `[::]:3000`.
- Design approved; built and tested locally (2026-11-13): API in `server/` (Node 26 + built-in SQLite, no dependencies), app screens (home button, leaderboard screen, end-of-game card), offline outbox. The crew code protects the API through the Vercel proxy, which adds a secret `X-Api-Key` (no CORS, no key in the browser).
- Next: deploy on the Pi (Docker), set `LEADERBOARD_API_URL` / `LEADERBOARD_API_KEY` on Vercel, then push to production.

## 4. Phase 2 — design (approved)
Design canvas: https://claude.ai/artifact/FoJEyRFMHKZX6N3rEWGsRd (moodboard, wireframes, clickable prototype, all hi-fi screens).

### Design direction
Vibe reference: **The Pirate's Candies** — inside a ship's hold turned candy shop: dark wood planks, barrels and treasure chests overflowing with sweets, glass candy jars, lantern light, brass, ropes, parchment, treasure-map details. Playful and gourmand rather than grim.
Deliverables: moodboard → wireframes of every screen → high-fidelity mockups → clickable prototype with fake data (not the real app).

---

## 5. Later versions (backlog)
- Bonus points (14s, captures, Loot).
- Rascal's scoring + Cannonball/Grapeshot.
- Advanced pirate abilities (Harry the Giant, Rascal of Roatan).
- Official round variants / custom rounds.
- Second-screen scoreboard, multi-phone mode.
- Kraken (destroyed trick) handling.
- Player avatars.
- Editing an already-closed round.
- **Global top-10 leaderboard** (decided 2026-11-13, feasible on Vercel free/Hobby):
  - Entry = one player's final score of a full 10-round game: **player name + score only** (the full game is sent for checking but not stored).
  - **Duplicates allowed**: the same name can appear several times (top 10 = the 10 best scores, whoever made them).
  - Sent **automatically** at the end of every finished game (queued and retried if offline).
  - The full game (bids + tricks per round) is sent; the server **recalculates and validates** the score, with a rate limit and a name length limit.
  - Server checks: every bid between 0 and cards dealt, every round's tricks add up to the cards dealt, score recalculated from bids and tricks. This catches wrong totals but not a well-made fake game.
  - Known limits: test games and joke names go in too (auto-send); the offline queue lives in that phone's browser only; rate limits can be bypassed; offensive names have to be deleted by hand in the database console.
  - Stack (decided 2026-11-13): **API on the Pi 4** (small server + SQLite file, in Docker), reachable over HTTPS at its own subdomain (e.g. `api.<domain>`) through a reverse proxy (Caddy) or Cloudflare Tunnel. Chosen over Upstash/Neon free tiers to avoid depending on a vendor's free offer.
  - The Pi accepts requests only from the app's domain (CORS) and requires the crew code on every request.
  - Pi offline → the app shows the last downloaded leaderboard marked "hors ligne", new scores wait on the phone and are sent when the Pi is back.
  - Automatic backup of the SQLite file (SD card failure would otherwise lose the leaderboard).
  - Keep v1's game state format ready for it: store each round's bids and tricks, not just totals.
