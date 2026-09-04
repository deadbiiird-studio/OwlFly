# Atmosphere City A1 — Gap Readability Revision

## Status
CORRECTIVE REVISION IMPLEMENTED on `atmosphere-city-pass`; target-machine retest required before A1 can be checkpointed.

This revision was triggered by human visual review after the A1 technical gate passed.

Human finding:
> A tall Cozy City building can make the opening look almost unwinnable even when the collision system still leaves a fair route.

That finding is a hard readability failure under the Atmosphere City design contract, so A1 remains unapproved until the visual mismatch is corrected and re-tested.

---

## Root Cause
The building renderer used a large bottom-anchored contain box with a minimum width of 300px. For several tall tower sprites, the visible architectural alpha could extend far upward into the nominal obstacle gap.

The collision system, however, intentionally capped building collision reach to 80px into that gap.

Result: the game could present a large amount of **visible building art that was intentionally non-lethal**. A player saw a nearly closed passage while the collision model still considered a much larger route open.

This is not acceptable visual communication for a precision arcade game.

### Worst-case screen study
Using the committed Set A building PNGs, committed cloud PNGs, and the current renderer/collision transforms, a legal low-gap arrangement can reduce the visible alpha clearance to roughly **1–2px** even though the collision opening in that same neighborhood remains roughly **236px**.

That means the problem was not primarily the legal obstacle gap. It was the building art visually over-occupying space that gameplay considered open.

---

## Approved Correction — 95/100

### Design score
| Category | Weight | Score | Reason |
|---|---:|---:|---|
| Identity coherence | 20 | 18 | Preserves Cozy City architecture while making it read more like an honest rooftop/ridge hazard. |
| Gameplay readability | 20 | 20 | Visible building height now adapts when a tall sprite would falsely close the flight corridor. |
| Baseline preservation | 20 | 18 | Spawn/gap/physics/scoring rules remain unchanged; effective building contour becomes more forgiving only where visual scale is reduced. |
| Architecture / maintainability | 15 | 15 | One pure `obstacleVisualFit` helper is shared by collision and renderer. |
| Future leverage | 15 | 14 | Establishes a reusable rule for keeping hazard art honest against playable geometry. |
| Mobile / performance fit | 10 | 10 | Constant-time arithmetic; no extra per-pixel runtime work or new assets. |
| **Total** | **100** | **95** | **ADMITTED FOR RETEST.** |

Hard vetoes:
- Readability >=18: PASS.
- Baseline preservation >=18: PASS.
- Architecture >=13: PASS.
- No visual-clutter compensation through gap widening: PASS.
- One shared fit source for renderer/collision: PASS.
- Independently rollbackable: PASS.

---

## Implementation
Added `src/engine/obstacleVisualFit.js`.

The helper:
- reads the selected building collision profile;
- finds the highest meaningful collision roof edge for that sprite;
- calculates how tall the bottom-anchored sprite may be before that meaningful roof edge crosses farther than the existing 80px building gap reach;
- leaves buildings at their existing scale when they already fit honestly;
- scales only the problematic low-gap/tall-building combinations down;
- is used by both `ObstaclePair` collision geometry and the renderer so they cannot drift apart.

No obstacle spawn gap was widened.
No owl physics changed.
No score/difficulty logic changed.
No Cozy City PNG was edited.

---

## Expected Visual Position After Revision
Before:
> Some tower/cloud pairings visually resemble a nearly sealed wall even when the collision route is fair.

After:
> Tall low-gap buildings settle toward a restrained rooftop/ridge profile, leaving the playable opening visibly believable. Buildings with plenty of room retain their original stronger scale.

Internal geometry sweep after the fit rule increases the worst visible alpha clearance from roughly **1–2px** to roughly **127px** across the sampled legal combinations, while preserving the existing spawn-gap rules.

The exact human target remains qualitative: the passage should look challenging but obviously possible.

---

## Over-Cloud Route Idea
The suggestion that the owl could sometimes fly **above** a cloud is captured, but is intentionally not bundled into this correction.

An always-open over-cloud route would change top-obstacle collision semantics and therefore fails the current A1 baseline-preservation lane.

A future version can qualify as a separate 90+ mechanic if it is:
- rare rather than universal;
- visually telegraphed before commitment;
- restricted to selected floating cloud formations;
- independently tested for route fairness;
- unable to create ambiguous "is this cloud a ceiling or a floating obstacle?" states.

That concept should receive its own implementation contract after A1 readability is stable.

---

## Verification Required
From `atmosphere-city-pass`:

```bash
npm run build
npm run test
npm run eval:gate
python3 -m http.server 8080 -d web
```

Human review should specifically seek:
- the previously almost-closed building/cloud combinations;
- whether tall towers now sit just outside the dangerous edge of the gap;
- whether buildings still look intentional rather than tiny;
- whether the result approaches a rooftop/ridge rhythm without becoming generic terrain;
- whether collision contact still matches what the eye expects;
- whether gameplay remains smooth.

A1 remains unapproved until this revision survives both the technical and human gates.
