# Living City B1 — Sparse Deterministic Window Lights Review

## Status
APPROVED CHECKPOINT CANDIDATE on `living-city-b1-window-lights`.

B1 has passed the complete target-machine automated quality gate and the human production/readability gate.

Parent checkpoint: A3 merged to `main` @ `a28156c58e7ee76f35762c1f5c06857a333fa384`.

Production code verified on target machine: `aba6cb5030047c64a3ec3f0410e6de6aa6c1ca40`.

## Current noticed position
A3 gives the distant city an intentional authored silhouette rhythm. B1 adds the first sparse sign of occupancy without changing route truth or gameplay behavior.

## Expected noticed position
The far skyline should feel like a place people inhabit, while the windows remain unmistakably background detail and never compete with owl, cloud, or building hazards.

## Change lane
**Environment addition / presentation refinement.**

No gameplay mechanic is introduced.

## Final score
**97/100 — APPROVED**

| Category | Score | Reason |
|---|---:|---|
| Identity coherence | 19/20 | Occupancy directly strengthens the Living City north star. |
| Gameplay readability | 20/20 | Tiny far-layer-only lights remain inside building bodies and below the protected flight field. |
| Baseline preservation | 20/20 | No collision, physics, scoring, gaps, spawning, or obstacle semantics changed. |
| Architecture / maintainability | 14/15 | Detail geometry stays beside skyline geometry; renderer only consumes it. |
| Future leverage | 15/15 | Establishes deterministic detail vocabulary reusable by districts and later theme treatment. |
| Mobile / performance fit | 9/10 | Maximum four tiny rectangles per far segment; no assets, animation, or new production module. |
| **Total** | **97/100** | |

All hard design floors are satisfied by observed evidence.

## Implementation

### `src/render/environmentGeometry.js`
Adds `CITY_DETAIL_CONTRACT.farWindows` and `getCityWindowLights()`.

B1 constraints:
- far layer only;
- maximum 4 lights per city segment;
- deterministic placement tied to `worldIndex` and stable cell identity;
- roof, side, and bottom insets;
- 1.5–2.2 px width at base resolution;
- 3 px height;
- alpha capped at `0.20`;
- no time input, blink state, or random runtime mutation.

### `src/render/renderer.js`
The existing city-depth pass consumes the geometry-owned light rectangles after drawing each far skyline layer.

Default light color is restrained warm `#ffd27d`. No theme IDs, names, unlocks, or persistence values changed.

### Regression coverage
`tooling/eval/tests/vision.living_city_window_lights.test.mjs` verifies:
- sparse/quiet B1 contract limits;
- deterministic placement;
- far-layer-only semantics;
- window bounds remain inside building bodies;
- all lights stay below the A2 protected upper flight field;
- local light patterns do not reshuffle while parallax moves world segments;
- A3 parallax/layer values remain sealed;
- renderer consumes geometry-owned detail and introduces no `Math.random()` placement.

The first target-machine run exposed an overly strict exact-float assertion in the parallax-stability test. The actual light patterns were identical except for floating-point noise at approximately 1e-15. Production code was left untouched; the regression was corrected to use a 1e-9 tolerance while still requiring identical light count, cell identity, and effectively identical local geometry.

## Target-machine automated evidence — PASS
Executed on the OwlFly target machine from `living-city-b1-window-lights` at `aba6cb5`:

- `npm run quality` — PASS
- build — PASS
- test — **73/73 PASS** across 18 test files
- `eval:gate` — PASS across 40 runs
- `eval:visual` — PASS across 30 sampled environment states
- `npm run dev` — Vite served successfully at local development runtime

Gameplay metrics remain identical to the sealed A3 baseline:
- score average: `8.5`
- p50: `6`
- p90: `17`
- average survival: `13.009s`
- gap minimum: `216`
- shift P95 average: `36.7`
- deaths: `36 top / 4 bottom`
- boundary deaths: `0`

Visual-readability metrics remain inside the sealed A2/A3 envelope:
- far: alpha `0.14`, speed `5.0`, visible coverage <= `0.759`, top >= `512.0`
- mid: alpha `0.20`, speed `11.0`, visible coverage <= `0.745`, top >= `551.1`
- near: alpha `0.25`, speed `20.0`, visible coverage <= `0.787`, top >= `600.4`
- all 30 sampled environment states passed

## Human production evidence — PASS
Final runtime verdict:

> “this is a solid foundation to build up on.”

This clears the human veto. The B1 detail reads as a successful foundation for continued Living City work, with no reported gameplay confusion or need to reopen A1/A2/A3 surfaces.

## Explicitly untouched
- owl physics;
- collision profiles;
- obstacle gap sizes;
- spawn cadence;
- scoring/difficulty;
- cloud semantics;
- building hazard sprites;
- obstacle visual-fit logic;
- A3 12-beat skyline motif;
- far/mid/near layer alpha/speed/base geometry;
- fracture/glide behavior;
- theme IDs and unlock persistence;
- build dependency manifests.

## Deliberately deferred
B1 does **not** include:
- blinking/flicker;
- antennas;
- water tanks;
- vents;
- signs;
- plants;
- laundry motion;
- aerial events;
- weather;
- districts;
- sprite-sheet conversion.

Those remain separate detail classes so density can be reviewed one layer at a time.

## Rollback
Rollback target remains sealed A3 on `main` @ `a28156c58e7ee76f35762c1f5c06857a333fa384` until B1 merges.

## Advancement rule
B1 is approved to merge because:
- `npm run quality` passes on the target machine — **SATISFIED**;
- human readability/playability verdict is positive — **SATISFIED**;
- the added detail increases city life without observed gameplay ambiguity — **SATISFIED**;
- no sealed A1/A2/A3 gameplay/readability surface was reopened — **SATISFIED**.

After B1, the next default slice is B2 rooftop life, one prop class at a time.
