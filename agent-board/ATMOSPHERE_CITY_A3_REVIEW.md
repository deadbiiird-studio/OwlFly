# Atmosphere City A3 — Authored Distant-City Character Review

## Status
IMPLEMENTED CANDIDATE on `atmosphere-city-a3`.

This is **not yet an approved checkpoint**. A3 still requires the complete automated quality gate plus a human production playtest before it can be promoted or merged.

Parent checkpoint: A2 merged to `main` @ `9ca36e7f28ff99e98f23b9031432368f2369228c`

## Current noticed position
A1/A2 provide a stable, readable far / mid / near city stack, but the skyline geometry is still primarily hash-generated. The city has depth, yet the distant silhouette lacks a repeatable authored signature.

## Expected noticed position
The far horizon should begin to read as a specific OwlFly city: a quiet, recognizable skyline rhythm that repeats intentionally across world space while hazards and the owl remain visually dominant.

## Change lane
**Environment addition / presentation refinement.**

No gameplay mechanic is introduced. No collision, route choice, scoring, controls, state flow, or persistence semantics change.

## Admission score before implementation
**98/100 — ADMITTED AS A3 CANDIDATE**

| Category | Score | Reason |
|---|---:|---|
| Identity coherence | 20/20 | Replaces anonymous far-skyline randomness with an authored city phrase. |
| Gameplay readability | 19/20 | Uses the existing A2-approved far-layer bounds, opacity, speed, and roof vocabulary; human gate still required. |
| Baseline preservation | 20/20 | Geometry is non-collidable and no gameplay surface changes. |
| Architecture / maintainability | 15/15 | Extends the existing pure `environmentGeometry.js` owner rather than adding a second rendering system. |
| Future leverage | 15/15 | Establishes a deterministic motif language that later districts can vary without changing gameplay. |
| Mobile / performance fit | 9/10 | Same segment count and renderer path; only a small frozen motif lookup is added. |
| **Total** | **98/100** | |

All hard admission floors are satisfied by design. Final approval remains contingent on observed evidence.

## Full impact map

### Production file changed
- `src/render/environmentGeometry.js`
  - adds frozen `DISTANT_CITY_MOTIF`;
  - far skyline width / height / roof choice now comes from the authored motif;
  - mid and near skyline generation remain on their existing deterministic path;
  - far speed, alpha, baseY, step, min/max dimensions, layer order, and depth remain unchanged.

### Renderer
- `src/render/renderer.js` is intentionally unchanged.
- Existing `drawCityDepthLayers()` / `drawCitySegment()` consume the new far geometry without a new rendering branch.

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

## A2 budget preservation by construction
A3 does not increase:
- far alpha (`0.14`);
- far speed (`5 px/s`);
- segment count;
- layer order;
- max far height (`118`);
- approved roof vocabulary (`0`, `1`, `2`).

The tallest authored beat therefore still begins at `y=512` (`baseY 630 - maxHeight 118`), below the A2 protected upper flight-field boundary at `y=500`.

## Low-value alternatives rejected
- Add more far-layer alpha: rejected; A2 far alpha is already at its budget ceiling.
- Add faster skyline motion: rejected; identity should come from shape, not spectacle.
- Add window flicker now: deferred to the Living City Detail phase rather than mixing A3 with Phase B.
- Add new roof vocabulary now: rejected for this slice; would reopen the A2 quiet-roof policy.
- Change theme IDs/names now: deferred; unnecessary persistence/UI risk.
- Add a second distant-city renderer: rejected; duplicates ownership and increases drift risk.

## Likely self-inflicted faults guarded against
- negative world indices selecting the wrong motif beat;
- authored landmark heights entering the protected flight field;
- motif widths pushing visible coverage beyond A2 budgets;
- reduced-motion producing a different city language;
- accidental change to parallax speeds or layer ordering.

## Verification required before approval
Run on the target machine from `atmosphere-city-a3`:

```bash
npm run quality
npm run build
npm run test
npm run eval:gate
npm run eval:visual
```

Then perform the human production gate:

1. Fresh production load.
2. Play several runs across at least `night`, `sunrise`, and `neon` if unlocked.
3. Confirm the far skyline feels more intentional / recognizable than A2.
4. Confirm it never resembles a collision surface or narrows the perceived corridor.
5. Confirm the owl and cloud/building hazards remain the strongest moving silhouettes.
6. Toggle reduced motion and confirm the same authored skyline identity remains, simply frozen.
7. Reject A3 if the motif becomes visibly repetitive in a distracting way or creates any false route cue.

## Rollback
A3 is isolated to the branch. Rollback is the A2 `main` checkpoint @ `9ca36e7f28ff99e98f23b9031432368f2369228c`.

## Advancement rule
A3 may be checkpointed only when:
- `npm run quality` passes;
- standalone build/test/eval gates pass;
- human readability/playability verdict is positive;
- no protected A1/A2 surface was reopened to compensate for the art.

Only then should A3 merge and Phase B / living-city details be considered.
