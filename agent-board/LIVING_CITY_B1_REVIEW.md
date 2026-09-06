# Living City B1 — Sparse Deterministic Window Lights Review

## Status
IMPLEMENTED CANDIDATE on `living-city-b1-window-lights`.

This is **not yet an approved checkpoint**. B1 requires the target-machine quality gate plus a human production playtest before merge.

Parent checkpoint: A3 merged to `main` @ `a28156c58e7ee76f35762c1f5c06857a333fa384`.

## Current noticed position
A3 gives the distant city an intentional authored silhouette rhythm, but the skyline remains visually unoccupied. It reads as a designed place, not yet a living place.

## Expected noticed position
The far skyline should gain tiny signs of occupancy through sparse warm windows while remaining unmistakably background scenery. The lights must not create a route cue, collision cue, bright fence, or moving distraction.

## Change lane
**Environment addition / presentation refinement.**

No gameplay mechanic is introduced.

## Admission score
**97/100 — ADMITTED AS B1 CANDIDATE**

| Category | Score | Reason |
|---|---:|---|
| Identity coherence | 19/20 | Occupancy is a direct step toward the Living City north star. |
| Gameplay readability | 20/20 | Tiny far-layer-only lights stay below the protected flight field and inside building bodies. |
| Baseline preservation | 20/20 | No collision, physics, scoring, gaps, spawning, or obstacle semantics change. |
| Architecture / maintainability | 14/15 | Detail geometry stays beside skyline geometry; renderer only consumes it. |
| Future leverage | 15/15 | Establishes deterministic detail vocabulary reusable by districts and later theme treatment. |
| Mobile / performance fit | 9/10 | Maximum four tiny rectangles per far segment; no assets, animation, or new production module. |
| **Total** | **97/100** | |

All hard design floors are satisfied by construction. Final approval remains contingent on observed evidence.

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

Default light color is restrained warm `#ffd27d`. No theme IDs, names, unlocks, or persistence values change.

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

## Likely self-inflicted faults guarded against
- windows drifting independently from their building;
- lights entering roof silhouettes or the protected flight field;
- bright rows forming a false route boundary;
- runtime randomization causing flicker/reshuffle;
- detail appearing on mid/near layers before far-layer density is approved;
- accidentally changing the sealed A3 parallax contract.

## Verification required before approval
On the target OwlFly machine:

```bash
git fetch origin
git switch living-city-b1-window-lights
git pull --ff-only
npm run quality
```

Expected test count is the A3 baseline plus the new B1 test file/tests.

Then run:

```bash
npm run dev
```

Human production gate:
1. Play several normal runs.
2. Confirm the windows make the distance feel occupied/alive.
3. Confirm the lights never resemble collectibles, hazards, openings, or a route boundary.
4. Confirm owl/cloud/building hazards remain visually dominant.
5. Confirm the windows are sparse rather than forming a regular grid wall.
6. Toggle reduced motion and confirm the same window identity remains without any independent animation.
7. Reject B1 if the lights are too bright, too dense, too regular, or visually meaningless.

## Rollback
B1 is isolated to `living-city-b1-window-lights`.

Rollback target is the sealed A3 checkpoint on `main` @ `a28156c58e7ee76f35762c1f5c06857a333fa384`.

## Advancement rule
B1 may merge only when:
- `npm run quality` passes on the target machine;
- human readability/playability verdict is positive;
- the added detail clearly increases city life without increasing gameplay ambiguity;
- no sealed A1/A2/A3 gameplay/readability surface was reopened.

After B1, the next default slice is B2 rooftop life, one prop class at a time.
