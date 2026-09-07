# Living City B1 Checkpoint — Sparse Deterministic Window Lights

## Decision
**APPROVED — 97/100**

B1 establishes the first Living City detail layer on top of the sealed A3 atmosphere checkpoint.

## Parent checkpoint
A3 merged to `main` @ `a28156c58e7ee76f35762c1f5c06857a333fa384`.

## Verified production candidate
`aba6cb5030047c64a3ec3f0410e6de6aa6c1ca40`

Subsequent branch commits after that SHA contain review/checkpoint evidence only.

## What B1 adds
- static deterministic warm windows on the far skyline only;
- maximum four tiny lights per far building segment;
- geometry-owned placement keyed to stable world segment identity;
- existing renderer consumption with no second drawing system;
- no flicker, no random runtime placement, no sprite-sheet dependency.

## Automated evidence
Target-machine `npm run quality` PASS:
- 18 test files;
- **73/73 tests PASS**;
- gameplay eval PASS across 40 runs;
- visual-readability PASS across 30 sampled environment states;
- Vite dev runtime served successfully.

Gameplay remained identical to A3:
- score avg `8.5`;
- p50 `6`;
- p90 `17`;
- average survival `13.009s`;
- gapMin `216`;
- shiftP95Avg `36.7`;
- deaths `36 top / 4 bottom`;
- boundary deaths `0`.

Visual envelope remained sealed:
- far alpha `0.14`, speed `5.0`, coverage <= `0.759`, top >= `512.0`;
- mid alpha `0.20`, speed `11.0`, coverage <= `0.745`, top >= `551.1`;
- near alpha `0.25`, speed `20.0`, coverage <= `0.787`, top >= `600.4`.

## Human production gate
**PASS**

Verdict:

> “this is a solid foundation to build up on.”

## Baseline preservation
B1 does not change:
- collision;
- physics;
- obstacle gaps;
- spawn cadence;
- scoring/difficulty;
- hazard semantics;
- Cozy City obstacle sprites;
- obstacle visual fit;
- A3 authored skyline motif;
- layer parallax contract;
- theme IDs/unlock persistence;
- fracture/glide behavior.

## Regression note
The first B1 target-machine run exposed one false-negative test caused by exact float equality at ~1e-15. Production geometry was correct. The test was corrected to use a 1e-9 tolerance while preserving exact light-count and cell-identity checks; the full quality gate then passed 73/73.

## Checkpoint rule
After merge, B1 becomes the new Living City baseline. Future B2 detail classes must not reopen B1 window density/identity merely to compensate for new clutter.

## Next default route
B2 — rooftop life, one prop class at a time. Candidate classes should be scored independently before implementation: water tanks, antennas, vents, signs, or tiny rooftop plants.
