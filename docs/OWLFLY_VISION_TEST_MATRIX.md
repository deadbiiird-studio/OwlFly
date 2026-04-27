# OwlFly Vision Test Matrix

## Purpose
These tests keep OwlFly aligned with the actual vision:

- owl movement should feel readable and responsive
- glide should feel like a distinct glide, not normal flapping with a costume
- buildings should stay bottom-anchored and large enough to read
- clouds should remain top hazards with readable clearance
- rewards/rings should read as fly-through objects
- assets should load from stable paths
- scoring should not blur normal obstacle passes and glide rewards

## Test Tiers

### Tier 1 — Guardrail Tests
Path: `tooling/eval/tests/*.test.mjs`

Run with:

```powershell
npm run test
```

These are meant to stay green during normal development.

### Tier 2 — Vision Target Tests
Path: `tooling/vision-targets/*.test.mjs`

Run with:

```powershell
node --test tooling/vision-targets/*.test.mjs
```

These are allowed to fail while the polish work is still incomplete. They describe the target shape of the game.

## Coverage Map

| Area | Guardrail | Vision Target |
|---|---|---|
| Owl normal animation | 3 normal frames exist | separate glide frames exist |
| Clouds | 6 cloud sprites exist | larger/readable cloud tuning should be added later |
| Buildings | 13 building slots exist | San Antonio skyline identity can be inspected manually |
| Obstacles | bottom hitboxes and render hints stay anchored | final scale targets can be added after constants settle |
| Glide | reduced gravity/jump profile exists | glide-only wings-back frames exist |
| Rewards | reward/ring art source exists | reward ring reads larger than owl |
| Scoring | obstacle combo and reward scoring remain separate | long-run eval can measure reward density later |

## Rule
When a polish change breaks a guardrail test, stop and fix the regression before continuing visual tuning.
When a target test fails, use it as the next polish assignment, not as a panic signal.
