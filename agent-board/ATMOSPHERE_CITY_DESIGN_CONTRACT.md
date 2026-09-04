# OwlFly Atmosphere City Design Contract

## Status
LOCKED DESIGN DIRECTION for `atmosphere-city-pass`.

This document is the governing design contract for the next OwlFly environment pass. It exists to prevent drift, speculative rewrites, low-value additions, and regressions against the current collision/gameplay baseline.

Baseline branch: `collision-fidelity-pass`
Baseline commit at branch creation: `3305fe6a60895f21ab4c6646695321accf31658f`
Working branch: `atmosphere-city-pass`

No revision or addition enters this pass unless it scores **90/100 or higher** under the Design Gate below and clears all hard vetoes.

---

# 1. Current Design Position

OwlFly now has a strong playable foreground language:

- owl flight feel is stable enough to preserve;
- top hazards are six cloud variants;
- bottom hazards are thirteen Cozy City building variants;
- collision follows sprite-aware silhouettes rather than broad generic rectangles;
- collision and rendered obstacle variants are synchronized;
- the production bundle includes collision profiles correctly;
- tests and eval currently protect the improved gameplay baseline.

The weak design layer is now the **world behind the hazards**.

The renderer currently provides procedural sky, ambient clouds, glow, ground/ridge treatment, and theme color changes. These elements create atmosphere, but they do not yet create a coherent city with a strong sense of distance, travel, place, or authored visual hierarchy.

There is also a conceptual mismatch in the existing theme vocabulary: `night`, `sunrise`, `dusk`, `haunted`, and `neon` are mechanically useful unlock/theme IDs, but several current display identities (`Night Desert`, `Sunrise Canyon`, `Haunted Grove`) no longer align cleanly with the new Cozy City foreground.

**Current noticed position:**
> A polished arcade flyer with noticeably improved buildings and collision, but a background/world layer that still reads as a procedural backdrop rather than a distinctive place.

---

# 2. Expected Noticed Position at Completion

The completed pass should make a player immediately perceive:

> **A small owl flying through a living, layered, atmospheric city at night/dawn/dusk — not a generic endless-flyer background with city obstacles pasted onto it.**

The environment must communicate depth without compromising the readable flight corridor.

Expected completed visual stack:

1. **Sky field** — gradient, stars/moon or time-of-day equivalent; lowest motion priority.
2. **Distant city mass** — tiny skyline, soft window constellations, atmospheric haze; very slow parallax.
3. **Mid-city layer** — recognizable roof rhythm and sparse silhouettes; slow parallax.
4. **Near-city non-collision layer** — selective foreground roof details, wires, signs, water tanks, vents; controlled parallax.
5. **Gameplay layer** — current cloud/building hazards; highest contrast and never visually ambiguous.
6. **Owl layer** — remains immediately readable above all scenery.
7. **Atmospheric overlay** — sparse wind/rain/mist/star particles only when they improve place and motion without obscuring gameplay.

**Completion target:** OwlFly should look recognizable from a screenshot even if the UI and owl are temporarily hidden.

---

# 3. Design North Star

## Core sentence

**OwlFly is a cozy, slightly mysterious, mobile-first night-flight through a living layered city where atmosphere supports motion and discovery while hazards remain instantly readable.**

All future revisions in this design path must strengthen that sentence or be rejected/deferred.

## Non-negotiable identity rules

- Cozy City is the world anchor.
- Mystery is sparse, not noisy.
- Atmosphere must never impersonate a hazard.
- Background elements cannot compete with collision silhouettes.
- Motion should communicate depth before spectacle.
- Add authored repetition before random clutter.
- Preserve the owl and obstacle gameplay baseline unless a future mechanic receives its own independent 90+ design approval.
- Existing theme IDs/unlock logic stay stable during this pass; visual reinterpretation is safer than persistence-breaking renames.
- **Hazard art must not visually occupy large areas that gameplay deliberately treats as open.** If render and collision communicate different route widths, the rendering layer is guilty until proven otherwise.
- **Human readability can veto a green automated gate.** No phase is checkpointed solely because tests and eval pass.

---

# 4. The 90-Point Design Gate

Every proposed feature, revision, asset set, animation, mechanic, refactor, or visual effect is scored before inclusion.

## Weighted score

