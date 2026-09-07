# Polish P2 — UI / HUD Review

## Status
**97/100 — IMPLEMENTED CANDIDATE. TARGET-MACHINE + HUMAN GATES PENDING.**

Base checkpoint: B1 merged `main` @ `50a88d5c28bc007a37cb11f47e25eddd7146f737`.

## Goal
Raise the interface to the same visual/interaction standard as the game scene without touching gameplay.

## Implementation
- HUD score now gives a short success pulse on increases only.
- Score announces politely through accessible live-region semantics.
- Mute and reduced-motion controls expose `aria-pressed`, accurate labels, and 48px touch targets.
- Game-over screen is a labelled dialog with clearer result hierarchy and focus placed on `Fly Again`.
- `web/polish.css` is a deliberately separate override layer with safe-area, keyboard focus, compact mobile, and `prefers-reduced-motion` rules.
- Dev, production template, and current production shell all load the same polish layer.

## Hard preservation rules
- canvas/game/UI anchors remain unchanged;
- start/restart/menu callback semantics remain unchanged;
- no score calculation, persistence, unlock, physics, collision, or difficulty changes;
- motion polish must collapse under OS reduced-motion preference;
- UI may not cover the central flight corridor during normal play.

## Regression coverage
`polish.ui_hud_contract.test.mjs` checks pressed states, live score semantics, dialog/focus behavior, production/dev stylesheet wiring, required anchors, safe areas, focus visibility, and reduced-motion support.

## Human gate
Approve only if score/settings/results are easier to read at a glance and the HUD feels quieter rather than busier. Reject if the score pulse is distracting, touch controls intrude on play, or game-over focus feels abrupt.

## Verification
Run `npm run quality`, then inspect menu, active HUD, score increments, mute/reduced-motion toggles, game over, keyboard focus, and a narrow/mobile viewport in `npm run dev`.

## Rollback
Discard `polish-p2-ui-hud`; baseline remains `main` @ `50a88d5`.
