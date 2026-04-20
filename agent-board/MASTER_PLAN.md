# OwlFly Master Plan

## Current Goal
Get the game into a stable, shippable alpha.

## Priority Order
1. Gameplay feel
2. Screen correctness / fullscreen
3. UI flow stability
4. Asset loading stability
5. Test coverage
6. Release packaging

## Definition of Ready
- Menu → gameplay → game over works
- No broken assets in production
- Screen break mechanic functions intentionally
- Fair obstacle spawning passes baseline checks
- Build runs clean locally
- Android wrapper can package successfully

## Active Risks
- Asset path mismatches
- Shared logic import/export breakage
- Mobile viewport issues
- Manifest/icon problems
- Capacitor webDir mismatches