| Category | Weight | Question |
|---|---:|---|
| Identity coherence | 20 | Does this make OwlFly more recognizably OwlFly rather than a generic flyer? |
| Gameplay readability | 20 | Does the corridor/hazard/owl remain instantly legible? |
| Baseline preservation | 20 | Can this ship without destabilizing proven collision, physics, scoring, spawn behavior, or flow? |
| Architecture / maintainability | 15 | Does it fit existing layer ownership with minimal duplicated logic and safe build integration? |
| Future leverage | 15 | Does this create a reusable foundation for districts, weather, interiors, or future art rather than a dead-end effect? |
| Mobile / performance fit | 10 | Is the cost appropriate for a mobile-first Canvas game and reduced-motion mode? |
| **Total** | **100** | |

## Admission rule

A proposal must score **90 or higher**.

In addition, it is automatically rejected even with a high total if:

- Gameplay readability scores below 18/20.
- Baseline preservation scores below 18/20.
- Architecture / maintainability scores below 13/15.
- It changes collision/physics merely to compensate for visual clutter.
- It introduces a second source of truth for gameplay geometry.
- It requires large shared-file refactors before proving visual value.
- It cannot be tested, visually reviewed, or rolled back independently.
- It leaves a known route-signaling mismatch where visible hazard mass materially disagrees with lethal geometry.

---

# 5. Approved Design Route

## Phase A — Atmospheric City Foundation — **97/100 — APPROVED FIRST**

Purpose: replace the sense of a generic procedural backdrop with an authored layered city while leaving gameplay truth untouched.

Scope:

- establish city-specific environment palette and depth rules;
- add distant skyline layer;
- add mid-city silhouette layer;
- add restrained near-city non-collision detail layer;
- establish parallax speeds from far -> mid -> near;
- preserve current hazard and owl contrast;
- preserve reduced-motion behavior;
- add visual/readability tests where practical.

Why 97:
- enormous identity gain;
- low gameplay risk when kept in renderer/theme lanes;
- creates infrastructure used by every later approved route.

### A1 corrective clause
A1 is not considered checkpointed merely because the technical gate passes. The human-reported almost-unwinnable building/cloud presentation exposed a render-vs-collision honesty defect. The approved correction is a shared gap-aware building visual fit, scored 95/100, that scales only problematic tall/low-gap building presentations while keeping spawn-gap, physics, scoring, and Cozy City art unchanged.

## Phase B — Living City Detail System — **95/100 — APPROVED AFTER A**

Purpose: give the environment signs of occupancy and motion without creating new hazards.

Candidate details:

- small window-light patterns;
- rooftop antenna blink;
- water-tank silhouettes;
- sparse laundry/sign/vent movement;
- occasional distant aerial detail;
- tiny rooftop plant silhouettes;
- subtle light flicker with deterministic timing.

Rules:
- background-only;
- no fake collision cues;
- no rapid flashing;
- no full-screen particle load;
- visual density capped by corridor readability.

## Phase C — District Visual Language — **93/100 — APPROVED AFTER B**

Purpose: make distance traveled feel like movement through a world rather than a repeating obstacle stream.

First district set should remain within one coherent city:

- Cozy Residential;
- Old Rooftops;
- Downtown Glow;
- Industrial Edge;
- Storm Approach / Mist District.

Districts first differ through palette, skyline rhythm, window density, atmospheric treatment, and prop vocabulary — **not different physics**.

## Phase D — Theme Reconciliation — **94/100 — APPROVED, EXECUTED GRADUALLY**

Existing IDs and unlock requirements remain unchanged for persistence safety.

The visual presentation can be reinterpreted around the city:

- `night` -> Cozy Night City;
- `sunrise` -> Sunrise Rooftops;
- `dusk` -> Blue Dusk City;
- `haunted` -> Fogbound / Old Quarter treatment;
- `neon` -> Neon Downtown.

Display-name changes should occur only after verifying no tests/UI strings depend on them. IDs do not change in this pass.

## Phase E — Special / Enterable Buildings — **91/100 — APPROVED CONCEPT, DEFERRED**

This is the strongest future signature mechanic but is intentionally deferred until the exterior city language is stable.

Design rule:

- only rare, unmistakably marked buildings are enterable;
- entry must use a readable window/portal language;
- interiors preserve the same one-input flight grammar;
- floor/desk/lamp/shelf geometry becomes a local environment;
- exit is another readable window;
- not every building becomes enterable.

This feature gets a separate implementation contract before code because it crosses rendering, collision, state flow, asset loading, and level-transition boundaries.

## Phase F — Owl Environmental Reaction — **90/100 — APPROVED CONCEPT, DEFERRED**

Examples:

- scarf leans more strongly in visual gusts;
- lantern glow changes gently with fog/night;
- tiny near-miss reaction;
- rain/wind visual response.

