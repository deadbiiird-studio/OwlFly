# Atmosphere City A3 — Approved Checkpoint

## Status
**APPROVED — 98/100** on `atmosphere-city-a3`.

Parent checkpoint: Atmosphere City A2 merged to `main` @ `9ca36e7f28ff99e98f23b9031432368f2369228c`

## What A3 adds
A3 gives the distant city a recognizable authored rhythm without reopening gameplay truth. The far skyline now uses a frozen 12-beat motif for width, height, and approved roof type while keeping the existing renderer and A2 layer contract.

## Target-machine evidence
Verified from `atmosphere-city-a3` before approval:

- `npm run quality` — PASS
- `npm run build` — PASS
- `npm run test` — **67/67 PASS**, 0 failures
- `npm run eval:gate` — PASS across 40 runs
- `npm run eval:visual` — PASS across 30 sampled environment states

Gameplay remained stable:

- score avg: `8.5`
- p50: `6`
- p90: `17`
- average survival: `13.009s`
- gapMin: `216`
- shiftP95Avg: `36.7`
- deaths: `36 top / 4 bottom`
- boundary deaths: `0`

Visual-readability result:

- far: alpha `0.14`, speed `5.0`, visible coverage <= `0.759`, top >= `512.0`
- mid: alpha `0.20`, speed `11.0`, visible coverage <= `0.745`, top >= `551.1`
- near: alpha `0.25`, speed `20.0`, visible coverage <= `0.787`, top >= `600.4`
- all 30 sampled states remained inside A2 budgets

## Human visual gate
**PASS.**

Runtime verdict:

> “yes, this reads better and nothing got harder/confusing”

The distant skyline improved authored city character without introducing a false route cue, perceived corridor reduction, or gameplay confusion.

## Protected surfaces
Future atmosphere work must preserve:

- A1 city composition and gap-aware visual fit;
- A2 alpha, parallax, density, roof-vocabulary, flight-field, and reduced-motion budgets;
- A3 authored distant-city motif language;
- collision profiles;
- owl physics;
- obstacle gaps/spawn cadence;
- scoring/difficulty;
- Cozy City PNGs.

## Next approved phase
**Phase B — Living City Detail System.**

Add only sparse background occupancy/motion cues, one visual class at a time, with no fake collision cues and no gameplay compensation for visual clutter. Candidate classes include window-light patterns, rooftop antenna blink, water-tank silhouettes, restrained sign/vent movement, and occasional distant aerial detail.
