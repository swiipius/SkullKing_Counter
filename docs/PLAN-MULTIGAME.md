# Multi-game site — Plan (Phase 1)

> Status: **draft, waiting for validation** (2026-11-24).
> Same workflow as Skull King: **plan** → **design** (canvas, no code) → **code**, each step validated.

## 0. Decisions (from Q&A, 2026-11-24)

| Topic | Decision |
|---|---|
| Address | Keep **skull.lordtwin.fr** while developing; a new hub name (e.g. `jeux.lordtwin.fr`) comes later, once stable, with skull.lordtwin.fr redirecting to `/skull-king` |
| Look | **Neutral hub** (landing page), **one theme per game**: Skull King keeps its pirate candy shop, Flip 7 gets its own style |
| Flip 7 style (approved 2026-11-24) | **"Papillotes brillantes"**: candies wrapped in vivid metallic foil (gold, ruby, emerald, sapphire, magenta, tangerine; highlight = lighter shade of the same colour, never white) on a deep violet night background with coloured glows; "FLIP 7" title in multi-colour foil; Bungee for titles and numbers, Nunito for text. Canvas row 5 |
| Flip 7 entry | **Tap the cards each player kept** (numbers, modifiers, ×2, bust); the app computes the round score and the Flip 7 bonus |
| Leaderboards | **One per game**, same page style (top scores + most victories), same Pi database |
| Open source | **MIT license**, public repo, `CONTRIBUTING.md` explains how to add a game |
| Self-hosting | **One Node container** (app + crew-code gate + optional leaderboard), RAM capped at 128 MiB; Vercel still supported |
| Image | **GitHub Container Registry** (`ghcr.io`), multi-arch (amd64 + arm64), built by GitHub Actions |

## 1. Architecture

One site, one crew code, one offline app; each game at its own address.

```
/                → landing page: one card per game, "Reprendre" when a game is in progress
/skull-king      → today's app, unchanged for players
/flip-7          → new Flip 7 counter
/<game>/tableau  → that game's leaderboard
```

**Code layout**
```
src/hub/                 landing page + routing
src/shared/              crew code (proxy), sea scrollbar, score grid, crew setup, storage helpers, leaderboard client
src/games/skull-king/    rules, state, screens, theme (moved from today's src/)
src/games/flip-7/        rules, state, screens, theme
server/games/<game>.ts   per-game validation + score recomputation on the Pi
```

- **Routing**: small client-side router (path-based); `vercel.json` rewrites every game path to the app. The crew-code proxy is unchanged and protects all games.
- **Crew**: player names are shared between games (the last crew is offered when starting any game).
- **No accounts**: games in progress are saved in the browser of the phone that keeps score. The landing page shows "Reprendre" + "Nouvelle partie" on a game's card only on that phone (confirmed 2026-11-24); other phones just see "Nouvelle partie". Leaderboards are shared (server).
- **Saves**: one save per game, so a Skull King game and a Flip 7 game can both be "in progress". Existing Skull King saves on phones keep working (same storage key).
- **Leaderboard (Pi)**: the `games` table gets a `game` column (existing rows = `skull-king`); routes become `/api/<game>/leaderboard` and `/api/<game>/games`, with today's routes kept as aliases for Skull King so phones with an older cached app still send scores. Each game has its own validator that recomputes scores from the raw data.
- **Adding a 3rd game later** = one folder in `src/games/`, one validator in `server/games/`, one card on the landing page.

## 2. Flip 7 — rules recap (scoring-relevant)

Source: Flip 7 rulebook (The Op Games, ruleset 3.1) via a rulebook reproduction; two points marked ⚠ to confirm against the official PDF.

**Deck (94 cards)**: number cards 0–12 (12 × "12", 11 × "11" … 1 × "1", 1 × "0"); modifiers +2, +4, +6, +8, +10, ×2 (one each); actions Freeze, Flip Three, Second Chance (3 each).

**Round**: players flip cards one at a time and choose to stay or keep flipping.
- A **duplicate number** = **bust** → 0 points for the round ⚠ (implied by the rules; to confirm).
- **Second Chance** cancels one duplicate. **Freeze** forces a player to stay. **Flip Three** forces three flips. Actions don't score; the app only needs the cards kept at the end.
- The round ends when every player has stayed or busted, or immediately when someone has **7 different numbers** ("Flip 7").

**Round score** (for a player who did not bust):
1. Sum of number cards (0 counts as a card worth 0).
2. **×2** doubles that sum only (not the modifiers or the bonus).
3. Add **+2 / +4 / +6 / +8 / +10** modifiers (they count even with no number cards; ×2 alone scores nothing).
4. **+15** if 7 different numbers (Flip 7).

**End of game**: checked at the end of each round; when at least one player has **200 points or more**, the highest total wins. Tie for highest ⚠ (to confirm; common rule: play another round).

## 3. Flip 7 counter — how it works

1. **Crew** (shared setup screen, 2+ players; Flip 7 plays best 3–18 — max to decide, see §5), then **points to reach**: chosen before the first round — quick presets **100 · 150 · 200 (official)** plus a custom value; shown in the header and in each player's progress bar, stored with the game (the leaderboard keeps games of different lengths apart or labels them, see §5).
2. **Round screen**: one row per player with live total; tap a player → **card picker** sheet:
   - number cards 0–12 as toggle chips (a number can be picked once; at 7 numbers "Flip 7 !" lights up and the round can end),
   - modifier chips +2…+10 and ×2,
   - a **Bust** button (round score 0, cards cleared),
   - the computed round score shown live.
