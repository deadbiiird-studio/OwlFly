# Atmosphere City A1 — Approved Checkpoint

## Decision
**APPROVED — 96/100**

Human verdict after the corrective production playtest: **better**.

## Locked references
- Protected gameplay baseline: `collision-fidelity-pass` @ `3305fe6a60895f21ab4c6646695321accf31658f`
- A1 implementation + gap-correction head tested on the target machine: `c6409d9a7c8c5882d7d2f36964ab038d4c51dea6`
- A1 final review approval record: `418875cd8671533749ec4da67b34461e3e9214bd`
- Working branch: `atmosphere-city-pass`

## Target-machine evidence
- Build: PASS
- Tests: 56/56 PASS
- Eval gate: PASS, 40 runs
- Average score: 8.5
- Median score: 6
- p90 score: 17
- Average survival: 13.009s
- Minimum gap: 216
- Boundary deaths: 0

## What A1 owns
- far / mid / near deterministic city-depth geometry;
- parallax ordering;
- reduced-motion behavior for environment layers;
- composition behind real hazards;
- production build ordering for environment geometry;
- gap-aware building visual fit shared by renderer and collision;
- tests that prevent tall buildings from visually faking a sealed route.

## What remains protected from A1 work
Unless a new >=90 approved revision demonstrates necessity, A1 does not reopen:
- owl physics;
- obstacle spawn spacing;
- base gap rules;
- scoring;
- difficulty;
- collision-profile source data;
- Cozy City PNG artwork.

## Advancement rule
A2 may build on this checkpoint but should not casually revise it. Any regression against the A1 human verdict, 56-test baseline, or legal-gap readability is a stop condition.
