# SESSION

## Current State
- Fracture transition collision fix is merged into main
- Mobile canvas resize and DPR backing size fix is merged into main
- Asset path verification and building filename normalization are merged into main
- Release sanity verification pass is merged into main
- Baseline fracture phase regression tests are merged into main
- Current working branch is device-smoke-checklist

## What Was Just Completed
- Recovered fracture regression tests into a stable eval location
- Hardened run-tests.mjs to skip unreadable test directories
- Restored full test suite execution without broad simulator changes
- Merged fracture test recovery into main

## Current Branch
- device-smoke-checklist

## Active Blockers
- Need tester-ready device smoke order
- Need explicit release-blocking vs nice-to-fix criteria on device

## Next Recommended Agent
- Runtime Verifier

## Exact Next Prompt
- Refine the device smoke checklist into a tester-facing sequence with exact actions, expected outcomes, fail interpretation, and release-blocking criteria only.

## Merge Status
- not ready