No physics change is implied. This is character feedback, not a new control system.

## Candidate: Rare Over-Cloud Route — **UNSCORED IMPLEMENTATION / CAPTURED CONCEPT**

The owl may eventually be allowed to pass above selected floating cloud formations.

This is **not** part of the current A1 correction because an always-open over-cloud route would alter the established top-obstacle collision model.

For future admission it must score >=90 and meet these conditions:

- rare, selected formations rather than every cloud;
- pre-commit visual telegraphing that the cloud is floating rather than ceiling-like;
- route cannot conflict with screen/top boundary rules;
- no ambiguity about which clouds permit overflight;
- same input grammar as the normal run;
- independent fairness/eval coverage;
- rollback does not affect ordinary cloud obstacles.

Until that contract exists, top-cloud semantics remain unchanged.

---

# 6. Low-Value / Erroneous Routes

These routes are explicitly rejected unless new evidence changes their score above 90.

| Route | Score | Decision | Why it loses |
|---|---:|---|---|
| Full owl redesign now | 58 | REJECT | Current owl is readable; replacing it spends risk where the world is weaker. |
| New physics / flap model during atmosphere pass | 34 | REJECT | Destroys proven gameplay baseline for no environment benefit. |
| Every building enterable | 79 | REJECT | Removes rarity and multiplies state/asset/collision complexity. |
| Multiple unrelated biomes now | 68 | REJECT | Dilutes Cozy City before it develops a strong identity. |
| Gameplay-affecting wind/rain now | 73 | REJECT | Atmosphere should communicate place before becoming a difficulty modifier. |
| Dense procedural prop spam | 71 | REJECT | Adds clutter, non-authored repetition, and readability risk. |
| 3D / pseudo-3D overhaul | 62 | REJECT | High implementation risk for depth that 2D parallax can provide. |
| New currency/shop layer now | 54 | REJECT | Does not address the current world-design deficit. |
| Dynamic per-sprite lighting now | 83 | DEFER | Attractive but premature before environment hierarchy is stable. |
| More obstacle types now | 66 | REJECT | Adds content before the current city becomes coherent. |
| Widen gameplay gaps to compensate for misleading art | 22 | REJECT | Treats rendering error as a physics problem and damages the proven baseline. |
| Keep tall art and simply make the invisible collision more forgiving | 31 | REJECT | Increases render/collision dishonesty rather than fixing it. |
| Make every cloud freely overflyable now | 72 | REJECT FOR CURRENT PHASE | Changes top-obstacle semantics globally and makes ceiling/floating-cloud language ambiguous. |

---

# 7. Revision Decision Rule

Every revision or addition is first classified into one of these lanes:

1. **Presentation correction** — fixes misleading visual hierarchy without changing core gameplay truth.
2. **Environment addition** — background/world identity only; must remain non-collidable.
3. **Gameplay mechanic** — changes route choice, collision semantics, scoring, controls, or state flow; requires its own 90+ mechanic contract.
4. **Infrastructure/refactor** — allowed only when it removes a demonstrated source of drift or enables an already-approved phase.

The agreed design path decides the lane before implementation. A feature does not get reclassified after code exists merely to justify keeping it.

---

# 8. Self-Inflicted Fault Prevention Rules

- One branch per design phase or corrective lane.
- One source of truth for any geometry used by both rendering and collision.
- No duplicate magic constants across renderer/engine when the values must stay synchronized.
- Every new production source file must be added to both Node and PowerShell build manifests.
- Every new build dependency gets an ordering test.
- Deterministic visuals before random visuals.
- Visual density added one class at a time.
- Automated gates never waive human readability failures.
- Human feedback must identify the guilty layer before compensation occurs elsewhere.
- A passed checkpoint is not casually reopened.
- A failed >=90 proposal is revised or reverted before advancing.
- Gameplay baseline remains available as a clean rollback target.

---

# 9. A&R Operating Loop

## Analysis
For every material change:

- state the current noticed position;
- state the expected noticed position;
- identify the exact deficiency being solved;
- classify the change lane;
- score it before implementation;
- list low-value alternatives;
- map impacted files/systems;
- identify likely self-inflicted faults;
- define the smallest reviewable implementation;
- define rollback.

## Review
After implementation:

- build;
- run tests;
- run eval gate;
- inspect production runtime;
- perform human visual/playability review;
- compare against the pre-change position;
- rescore from observed evidence;
- checkpoint, revise, or revert.

No phase advances solely because implementation is complete.
