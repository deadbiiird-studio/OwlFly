
`ARCHITECTURE.md`
```markdown
# OwlFly Architecture

## Layers

- App → bootstraps systems (`src/app/boot.js`)
- Core → constants, RNG, storage
- Engine → loop, physics, collision, difficulty
- Entities → owl + obstacle pair (logic only)
- Systems → spawner + scoring
- Render → visual interpretation (sprites)
- UI → overlays (menu, HUD, game over)

---

## Key Concept (IMPORTANT)

### Logic ≠ Visual

Obstacle system is split into:

- Logic layer:
  - `cactusPair.js`
  - defines hitboxes, gaps, movement

- Visual layer:
  - `renderer.js`
  - maps:
    - top rect → cloud sprites
    - bottom rect → tornado sprites

This allows:
- visual swaps without breaking gameplay
- rapid iteration on art direction
- future obstacle types without rewriting physics

---

## Data Flow

Input  
→ Owl physics  
→ Spawner creates obstacle pairs  
→ Collision checks  
→ Scoring updates  
→ Renderer draws sprites  
→ UI updates

---

## Performance

- Object pooling for obstacles
- Fixed timestep loop
- Minimal allocations per frame
- Sprite animation via frame cycling (time-based)

---

## Current Evolution

- Transition from primitive shapes → sprite rendering
- Preparing for expanded world mechanics (vertical break / multi-screen)

---

## Practical Architectural Rule

Keep these responsibilities separate:

- `cactusPair.js`
  - obstacle truth
  - pair spacing
  - hitbox structure
  - movement across the world

- `spawner.js`
  - pacing
  - spawn timing
  - difficulty-driven pattern output

- `renderer.js`
  - visual skinning
  - animation frame cycling
  - mapping obstacle rectangles into cloud and tornado art

- UI modules
  - overlays only
  - score presentation
  - menu/game-over interaction
  - no gameplay truth embedded into the overlay layer

---

## Why this matters now

OwlFly is no longer just a baseline endless flyer with generic obstacle representation.

The current build direction depends on:
- preserving existing obstacle fairness
- changing the visual identity without destabilizing gameplay
- improving mobile presentation
- preparing for later standout mechanics beyond clone-like play

That means the architecture must support:
- stable internal testing
- fast art iteration
- future world expansion
- later mechanic additions without rewrite pressure