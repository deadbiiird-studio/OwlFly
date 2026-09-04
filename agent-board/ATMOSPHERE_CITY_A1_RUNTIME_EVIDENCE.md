# Atmosphere City A1 — Runtime Evidence

## Status
TECHNICAL GATE PASSED on the target Chromebook/Linux environment.

Human visual review is still required before A1 becomes a locked checkpoint and before A2 implementation begins.

Design contract: `agent-board/ATMOSPHERE_CITY_DESIGN_CONTRACT.md`
A1 review: `agent-board/ATMOSPHERE_CITY_A1_REVIEW.md`
Protected gameplay baseline: `collision-fidelity-pass` @ `3305fe6a60895f21ab4c6646695321accf31658f`
Working branch: `atmosphere-city-pass`

---

## Target-machine verification supplied by user

### Production build
`npm run build` — PASS

Observed result:
- `web/game.js` generated successfully;
- production `index.html` installed;
- no build error reported.

### Test suite
`npm run test` — PASS

Observed result:
- test files discovered: **14**;
- tests: **50**;
- pass: **50**;
- fail: **0**;
- cancelled: **0**;
- skipped: **0**;
- todo: **0**.

A1-specific protections confirmed passing:
- production bundle includes atmosphere geometry before `Renderer`;
- city depth contract orders far -> mid -> near;
- skyline generation is deterministic and bounded below the upper flight field;
- reduced-motion freezes parallax without changing geometry language;
- normal motion produces layered parallax;
- renderer composes city depth behind ground and hazards;
- Node and PowerShell build paths both load environment geometry before renderer.

Previously protected gameplay/collision tests also remained green.

### Eval gate
`npm run eval:gate` — PASS

Observed values:
- runs: **40**;
- bot: `humanish_lag`;
- score average: **7.575**;
- p50 score: **5**;
- p90 score: **17**;
- average survival: **11.944s**;
- minimum gap: **215**;
- shift P95 average: **35.175**;
- deaths: `top_obstacle=35`, `bottom_obstacle=5`;
- death contexts: `top_fair_hit=28`, `top_edge_brush=7`, `bottom_fair_hit=5`;
- boundary deaths: **0**.

All configured eval checks passed:
- median score smoke floor;
- average score smoke floor;
- average survival floor;
- gap-center readability;
- minimum-gap readability floor;
- boundary-death allowance;
- simulation failure allowance.

---

## Comparison against protected baseline

The A1 technical run preserves the exact previously observed eval headline values from the collision-fidelity checkpoint:
- average score remains 7.575;
- p50 remains 5;
- p90 remains 17;
- average survival remains 11.944s;
- gapMin remains 215;
- shiftP95Avg remains 35.175;
- death distribution remains 35 top / 5 bottom.

This is strong evidence that the atmosphere geometry implementation did not accidentally alter gameplay truth.

---

## Design Gate — Evidence Update

| Category | Weight | Current evidence | Status |
|---|---:|---|---|
| Identity coherence | 20 | Architecture for visible city depth is present; human visual confirmation pending. | PENDING HUMAN |
| Gameplay readability | 20 | Geometry tests keep scenery low/quiet and behind hazards; human perception still required. | TECH PASS / HUMAN PENDING |
| Baseline preservation | 20 | 50/50 tests + unchanged eval headline metrics. | PASS |
| Architecture / maintainability | 15 | Pure visual geometry module + build-order protections on both build paths. | PASS |
| Future leverage | 15 | Far/mid/near contract is reusable for later authored city detail. | PASS |
| Mobile / performance fit | 10 | Build/test/eval are clean on target machine; subjective stutter check still pending. | TECH PASS / HUMAN PENDING |

Preliminary design score remains **97/100**. It is not promoted to final checkpoint score until the human visual gate clears.

---

## Remaining Human Gate

A1 requires a short production playtest confirming:

1. far < mid < near depth is perceptible;
2. decorative skyline never reads as collidable;
3. owl/cloud/building hazards remain visually dominant;
4. no noticeable stutter was introduced;
5. gameplay feel remains unchanged or improved.

Recommended report format:

```text
DEPTH: better / same / worse
READABILITY: better / same / worse
MOTION: too weak / right / distracting
PERFORMANCE: clean / noticeable stutter
GAMEPLAY FEEL: better / same / worse
```

---

## Admission Decision

**Technical gate: PASS.**

**Checkpoint A1: PENDING HUMAN VISUAL GATE.**

No A2 implementation should begin until that final gate is answered, because the design contract explicitly treats readability and perception as hard requirements rather than optional polish.
