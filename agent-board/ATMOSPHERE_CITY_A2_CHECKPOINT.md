# Atmosphere City A2 — Approved Checkpoint

## Status
APPROVED on `atmosphere-city-a2`.

Parent checkpoint: Atmosphere City A1 @ `1aee2abe8b9f0052a2bfc5da351605d9f3187a53`

## Final observed score
**98/100 — PASS**

A2 added readability instrumentation and rejection budgets without changing live runtime rendering or gameplay truth.

## Target-machine evidence
Chromebook/Linux verification completed with:

- `npm run quality` — PASS
- `npm run build` — PASS
- `npm run test` — **62/62 PASS**, 0 failures
- `npm run eval:gate` — PASS across 40 runs
- `npm run eval:visual` — PASS across 30 sampled environment states

Gameplay eval remained stable:

- score avg: `8.5`
- p50: `6`
- p90: `17`
- average survival: `13.009s`
- gapMin: `216`
- shiftP95Avg: `36.7`
- deaths: `36 top / 4 bottom`
- boundary deaths: `0`

Visual-readability gate observed:

- far: alpha `0.14`, speed `5.0`, visible coverage <= `0.741`, top >= `516.4`
- mid: alpha `0.20`, speed `11.0`, visible coverage <= `0.745`, top >= `551.1`
- near: alpha `0.25`, speed `20.0`, visible coverage <= `0.787`, top >= `600.4`
- all 30 sampled states remained inside the A2 readability budget

## Human visual gate
Final playtest verdict: **playing really well**.

This is accepted as a positive human runtime/readability result. No new visual confusion, gameplay degradation, or stutter was reported.

## What A2 now protects
Future atmosphere work must remain inside the committed readability policy for:

- scenery alpha;
- parallax speed and layer separation;
- scenery density and visible coverage;
- approved quiet roof vocabulary;
- protected upper flight field;
- reduced-motion parity.

A later visual feature does not receive approval merely because it looks good. It must also pass the A2 gate and preserve the A1 gameplay/readability checkpoint.

## Protected surfaces
Do not casually reopen:

- A1 city composition and gap-aware visual fit;
- collision profiles;
- owl physics;
- obstacle gaps/spawn cadence;
- scoring/difficulty;
- Cozy City PNGs.

Any change to those surfaces requires an independent >=90 review and an explicit checkpoint revision.

## Next approved phase
**A3 — authored distant-city character.**

A3 may add visible city identity only after a full impact map confirms the smallest safe renderer/theming surface. It must remain inside A2 budgets and cannot compensate for visual clutter by changing gameplay.
