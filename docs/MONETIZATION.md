# Monetization (safe baseline)

## Product principle

Monetization should attach to:
- recovery
- expression
- convenience

It should not damage:
- concentration
- fairness
- first-session trust

## Recommended rollout

### V1
- No monetization, or only placeholder scaffolding
- Protect gameplay trust during internal testing and early stabilization

### V1.1
- Rewarded continue after a crash
- Limit: 1 continue per run

### V1.2
- Cosmetic content
  - owl color variants
  - sky themes
  - cloud/tornado visual packs
  - future cosmetic identity sets

### V1.3
- Interstitial after game over every N runs
- Only after stable retention and clean gameplay flow
- Never interrupt active play

## Recommended baseline

- Rewarded ad to continue after a crash (1 per run)
- Interstitial after game over every N runs
- Cosmetic skins and themes
- Remove-ads purchase

## Implementation approach

- Keep ad calls behind a thin service interface
- In web build, provide stub / no-op implementations
- In Capacitor build, replace with platform plugin integration
- Do not hardwire ad SDK calls into core gameplay logic

## Current caution

Because OwlFly is still in internal testing and still resolving:
- fullscreen fit
- HUD anchoring
- visual identity transition
- sprite integration stability

monetization should remain secondary until runtime polish is dependable.