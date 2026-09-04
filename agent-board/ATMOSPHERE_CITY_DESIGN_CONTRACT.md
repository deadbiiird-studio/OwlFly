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

---

# 6. Low-Value / Erroneous Routes

These routes are explicitly rejected unless new evidence changes their score above 90.

| Route | Score | Decision | Why it loses |
|---|---:|---|---|
| Full owl redesign now | 58 | REJECT | Current owl is readable; replacing it spends risk where the world is weaker. |
| New physics / flap model during atmosphere pass | 34 | REJECT | Destroys proven gameplay baseline for no environment benefit. |
| Make every building enterable | 79 | REJECT | Removes rarity, multiplies state/collision complexity, weakens exterior pacing. |
| Multiple unrelated biomes immediately | 68 | REJECT | Dilutes Cozy City identity before one world is complete. |
| Heavy random prop generation | 71 | REJECT | Creates clutter, inconsistent screenshots, harder testing, low authorship. |
| Gameplay-changing rain/wind now | 73 | REJECT | Turns atmosphere into difficulty before visual language is proven. |
| Dense rain/fog covering hazards | 49 | REJECT | Direct readability failure. |
| 3D/pseudo-3D renderer overhaul | 62 | REJECT | High architecture/performance cost; current Canvas layering can achieve needed depth. |
| Dynamic light/shadow simulation per sprite | 83 | DEFER | Attractive but poor cost/value before basic atmosphere hierarchy is complete. |
| New currency/shop/meta layer | 54 | REJECT | Does not solve current world-identity problem. |
| Large renderer rewrite before visual prototype | 57 | REJECT | Refactor risk without evidence that current structure blocks the target. |
| Dozens of new obstacle types | 66 | REJECT | More content before environmental coherence; increases fairness/test surface. |
| Random collectibles added for visual interest | 76 | REJECT | Adds gameplay noise instead of improving the world layer. |
| Expanding fracture/glide spectacle during this pass | 65 | DEFER | Different design lane; risks competing with the environment work. |

Rejected does not mean "never." It means "not justified by the current design contract."

---

# 7. Fault-Minimization Plan

The pass must actively reduce self-inflicted defects.

## 7.1 Branch isolation

- `collision-fidelity-pass` remains the protected known-good gameplay baseline.
- `atmosphere-city-pass` carries environment work.
- No experimental visual branch gets merged into the baseline simply because it looks promising.

## 7.2 One-lane commits

Prefer commits that affect one concern:

- environment architecture;
- visual asset hookup;
- theme data;
- tests;
- build manifest.

Do not mix gameplay tuning with atmosphere commits.

## 7.3 Gameplay truth stays outside visual interpretation

The atmosphere system cannot write:

- obstacle gap;
- obstacle speed;
- collision geometry;
- owl velocity;
- score;
- spawn pacing.

If a visual addition seems to require gameplay changes to remain fair, first simplify the visual addition.

## 7.4 Build-path parity

Any new source module required by the classic production bundle must be represented in:

- Node build path;
- PowerShell build path;
- production-bundle regression test.

This directly prevents a repeat of the collision-profile bundle omission that was caught in the previous pass.

## 7.5 Asset path discipline

Every new environment asset must have:

- one canonical repo path;
- preload/fallback behavior when required;
- production request verification;
- no duplicate renamed copies unless technically necessary.

## 7.6 Deterministic visuals

Ambient variation should be derived from stable seeds, fixed layer definitions, or time-based motion rather than uncontrolled random regeneration every frame.

Benefits:

- reproducible screenshots;
- stable testing;
- fewer "why did that look different?" bugs;
- easier performance diagnosis.

## 7.7 Readability ownership

Foreground gameplay objects own:

- strongest silhouette contrast;
- sharpest edges;
- highest local salience.

Background owns:

- softer contrast;
- slower motion;
- lower detail density;
- atmospheric color.

No decorative skyline roof edge may look more dangerous than a real building obstacle.

## 7.8 Reduced-motion parity

Atmospheric motion must gracefully simplify or freeze when reduced-motion is active. No feature is accepted if disabling its motion destroys the entire scene.

## 7.9 Regression gates after every meaningful slice

Minimum:

```bash
npm run build
npm run test
npm run eval:gate
```

Runtime:

- load production `web/` build;
- confirm all new assets return 200;
- inspect console/network errors;
- play deliberate near-misses;
- compare readability against the locked baseline.

## 7.10 Rollback before expansion

Each phase must produce a named checkpoint before the next phase begins.

No Phase B implementation begins while Phase A is visually unresolved.

---

# 8. Phase A Implementation Map

## Slice A1 — Environment geometry contract

Define pure layer specifications before drawing more detail:

- depth index;
- parallax speed;
- base vertical band;
- opacity range;
- silhouette/detail density;
- theme color source.

Target layers:

- far skyline;
- mid skyline;
- near non-collision city.

