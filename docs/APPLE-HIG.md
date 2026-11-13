# Apple guidelines check (HIG + App Store)

> Checked 2026-11-13 against Apple's Human Interface Guidelines and App Store Review Guidelines, from general knowledge (no dedicated skill was available). Goal: the web app already behaves like an iOS app, so a later native release (e.g. a Capacitor wrapper) needs as little rework as possible.

## ✅ Compliant now

| Area | HIG rule | In the app |
|---|---|---|
| Touch targets | ≥ 44 × 44 pt for every control | All buttons 44 pt or more (reorder arrows widened from 38 to 44 pt). Scroll anchor has an enlarged invisible grab zone. |
| Safe areas | Content clear of notch, Dynamic Island, home indicator | `viewport-fit=cover` + `env(safe-area-inset-*)` on header, footers and sheets; the title screen's sky extends under the status bar on purpose. |
| Fast repeated taps | No accidental zoom | `touch-action: manipulation`: tapping + several times never zooms. |
| Zoom / accessibility | Never block pinch-zoom | No `maximum-scale` / `user-scalable=no`. |
| Text size | Legible minimum (≈ 11 pt) | Smallest text raised to 11 px; body 15–19 px; inputs ≥ 16 px (no auto-zoom on focus in Safari). |
| Contrast | 4.5:1 for text | Ink on parchment and parchment on wood both pass; placeholder darkened to pass. Status chips also carry text, never colour alone. |
| VoiceOver | Every control labelled | Real `<button>`/`<input>`, `aria-label` on icon buttons (anchor, arrows, ✕, ±), live regions on bid/trick values, dialog semantics on the scores sheet, listbox semantics on the dealer menu. |
| Reduce Motion | Respect the system setting | `prefers-reduced-motion`: waves, ship, lanterns and floating gummy bears all stop. |
| Dark appearance | Coherent appearance | App is designed dark; `color-scheme: dark` keeps system controls consistent. |
| Navigation | Always a way back, no browser chrome needed | Anchor "home" button on every game screen, resume from home; works in standalone (home-screen) mode. |
| Destructive actions | Confirm when data would be lost | Starting a new game while one is in progress asks first. |
| Feedback | Immediate response to touches | Pressed states on every button; light vibration on bids/tricks where the platform allows it (Android). |
| App icon | Square, opaque, no transparency, system applies the mask | `public/apple-touch-icon.png` (180 px), `icon-192/512.png`, store icon `docs/store/app-icon-1024.png` — all RGB without alpha, full-bleed square. |
| Orientation | Supported orientations declared | Portrait (manifest). |
| Offline | Core features work without network | Service worker caches the app; games are stored on the device. |
| Privacy | Minimal data, no tracking | No analytics, no account, data stays on the phone. A native release would declare "No data collected" in the privacy label. |

## ⚠️ To handle before an App Store release

1. **Name and trademark (Guideline 5.2 — Intellectual Property).** "Skull King" is a trademark of Grandpa Beck's Games. A public App Store app named or branded "Skull King" will likely be rejected without the publisher's written permission. Options: ask permission, or ship under our own name (e.g. *Pari, plis et bonbons*) with neutral wording such as "score sheet for trick-taking card games". Fine as-is for a private web app.
2. **Minimum functionality (Guideline 4.2).** A plain website wrapper can be rejected. Ours is offline, has no web chrome and has native-like interactions, which helps; a native build should add real native touches: system haptics (iOS `UIImpactFeedbackGenerator` via Capacitor Haptics), native share of the final scores, and Dynamic Type.
3. **Dynamic Type.** Web text in px does not follow the iOS text-size setting. In a native wrapper, map the system text size to a CSS scale factor (or switch sizes to `rem` driven by the system setting).
4. **Haptics on iOS.** iOS Safari has no vibration API, so the vibration only works on Android today; a native build uses the iOS haptic engine.
5. **Launch screen.** A native build needs a launch storyboard/splash (night harbour background + logo); not needed for the web app.
6. **Crew code.** The App Store reviewer must be able to use the app: the native build would ship without the web crew-code gate (the data is local anyway), or provide a demo code in the review notes.
7. **Removing a pirate** from the crew is immediate (low stakes: only a name). A native version could add an undo toast.