3. **Score grid** pinned at the bottom (same pattern as Skull King): rounds × players, totals, leader / last highlighted, plus a **200-point progress** for each player.
4. **End of round** → "Manche suivante" (dealer rotates). When someone reaches 200 at round end → podium + both leaderboards, rematch.
5. Auto-save, offline, auto-submit to the Flip 7 leaderboard (server recomputes every round from the cards).

## 3bis. Open source & self-hosting (requested 2026-11-24)

Goal: anyone can read the code, add a game, and run it either on **Vercel** (as today) or with **one Docker image** (Unraid, Pi, any server), the leaderboard being an option.

**One image, one container** (`ghcr.io/<owner>/<project>`):
```
Node server ──┬─ serves the built app (static files)
              ├─ crew-code gate (same logic as proxy.ts, shared module)
              └─ /api/<game>/… leaderboard  ← only when LEADERBOARD=on (SQLite file in /data)
```
- **Without leaderboard**: the database is never opened; the app hides the "Tableau d'honneur" buttons (it asks `/api/config` at start).
- **With leaderboard**: mount a volume on `/data`; nothing else to install (SQLite is built into Node).
- **Settings** (environment variables): `CREW_CODE` (empty = public site), `LEADERBOARD=on|off`, `PORT`, `TZ`.
- **Vercel path** stays supported: front + `proxy.ts` on Vercel, leaderboard either off or pointing at a self-hosted container (today's setup).
- **Multi-architecture image**: `linux/amd64` (Unraid, PCs) and `linux/arm64` (Raspberry Pi), built and published by GitHub Actions on each release tag.
- **Unraid**: works with a plain `docker run`/compose; optional Community Applications template later.

**RAM budget** — measured today on the Pi, the leaderboard container uses **44 MiB** at idle (image 375 MB on `node:26-slim`).
- Serving the static app from the same Node process adds almost nothing (files are small and read from disk).
- Plan: switch to `node:26-alpine` (smaller image, ≈ 150–180 MB), cap V8 with `--max-old-space-size=48`, and set `mem_limit: 128m` in the compose file. Expected **≈ 45–60 MiB** in use with the leaderboard on.
- Lighter alternative (≈ 10–15 MiB): rewrite the server in Go — rejected for now because game rules would have to be written twice (TypeScript in the app, Go on the server), which makes adding a game harder for contributors.

**Open-source housekeeping**
- License file, README for players and self-hosters, `CONTRIBUTING.md` with "how to add a game" (one folder + one validator + one landing card, with tests).
- No secrets in the repo (already the case: codes and keys come from environment variables; `.env` files are ignored).
- Disclaimer: unofficial fan-made score counter, not affiliated with the games' publishers; game names used only to say which game it counts; no artwork or rulebook text from the games.
- The repo is currently `swiipius/SkullKing_Counter`; renaming it to the hub name is a GitHub setting you change (redirects are automatic).

## 4. Phases

| Phase | Content | Deliverable |
|---|---|---|
| 2 · Design | Landing page (neutral), Flip 7 theme direction (2–3 options), Flip 7 screens incl. card picker | Design canvas, for approval |
| 3a · Refactor | Move Skull King under `/skull-king`, add hub + router, shared modules; **no visible change** to Skull King | Tests green, deployed on skull.lordtwin.fr |
| 3b · Flip 7 | Rules module + tests, screens, saves | Playable locally, then deployed |
| 3c · Leaderboards | `game` column, per-game validators, Flip 7 boards | Deployed on the Pi + Vercel |
| 3d · Docker & open source | Single-image server (app + gate + optional leaderboard), compose with RAM cap, GitHub Actions multi-arch build, license, CONTRIBUTING, disclaimer | Image runs on the Pi and on Unraid; RAM measured |
| 4 · New address | Hub name at OVH + Vercel, redirect from skull.lordtwin.fr | When you say it's stable |

## 4bis. Progress
- 2026-11-24 — **3a + 3b done locally** (not pushed): code moved to `src/games/skull-king/`, landing page `src/hub/`, path router `src/shared/router.ts`, Flip 7 in `src/games/flip-7/` (rules + game state with tests, players/target, round, card picker, scores, end). Vercel rewrites added so `/flip-7` and `/skull-king` open directly. Working choices: hub title "Salle de jeux", Flip 7 2–12 players, bust = 0, tie at the target = another round, custom target 20–1000.
- 2026-11-24 — **3c done locally** (not pushed): the API stores `game` + `target` (automatic migration, old rows = Skull King), routes `/api/skull-king/*` and `/api/flip-7/*` (old Skull King paths kept). Flip 7 validator recomputes every round and checks the game ended exactly when someone first reached the target alone. Only 100 / 150 / 200-point games are ranked (decided 2026-11-24); custom targets show "Partie hors classement". Shared leaderboard client in `src/shared/leaderboard.ts`.
- Deploy order when pushing: update the Pi first (new API), then push (new app).
- Next: 3d (Docker image + open source).

## 5. Open questions ❓
- Leaderboard with variable game length: top scores only from 200-point games, or one board per target, or labelled entries ("150 pts")?
- Hub name/title shown on the landing page (and later the new address).
- Maximum number of players for Flip 7 (the box says 3+; Skull King allows 8).
- The two ⚠ rules above (bust scoring, tie at 200) — I can confirm them from the official PDF if you have it, or we take the common reading.

Sources: [Asmodee Flip 7 rules (PDF)](https://cdn.svc.asmodee.net/production-asmodeeca/uploads/2025/12/FLIP_7-RULES.pdf), [RulesPal – Flip 7 rulebook](https://rulespal.com/flip-7/rulebook), [Geeky Hobbies – Flip 7 rules](https://www.geekyhobbies.com/flip-7-rules/), [The Op Games – Flip 7 FAQs](https://theop.games/pages/flip-7-faqs).
