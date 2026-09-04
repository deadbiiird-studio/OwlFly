# Atmosphere City A2 — Readability Instrumentation & Acceptance Tightening

## Status
IMPLEMENTED ON `atmosphere-city-a2` — awaiting target-machine verification.

Parent checkpoint: Atmosphere City A1 @ `1aee2abe8b9f0052a2bfc5da351605d9f3187a53`
A1 observed score: 96/100 — APPROVED

---

## Goal
Make future atmosphere changes prove that they remain readable before they are allowed to alter the live world.

A2 deliberately adds **measurement and rejection capability**, not more scenery.

The purpose is to prevent repeats of the A1 human-veto failure where a visually plausible addition could make the route look unfair even while gameplay geometry remained technically legal.

---

## Current Design Position Before A2
A1 is visually and mechanically approved:

- far / mid / near city depth exists;
- parallax is deterministic;
- reduced motion freezes the city layers;
- gap-aware building visual fit prevents tall towers from fake-closing the route;
- build, tests, eval gate, and human playtest all passed;
- gameplay truth remains protected.

Current noticed position:
> a cleaner, deeper Cozy City flight with believable building/cloud openings and stable gameplay.

The remaining risk is that future windows, haze, signs, rooftop props, weather, and district detail could slowly erode that readability unless the project has explicit budgets.

---

## Expected Position After A2
A2 should not materially change what the player sees.

The change is in what the project is capable of rejecting.

Expected engineering/design position:
> every future atmosphere proposal must fit inside measurable scenery-alpha, motion, density, roof-language, and flight-field budgets before human review even begins.

A2 converts “this seems visually safe” into a repeatable gate.

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

The policy intentionally does **not** participate in runtime rendering. It observes and rejects; it does not change gameplay or A1 visuals.

### `tooling/eval/visual-readability.mjs`
Samples the committed environment at multiple times, viewport widths, and reduced-motion states and fails if any state exceeds the readability policy.

Current sample matrix:

- viewport widths: 360, 480, 720;
- time samples: 0, 3.5, 11, 29, 61 seconds;
- normal motion and reduced motion.

That produces 30 sampled environment states per gate run.

### `tooling/eval/tests/quality.visual_readability_budget.test.mjs`
Regression tests prove both sides of the contract:

- the sealed A1 environment is expected to pass;
- alpha creep is rejected;
- scenery entering the protected flight field is rejected;
- parallax layers collapsing toward the same speed are rejected;
- the visual gate is wired into the repository quality command.

### `package.json`
Adds:

```bash
npm run eval:visual
```

and extends `npm run quality` to include the visual-readability gate after build, tests, and gameplay eval.

---

## A2 Design Gate — Preliminary Score

| Category | Weight | Score | Reason |
|---|---:|---:|---|
| Identity coherence | 20 | 18 | Does not add identity directly, but protects the visual language that future identity work depends on. |
| Gameplay readability | 20 | 20 | This phase exists specifically to enforce readability budgets before visual expansion. |
| Baseline preservation | 20 | 20 | Tooling-only instrumentation; no runtime behavior or sealed A1 rendering is changed. |
| Architecture / maintainability | 15 | 15 | Readability policy and audit are isolated, deterministic, and testable. |
| Future leverage | 15 | 15 | Every later atmosphere/detail phase can reuse the same gate and add new budgets. |
| Mobile / performance fit | 10 | 10 | No runtime cost; evaluation runs offline in tooling. |
| **Preliminary Total** | **100** | **98** | **ADMITTED FOR TARGET-MACHINE RETEST.** |

Hard vetoes:

- Readability >=18: PASS.
- Baseline preservation >=18: PASS.
- Architecture >=13: PASS.
- No gameplay compensation: PASS.
- No second gameplay geometry truth: PASS.
- Independently rollbackable: PASS.

---

## Erroneous / Low-Value Routes Rejected

### Add windows/lights immediately — 86/100 — REJECT FOR A2
Visually attractive, but skips the safety layer specifically requested after the A1 visual-fairness defect.

### Put readability clamps directly into runtime renderer — 83/100 — REJECT
Would silently alter visuals instead of failing unsafe proposals during development. A2 should reveal a bad change, not mask it.

### Screenshot-only manual review — 78/100 — REJECT AS SOLE GATE
Human review remains necessary, but screenshot-only acceptance does not catch deterministic density/motion regressions consistently across times and widths.

### Computer-vision screenshot scoring now — 84/100 — DEFER
Potentially useful later, but adds heavy dependencies and threshold ambiguity before simpler geometry-level budgets are exhausted.

### Generic “background complexity score” — 72/100 — REJECT
A single blended number can hide a hard failure. A2 keeps distinct vetoes for intrusion, alpha, speed, density, and roof language.

### Auto-widen gameplay gaps when scenery gets busy — 12/100 — REJECT
Directly violates the design contract. Visual mistakes are fixed in the visual layer, not compensated through gameplay.

---

## Self-Inflicted-Fault Controls

1. A2 lives on its own branch from the sealed A1 commit.
2. No runtime source file is modified by A2 instrumentation.
3. No physics, collision, scoring, spawn, difficulty, or asset file is touched.
4. Policy failure is explicit; unsafe changes do not get auto-normalized into hiding.
5. The gate samples multiple times and viewport widths to avoid one-frame/one-screen approval bias.
6. Reduced-motion is part of the same acceptance matrix.
7. Negative tests deliberately prove that the gate rejects known bad changes.
8. `npm run quality` now includes visual readability, reducing the chance that it is forgotten during later passes.
9. Human review remains a hard veto after automated approval.
10. Future additions must extend the policy rather than bypassing it.

---

## Verification Required
On the target machine after switching to `atmosphere-city-a2`:

```bash
npm run build
npm run test
npm run eval:gate
npm run eval:visual
```

Or run the combined command:

```bash
npm run quality
```

Expected result:

- existing build remains clean;
- all previous tests remain green;
- gameplay eval remains within the accepted A1 neighborhood;
- visual-readability gate passes all 30 sampled states;
- no runtime visual change should be noticeable from A2 itself.

Final disposition:

- >=90 and all gates pass: CHECKPOINT A2 and authorize authored city-detail work.
- 80–89: revise A2 instrumentation only.
- <80 or any hard veto: revert A2.

---

## Next Approved Work If A2 Passes
The next visible branch should be **Atmosphere City A3 — authored distant-city character**.

A3 may introduce restrained warm-window constellations and more authored skyline character, but only inside the A2 budgets and without modifying the sealed gameplay surfaces.
