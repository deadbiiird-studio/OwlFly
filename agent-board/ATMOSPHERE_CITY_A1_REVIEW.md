# Atmosphere City A1 — Analysis & Review

## Status
IMPLEMENTED ON `atmosphere-city-pass` — awaiting local build/test/eval/playtest before checkpoint approval.

Design contract: `agent-board/ATMOSPHERE_CITY_DESIGN_CONTRACT.md`
Protected gameplay baseline: `collision-fidelity-pass` @ `3305fe6a60895f21ab4c6646695321accf31658f`

---

## Goal
Create the smallest reusable city-depth architecture that makes OwlFly's world read as layered urban space without touching gameplay truth.

A1 is intentionally geometry-first. It does not add weather, windows, signs, rooftop props, districts, new obstacle types, or gameplay mechanics.

---

## Current Design Position Before A1
The foreground language is strong: Cozy City building hazards and cloud hazards have readable, sprite-aware collision. The background still behaves primarily like a procedural sky/ground treatment.

Noticed position before A1:
> polished flyer with strong city obstacles over a generic/procedural backdrop.

---

## Expected Noticed Position After A1
The first visible environmental change should be depth, not spectacle:

- a very slow distant city mass;
- a slower mid-city roof rhythm;
- a restrained near-city non-collision silhouette;
- all three sit behind the existing ground and hazards;
- foreground hazards remain the highest-contrast architectural forms.

Noticed position after A1:
> the buildings now appear to belong to a city extending behind them rather than being isolated obstacle art.

A1 is not expected to finish the environment identity by itself. It establishes the geometry/parallax grammar that later phases can author more deeply.

---

## Verified Implementation Facts
- Added `src/render/environmentGeometry.js` as a pure visual geometry module.
- The module exports a locked far/mid/near layer contract and deterministic skyline segment generation.
- Far -> mid -> near depth, speed, base position, size, and opacity increase in controlled steps.
- Reduced-motion mode freezes parallax by forcing visual time to zero.
- `renderer.js` composes city layers after sky/cloud/glow and before ground/hazards.
- City silhouettes use quiet flat/stepped roofs only; A1 deliberately excludes antennas, spires, windows, signs, wires, and lights.
- Node and PowerShell production build manifests load environment geometry before the renderer.
- Added dedicated atmosphere geometry/build-order tests and a production-bundle dependency guard.
- No collision, physics, scoring, spawn, difficulty, obstacle-profile, or Cozy City PNG files were changed.

---

## A1 Design Gate — Preliminary Score

| Category | Weight | Score | Reason |
|---|---:|---:|---|
| Identity coherence | 20 | 18 | Introduces real city depth; authored detail comes in later phases. |
| Gameplay readability | 20 | 20 | Low alpha, lower-field placement, quiet roof vocabulary, rendered behind ground/hazards. |
| Baseline preservation | 20 | 20 | Visual-only module; no gameplay truth changed. |
| Architecture / maintainability | 15 | 15 | Pure visual geometry is separated from renderer composition and build order is guarded. |
| Future leverage | 15 | 15 | Same layer contract can host authored skylines, windows, districts, haze and weather later. |
| Mobile / performance fit | 10 | 9 | Small deterministic Canvas paths only; runtime performance still requires local confirmation. |
| **Preliminary Total** | **100** | **97** | **ADMITTED; final approval pending runtime verification.** |

Hard-veto checks:
- Readability >= 18/20: PASS.
- Baseline preservation >= 18/20: PASS.
- Architecture >= 13/15: PASS.
- No gameplay compensation for visuals: PASS.
- No second gameplay-geometry truth: PASS.
- Independently testable/rollbackable: PASS.

---

## Erroneous / Low-Value Alternatives Rejected During A1

### Put city-parallax constants directly into `renderer.js` — 84/100 — REJECT
Fast initially, but turns renderer into the only source of geometry and makes future districts/weather harder to test independently.

### Use random skyline generation every frame — 41/100 — REJECT
Would create shimmer/popping, non-reproducible visual bugs, and unnecessary runtime work.

### Add window lights and rooftop props at the same time — 86/100 — REJECT FOR A1
Good later ideas, but they would prevent us from separating depth/readability problems from detail-density problems.

### Add skyline PNG asset sheets before geometry proof — 87/100 — REJECT FOR A1
Would introduce asset-path/loading risk before the visual layer contract itself has been validated.

### Make the parallax respond to gameplay speed — 78/100 — DEFER
Potentially valuable later, but would couple atmosphere to gameplay truth before the visual hierarchy is proven.

### Put background buildings into obstacle/collision entities — 18/100 — REJECT
Would violate the visual/gameplay boundary and create fake hazards or a second collision truth.

---

## Self-Inflicted-Fault Controls Used

1. **Branch isolation** — all atmosphere work remains on `atmosphere-city-pass`.
2. **Protected baseline** — `collision-fidelity-pass` remains untouched.
3. **One new source primitive** — environment geometry has one visual source of truth.
4. **No gameplay edits** — collision/physics/scoring/spawn lanes remain outside A1.
5. **Deterministic generation** — same time + layer produces the same skyline.
6. **Reduced-motion contract** — animation can freeze without a second layout.
7. **Build-path symmetry** — Node and PowerShell manifests changed together.
8. **Bundle-order guard** — production bundle must declare environment geometry before `Renderer`.
9. **Density restraint** — no decorative windows/props until depth itself is approved.
10. **Rollback checkpoint** — A1 can be abandoned by returning to the atmosphere branch's design-contract commit or the protected gameplay baseline.

---

## Verification Required For Final A1 Approval
Run locally from `atmosphere-city-pass`:

```bash
npm run build
npm run test
npm run eval:gate
```

Then production playtest:

```bash
python3 -m http.server 8080 -d web
```

Review criteria:
- skyline movement clearly reads far < mid < near;
- decorative skyline never looks collidable;
- owl/cloud/building hazards remain visually dominant;
- no new stutter on target hardware;
- reduced-motion remains stationary;
- existing gameplay feel is unchanged;
- no runtime or asset errors caused by A1.

Final disposition after evidence:
- >= 90 and no veto: CHECKPOINT A1 and advance to A2.
- 80–89: revise A1 only; do not advance.
- < 80 or any hard veto: revert A1.

---

## Next Approved Work If A1 Passes
A2 is **readability instrumentation and visual acceptance tightening**, not more scenery.

Only after that gate passes do we move to authored distant-city treatment, living detail, or atmosphere effects.
