# Polish P1 — Game Feel Review

## Status
**98/100 — IMPLEMENTED CANDIDATE. TARGET-MACHINE + HUMAN GATES PENDING.**

Base checkpoint: B1 merged `main` @ `50a88d5c28bc007a37cb11f47e25eddd7146f737`.

## Goal
Make flap response feel more immediate and intentional without changing OwlFly's vertical physics, collision circle, scoring, obstacle geometry, or difficulty.

## Implementation
`src/engine/entities/owl.js` now owns a small frozen `OWL_PRESENTATION` contract. Existing `flapT` drives:
- an eased wing-frame kick;
- a bounded upward presentation pitch;
- a softer/longer glide presentation response;
- a normalized hurt pulse for later rendering use.

The existing jump impulse remains the source of vertical movement. Presentation pitch is added only after `rotationForVelocity()` and never enters the hit circle.

## Hard preservation rules
- `jumpImpulse()` result must remain unchanged;
- gravity and max-fall behavior must remain unchanged;
- `getCircle()` must remain unchanged;
- no new input buffering, coyote time, invulnerability, score, gap, spawn, or collision behavior;
- reduced-motion behavior must not become harder to read.

## Regression coverage
`polish.game_feel_contract.test.mjs` proves:
- sealed normal jump impulse;
- identical hit geometry before/after presentation cues;
- bounded pitch kick;
- monotonic flap-pulse decay;
- softer glide presentation while respecting its existing jumpScale;
- hurt pulse is presentation-only.

## Human gate
Approve only if flap feels more responsive while trajectory/timing still feel like the same game. Reject if the owl appears to jump farther, hit earlier/later, or becomes visually twitchy.

## Verification
Run `npm run quality`, then several normal/glide runs in `npm run dev`.

## Rollback
Discard `polish-p1-game-feel`; baseline remains `main` @ `50a88d5`.
