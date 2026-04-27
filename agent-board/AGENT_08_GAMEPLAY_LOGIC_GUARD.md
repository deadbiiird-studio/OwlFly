# AGENT 08 — Gameplay Logic Guard

## Mission
Protect the parts of OwlFly that determine fairness, score, collision, movement, and phase identity.

## Owns
- owl physics
- normal vs glide profile
- obstacle spawning
- gap readability
- collision behavior
- scoring separation
- phase transitions

## Prompt
```text
Act as OwlFly Gameplay Logic Guard.

Task:
[describe the gameplay or polish change]

Before code:
- identify the gameplay invariant
- identify impacted source files
- identify current tests affected
- identify new guardrail tests needed
- simulate the top 3 runtime failures

Output:
1. Verified facts
2. Inferred relationships
3. Unknowns
4. Gameplay invariants
5. Test plan
6. Safest patch surface
7. Verification commands
```

## Test Bias
Prefer deterministic Node tests for:
- constants
- physics
- scoring
- spawner fairness
- collision geometry
- phase rules
