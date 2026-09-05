# Atmosphere City A3 — Authored Distant-City Character Review

## Status
**APPROVED — 98/100** on `atmosphere-city-a3`.

Parent checkpoint: A2 merged to `main` @ `9ca36e7f28ff99e98f23b9031432368f2369228c`

A3 has now cleared both the automated target-machine gate and the human production readability/playability gate.

## Current noticed position
A1/A2 provide a stable, readable far / mid / near city stack, but the skyline geometry was still primarily hash-generated. The city had depth, yet the distant silhouette lacked a repeatable authored signature.

## Expected noticed position
The far horizon should read as a specific OwlFly city: a quiet, recognizable skyline rhythm that repeats intentionally across world space while hazards and the owl remain visually dominant.

## Change lane
**Environment addition / presentation refinement.**

No gameplay mechanic is introduced. No collision, route choice, scoring, controls, state flow, or persistence semantics change.

## Final score
**98/100 — APPROVED**

| Category | Score | Reason |
|---|---:|---|
| Identity coherence | 20/20 | Replaces anonymous far-skyline randomness with an authored city phrase. |
| Gameplay readability | 19/20 | Uses the A2-approved far-layer bounds, opacity, speed, and roof vocabulary; human playtest reported no new difficulty or confusion. |
| Baseline preservation | 20/20 | Geometry is non-collidable and gameplay metrics remained identical to A2. |
| Architecture / maintainability | 15/15 | Extends the existing pure `environmentGeometry.js` owner rather than adding a second rendering system. |
| Future leverage | 15/15 | Establishes a deterministic motif language that later districts can vary without changing gameplay. |
| Mobile / performance fit | 9/10 | Same segment count and renderer path; only a small frozen motif lookup is added. |
| **Total** | **98/100** | |

All hard admission floors are satisfied.

## Full impact map

### Production file changed
- `src/render/environmentGeometry.js`
  - adds frozen `DISTANT_CITY_MOTIF`;
  - far skyline width / height / roof choice now comes from the authored motif;
  - mid and near skyline generation remain on their existing deterministic path;
  - far speed, alpha, baseY, step, min/max dimensions, layer order, and depth remain unchanged.

### Renderer
- `src/render/renderer.js` is intentionally unchanged.
- Existing `drawCityDepthLayers()` / `drawCitySegment()` consume the far geometry without a new rendering branch.

### Themes
- `src/core/themes.js` is unchanged.
- No theme IDs, unlock requirements, names, palette values, or persistence behavior are changed in this slice.

### Gameplay / engine
Explicitly untouched:
- collision profiles;
- obstacle visual fit;
- owl physics;
- obstacle gaps;
- spawn cadence;
- scoring;
- difficulty;
- fracture/glide behavior;
- Cozy City PNGs.

### Build integration
No new production source file is introduced, so Node and PowerShell build manifests require no ordering change.

### Test surface added
- `tooling/eval/tests/vision.distant_city_character.test.mjs`
  - validates motif normalization and approved roof vocabulary;
  - proves far geometry maps to the authored phrase instead of hash-random proportions;
  - proves the phrase repeats consistently in world space;
  - runs the complete A2 readability audit over 360 / 480 / 720 widths, multiple times, and normal + reduced-motion states;
  - asserts the layer/parallax contract remains unchanged.

## Target-machine verification
Executed from `atmosphere-city-a3` @ `92bbcd8` before approval.

### `npm run quality` — PASS
The composite gate completed successfully:

- `npm run build` — PASS
- `npm run test` — **67/67 PASS**, 0 failures
- `npm run eval:gate` — PASS across 40 runs
- `npm run eval:visual` — PASS across 30 sampled environment states

### Gameplay eval
Gameplay remained identical to the A2 checkpoint:

- score avg: `8.5`
- p50: `6`
- p90: `17`
- average survival: `13.009s`
- gapMin: `216`
- shiftP95Avg: `36.7`
- deaths: `36 top / 4 bottom`
- death contexts: `27 top_fair_hit / 9 top_edge_brush / 4 bottom_fair_hit`
- boundary deaths: `0`

### Visual-readability eval
A3 remained inside the committed A2 budgets:

- far: alpha `0.14`, speed `5.0`, visible coverage <= `0.759`, top >= `512.0`
- mid: alpha `0.20`, speed `11.0`, visible coverage <= `0.745`, top >= `551.1`
- near: alpha `0.25`, speed `20.0`, visible coverage <= `0.787`, top >= `600.4`
- all 30 sampled states passed

## Human production gate
**PASS.**

Observed user verdict after playing the A3 build:

> “yes, this reads better and nothing got harder/confusing”

This satisfies the required human veto condition: the authored skyline improved the noticed city character without introducing a false route cue, gameplay confusion, or perceived difficulty increase.

## A2 budget preservation by construction
A3 does not increase:
- far alpha (`0.14`);
- far speed (`5 px/s`);
- segment count;
- layer order;
- max far height (`118`);
- approved roof vocabulary (`0`, `1`, `2`).

The tallest authored beat begins at `y=512` (`baseY 630 - maxHeight 118`), below the A2 protected upper flight-field boundary at `y=500`.

## Low-value alternatives rejected
- Add more far-layer alpha: rejected; A2 far alpha is already at its budget ceiling.
- Add faster skyline motion: rejected; identity should come from shape, not spectacle.
- Add window flicker now: deferred to the Living City Detail phase rather than mixing A3 with Phase B.
- Add new roof vocabulary now: rejected for this slice; would reopen the A2 quiet-roof policy.
- Change theme IDs/names now: deferred; unnecessary persistence/UI risk.
- Add a second distant-city renderer: rejected; duplicates ownership and increases drift risk.

## Protected surfaces after A3
Do not casually reopen:
- A1 city composition and gap-aware visual fit;
- A2 readability budgets;
- A3 distant-city motif language;
- collision profiles;
- owl physics;
- obstacle gaps/spawn cadence;
- scoring/difficulty;
- Cozy City PNGs.

## Rollback
Rollback target remains the A2 `main` checkpoint @ `9ca36e7f28ff99e98f23b9031432368f2369228c` until A3 is merged. After merge, the A3 merge commit becomes the new atmosphere baseline.

## Advancement decision
**CHECKPOINT APPROVED.**

A3 may merge. After merge, the next approved route is Phase B / Living City Detail System, where sparse occupancy cues such as window-light patterns, rooftop antenna blink, water-tank silhouettes, restrained sign/vent motion, or occasional distant aerial detail can be evaluated one class at a time inside the sealed A2/A3 readability envelope.