No assets required to prove this slice; simple deterministic Canvas silhouettes are acceptable as structural placeholders.

## Slice A2 — Corridor contrast contract

Add tests/helpers that make the environment hierarchy explicit where feasible.

Acceptance:

- obstacle rendering still uses current foreground sprite path;
- atmosphere does not alter `getRects()`, sprite collision bands, owl physics, scoring, or spawn logic;
- reduced-motion mode still renders a coherent static scene.

## Slice A3 — Far skyline

Build a low-contrast distant skyline with:

- small building rhythm;
- occasional tower/spire;
- sparse window constellations;
- atmospheric haze;
- slow parallax.

Avoid individual foreground-like building sprites here.

## Slice A4 — Mid skyline

Add a second city band with:

- more readable roof rhythm;
- still no collision implication;
- modest window grouping;
- enough difference from far skyline to create clear depth.

## Slice A5 — Near non-collision details

Use restraint:

- utility wires;
- rooftop props;
- signs;
- water tanks;
- vents;
- rare moving lights.

This layer receives the strictest readability review because it sits closest to gameplay hazards.

## Slice A6 — First atmosphere state

One state only.

Preferred first state: **gentle wind / drifting haze**, because it communicates flight without visually covering the corridor.

Rain is deferred until the hierarchy is proven.

## Slice A7 — Theme reconciliation prototype

Apply the city layers to `night` first.

Only after night passes visual review should the same layer architecture receive sunrise/dusk/fog/neon palette interpretations.

---

# 9. Acceptance Score for Phase A

Phase A itself is not complete unless the resulting build scores at least 90/100 in review.

## Completion review rubric

| Review measure | Weight |
|---|---:|
| Screenshot has a unique OwlFly city identity | 20 |
| Flight corridor is readable immediately | 20 |
| Hazard silhouettes dominate decorative silhouettes | 15 |
| Parallax creates obvious depth without distraction | 15 |
| Existing gameplay/eval baseline remains healthy | 15 |
| Mobile/reduced-motion behavior remains coherent | 10 |
| Architecture is reusable by later districts | 5 |
| **Total** | **100** |

Hard fail:

- any gameplay regression attributable to atmosphere;
- new production asset 404s;
- visual layer mistaken for a collision hazard during playtest;
- test/eval regression left unexplained;
- feature implemented outside the design contract without a new 90+ score.

---

# 10. A&R Loop — Standing Analysis and Review Process

Every meaningful addition gets a mini A&R before being accepted.

## Analysis

1. What design problem is this solving?
2. Which approved phase does it serve?
3. What existing layer/files does it touch?
4. What could regress?
5. Is there a smaller implementation?
6. Does it duplicate an existing primitive?
7. What evidence will prove value?
8. Preliminary Design Gate score.

## Review

1. Build/test/eval evidence.
2. Production-runtime evidence.
3. Visual readability evidence.
4. Performance/reduced-motion sanity.
5. Final Design Gate score.
6. Keep / revise / reject.
7. Rollback point recorded.

A revision does not get grandfathered in because an earlier version was approved. Material revisions are rescored.

---

# 11. Decision Authority for Future Revisions

When a new idea appears, use this order:

1. **North Star:** Does it strengthen the living layered Cozy City flight identity?
2. **Phase fit:** Is it needed in the current phase?
3. **Readability:** Can it exist without weakening hazard/owl clarity?
4. **Baseline:** Can gameplay truth remain unchanged?
5. **Architecture:** Can it fit existing lanes without duplicate truth/refactor sprawl?
6. **Future leverage:** Does it help later approved phases?
7. **Score:** Does it achieve >= 90/100 with no veto failure?
8. **Evidence:** Is there a test/playtest/visual review that can prove success?

If the answer fails at any required step, the idea is deferred or rejected.

---

# 12. Definition of Done for the Atmosphere City Pass

The branch is complete only when all of the following are true:

- Phase A city layering exists and reads clearly on a mobile viewport.
- The scene has at least three distinct non-gameplay depth layers.
- Parallax hierarchy is obvious but subordinate to gameplay.
- One restrained atmosphere state is integrated.
- Existing theme IDs and unlocks remain compatible.
- Night city is coherent; other theme palettes may be reconciled only after the same architecture proves reusable.
- Collision, physics, spawn pacing, score logic, and current Cozy City obstacle artwork remain intact.
- Production build contains all new source dependencies.
- Required build/test/eval gates pass.
- No required asset requests 404.
- Reduced-motion mode remains coherent.
- Human playtest confirms obstacle/flight readability is not worse than the collision-fidelity baseline.
- Final design review score is >= 90/100.

**Expected noticed position after completion:**
> OwlFly no longer looks like an endless flyer that happens to use city buildings. It looks like a deliberately authored flight through a living atmospheric city, with enough structural depth to support future districts and rare enterable buildings without redesigning the foundation again.
