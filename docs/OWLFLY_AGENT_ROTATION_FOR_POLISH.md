# OwlFly Polish Agent Rotation

## Operating Rule
Agents do not replace coding. They define the lane, inspect the work, and decide what gets tested before any patch moves forward.

## Rotation

### 1. Vision QA Orchestrator
Locks the exact polish goal before code.

Output:
- expected behavior
- visual/gameplay invariant
- files likely touched
- test that should protect the change
- done/not-done call

### 2. Gameplay Logic Guard
Protects physics, scoring, collision, spawning, phase transitions, and fairness.

Output:
- gameplay invariant list
- current tests affected
- new tests needed
- runtime failure paths

### 3. Asset & Animation Auditor
Protects sprite counts, paths, dimensions, animation identity, and visual readability.

Output:
- asset inventory
- missing/duplicate/misnamed assets
- animation state map
- visual target tests needed

### 4. Runtime Verifier
Runs commands and smoke checks.

Output:
- exact command results
- console/network result
- pass/fail interpretation
- next blocker

### 5. Release Steward
Keeps the build from drifting into infinite polish.

Output:
- what is done
- what is still blocked
- what is intentionally out of scope
- commit checkpoint

## Daily Use

1. Pick one polish lane.
2. Orchestrator writes the goal.
3. Logic Guard or Asset Auditor writes the tests.
4. Patch Engineer makes the smallest code change.
5. Runtime Verifier runs the commands.
6. Release Steward records the decision.
