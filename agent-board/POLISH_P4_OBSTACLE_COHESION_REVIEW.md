# Polish P4 — Obstacle Cohesion Review

## Status
**97/100 — IMPLEMENTED CANDIDATE. TARGET-MACHINE + HUMAN GATES PENDING.**

Base checkpoint: B1 merged `main` @ `50a88d5c28bc007a37cb11f47e25eddd7146f737`.

## Goal
Make foreground cloud/building hazards read as one deliberate art family while preserving the exact gameplay corridor.

## Implementation
- Building gap-facing visual reach tightens from the sealed A1 ceiling of 80px to a shared 72px envelope: at most 8px more visual clearance, never less.
- Already-honest high openings preserve their existing scale.
- Cloud and building hazards now share one 2px inset gap-edge presentation helper.
- Cloud edge sits inside the bottom of the top hazard bounds; building edge sits inside the top of the bottom hazard bounds.
- Shared edge alpha is capped at 0.14 and never draws into the playable gap.

## Hard preservation rules
- collision profiles are read-only and must remain byte-for-byte semantically unchanged;
- obstacle rectangles, gaps, spawn cadence, scoring and physics remain unchanged;
- building scale may only shrink when the prior silhouette exceeded the new presentation reach;
- no highlight may extend beyond its obstacle bounds;
- foreground silhouettes must remain more readable, never more deceptive.

## Regression coverage
`polish.obstacle_cohesion_contract.test.mjs` verifies the 8px maximum tightening, all 13 building profiles, exact preservation of already-honest high openings, shared edge containment, collision-profile immutability, and renderer use of the same edge helper for cloud/building hazards.

## Human gate
Approve only if cloud bottoms and building rooflines feel more related and fair. Reject if openings look materially wider than they play, buildings feel undersized, or the 2px edge starts resembling a collision line or guide rail.

## Verification
Run `npm run quality`, then play repeated low/high openings and deliberately inspect near-misses against both cloud bottoms and building rooflines in `npm run dev`.

## Rollback
Discard `polish-p4-obstacle-cohesion`; baseline remains `main` @ `50a88d5`.
