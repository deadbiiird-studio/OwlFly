# Polish P4 — Obstacle Cohesion Review

## Status
**97/100 — REPAIRED CANDIDATE. TARGET-MACHINE + HUMAN GATES PENDING.**

Base checkpoint: B1 merged `main` @ `50a88d5c28bc007a37cb11f47e25eddd7146f737`.

## Goal
Make foreground cloud/building hazards read as one deliberate art family while preserving the exact gameplay corridor.

## Implementation
- Building gap-facing visual reach remains at the sealed A1 value of 80px.
- Every building opening preserves its existing scale and collision interpretation.
- Cloud and building hazards now share one 2px inset gap-edge presentation helper.
- Cloud edge sits inside the bottom of the top hazard bounds; building edge sits inside the top of the bottom hazard bounds.
- Shared edge alpha is capped at 0.14 and never draws into the playable gap.

## Hard preservation rules
- collision profiles, collision reach, and generated collision bands must remain unchanged;
- obstacle rectangles, gaps, spawn cadence, scoring and physics remain unchanged;
- building scale must remain unchanged;
- no highlight may extend beyond its obstacle bounds;
- foreground silhouettes must remain more readable, never more deceptive.

## Regression coverage
`polish.obstacle_cohesion_contract.test.mjs` verifies the sealed 80px visual and collision reach, exact fit preservation across all 13 building profiles, shared edge containment, collision-profile immutability, and renderer use of the same edge helper for cloud/building hazards.

## Human gate
Approve only if cloud bottoms and building rooflines feel more related and fair without any perceived change in opening size. Reject if the 2px edge resembles a collision line or guide rail.

## Verification
Run `npm run quality`, then play repeated low/high openings and deliberately inspect near-misses against both cloud bottoms and building rooflines in `npm run dev`.

## Rollback
Discard `polish-p4-obstacle-cohesion`; baseline remains `main` @ `50a88d5`.
