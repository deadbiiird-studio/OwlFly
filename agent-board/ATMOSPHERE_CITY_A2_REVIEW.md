# Atmosphere City A2 — Readability Instrumentation & Acceptance Tightening

## Status
**APPROVED on `atmosphere-city-a2` — 98/100.**

Parent checkpoint: Atmosphere City A1 @ `1aee2abe8b9f0052a2bfc5da351605d9f3187a53`

A1 observed score: **96/100 — APPROVED**

A2 target-machine verification and human visual review are complete. The approved checkpoint is recorded in `agent-board/ATMOSPHERE_CITY_A2_CHECKPOINT.md`.

---

## Goal
Make future OwlFly atmosphere changes prove that they remain readable before they are allowed to alter the live world.

A2 deliberately adds **measurement and rejection capability**, not more scenery. Its purpose is to prevent a repeat of the A1 human-veto failure where a visually plausible addition could make the route look unfair even while gameplay geometry remained technically legal.

---

## Design Position
A1 established the approved visual/mechanical baseline:

- deterministic far / mid / near city depth;
- ordered parallax;
- reduced-motion parity;
- gap-aware building visual fit;
- preserved gameplay truth.

A2 adds the policy and tooling needed to reject later atmosphere work that exceeds explicit readability budgets.

Expected engineering/design position after A2:

> every future atmosphere proposal must fit inside measurable scenery-alpha, motion, density, roof-language, and flight-field budgets before human review begins.

---

## A2 Implementation

### `tooling/eval/readability-policy.mjs`
Defines tooling-only readability limits for:

- protected upper flight field;
- allowed quiet roof vocabulary;
- per-layer maximum alpha;
- per-layer maximum parallax speed;
- minimum adjacent parallax-speed separation;
- total parallax motion budget;
- per-layer segment-count budget;
- visible horizontal scenery-density budget.

The policy observes and rejects unsafe states. It does not participate in runtime rendering or modify gameplay truth.

### `tooling/eval/visual-readability.mjs`
Samples the committed environment across:

- viewport widths: 360, 480, 720;
- time samples: 0, 3.5, 11, 29, 61 seconds;
- normal motion and reduced motion.

That produces 30 sampled environment states per gate run.

### `tooling/eval/tests/quality.visual_readability_budget.test.mjs`
Regression coverage proves that:

- the sealed A1 environment passes;
- alpha creep is rejected;
- scenery entering the protected flight field is rejected;
- collapsed parallax-speed separation is rejected;
- the visual gate remains wired into the repository quality command.

### `package.json`
Adds:

```bash
npm run eval:visual
```

and extends `npm run quality` to include the visual-readability gate after build, tests, and gameplay evaluation.

---

## Final Design Gate

| Category | Weight | Score | Reason |
|---|---:|---:|---|
| Identity coherence | 20 | 18 | Protects the visual language that later authored identity depends on. |
| Gameplay readability | 20 | 20 | Explicitly enforces readability budgets before visual expansion. |
| Baseline preservation | 20 | 20 | Tooling-only instrumentation; sealed A1 runtime behavior is unchanged. |
| Architecture / maintainability | 15 | 15 | Policy and audit are isolated, deterministic, and testable. |
| Future leverage | 15 | 15 | Later atmosphere phases can reuse and extend the same gate. |
| Mobile / performance fit | 10 | 10 | No runtime cost; evaluation runs offline in tooling. |
| **Final Total** | **100** | **98** | **APPROVED.** |

Hard vetoes:

- Readability >=18: PASS.
- Baseline preservation >=18: PASS.
- Architecture >=13: PASS.
- No gameplay compensation: PASS.
- No second gameplay geometry truth: PASS.
- Independently rollbackable: PASS.

---

## Target-Machine Verification
Chromebook/Linux verification completed successfully:

- `npm run quality` — **PASS**
- `npm run build` — **PASS**
- `npm run test` — **62/62 PASS**, 0 failures
- `npm run eval:gate` — **PASS** across 40 runs
- `npm run eval:visual` — **PASS** across 30 sampled environment states

Gameplay eval remained stable:

- score avg: `8.5`
- p50: `6`
- p90: `17`
- average survival: `13.009s`
- gapMin: `216`
- shiftP95Avg: `36.7`
- deaths: `36 top / 4 bottom`
- boundary deaths: `0`

Visual-readability worst observed values:

- far: alpha `0.14`, speed `5.0`, visible coverage <= `0.741`, top >= `516.4`
- mid: alpha `0.20`, speed `11.0`, visible coverage <= `0.745`, top >= `551.1`
- near: alpha `0.25`, speed `20.0`, visible coverage <= `0.787`, top >= `600.4`

All sampled states remained inside the A2 budgets.

## Human Visual Gate
Final production playtest verdict: **playing really well**.

No new visual confusion, gameplay degradation, or stutter was reported. The human veto is closed.

---

## Rejected Routes

- **Add windows/lights immediately — 86/100:** deferred because it would skip the requested safety layer.
- **Runtime readability clamps — 83/100:** rejected because unsafe proposals should fail rather than be silently normalized.
- **Screenshot-only review — 78/100:** insufficient as the sole gate across motion, time, and viewport states.
- **Computer-vision screenshot scoring — 84/100:** potentially useful later, but unnecessary before simpler deterministic budgets are exhausted.
- **Generic background-complexity score — 72/100:** rejected because a blended score can conceal hard failures.
- **Auto-widen gameplay gaps for busy scenery — 12/100:** rejected because visual mistakes must not be compensated through gameplay.

---

## Self-Inflicted-Fault Controls

1. A2 remains isolated from runtime rendering and gameplay source.
2. No physics, collision, scoring, spawn, difficulty, or asset file is modified by the instrumentation.
3. Policy failures are explicit; unsafe changes are not auto-normalized.
4. Multiple times and viewport widths avoid one-frame/one-screen approval bias.
5. Reduced-motion is part of the same acceptance matrix.
6. Negative tests prove known unsafe changes are rejected.
7. `npm run quality` includes visual readability so the gate is difficult to bypass accidentally.
8. Human review remains a hard veto after automated approval.
9. Future additions must extend the policy rather than bypass it.

---

## Protected Surfaces
Do not casually reopen:

- A1 city composition and gap-aware visual fit;
- collision profiles;
- owl physics;
- obstacle gaps/spawn cadence;
- scoring/difficulty;
- Cozy City PNGs.

Any change to those surfaces requires an independent >=90 review and explicit checkpoint revision.

---

## Final Disposition
**CHECKPOINT A2 APPROVED.**

The next authorized visible phase is **Atmosphere City A3 — authored distant-city character**. A3 may add restrained city identity only inside the A2 budgets and may not compensate for visual clutter by modifying gameplay.