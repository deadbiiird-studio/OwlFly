# OwlFly AGENTS.md

## Project identity
OwlFly is a mobile-first arcade game. Preserve its intended feel. Do not drift it into a generic clone through “helpful” rewrites.

## Mission
Restore expected function and move the project toward completion with the smallest viable change surface.

## Working mode
Function-first mode is always active unless the user explicitly asks for ideation, redesign, or expansion.

## Non-negotiables
1. Do not change design, styling, layout hierarchy, naming, branding, or architecture unless the current structure itself blocks expected function.
2. Do not suggest adjacent improvements, optional features, or polish work unless explicitly requested.
3. Prefer the smallest patch that restores expected behavior.
4. Never assume the repo state from memory when current files can differ.
5. Never provide an isolated fix without checking imports, exports, callers, entrypoints, assets, and config touched by the change.
6. If the issue can be solved without refactor, do not refactor.
7. Treat silent assumptions as defects.
8. If uncertainty remains critical, stop before code and say exactly what must be inspected next.

## Required response shape for engineering work
For all technical tasks, respond in this order:

### Goal
What expected behavior is being restored.

### Verified Facts
Only facts supported by the current files, logs, commands, or runtime evidence.

### Inferred Relationships
What is likely true based on evidence. Label inference confidence when useful.

### Unknowns
What cannot yet be verified.

### Signal
Use one of:
- NONE
- HALT.UNKNOWN
- HALT.CONFLICT
- HALT.IMPACT
- HALT.RUNTIME
- HALT.SCOPE
- HALT.AMBIGUOUS
- HALT.EDGE

### Recommended Play
Use one of:
- NONE
- PLAY: LOCK CONTEXT
- PLAY: MINIMUM PATCH
- PLAY: FULL SURFACE MAP
- PLAY: FAILURE SIMULATION
- PLAY: CONFLICT RESOLUTION
- PLAY: NO ASSUMPTION MODE

### Impacted Files
List every file likely touched directly or indirectly.

### Foreseeable Regressions
List likely breakpoints or side effects caused by the patch.

### Smallest Viable Patch
Provide the minimal change set only.

### Verification
Give exact commands, clicks, or runtime checks to prove behavior.

### Rollback
State how to revert cleanly if the patch fails.

## Signal registry

### HALT.UNKNOWN
Use when critical information is missing.
Examples:
- file not inspected
- runtime error not shown
- expected behavior unclear
- current implementation not visible

### HALT.CONFLICT
Use when the requested change conflicts with current logic, structure, or an existing implementation.

### HALT.IMPACT
Use when the change likely affects multiple files, entry points, or dependencies.

### HALT.RUNTIME
Use when the patch may compile but still fail while running.

### HALT.SCOPE
Use when the work is drifting beyond the requested assignment.

### HALT.AMBIGUOUS
Use when multiple plausible interpretations exist and choosing one would be unsafe.

### HALT.EDGE
Use when known model limitations make error probability meaningfully higher.

## Plays

### PLAY: LOCK CONTEXT
Use when:
- HALT.UNKNOWN
- HALT.AMBIGUOUS

Output:
- exact project
- exact files
- current behavior
- expected behavior
- exact error
- exact command result

Proceed only with verified information.

### PLAY: MINIMUM PATCH
Use when:
- HALT.SCOPE

Directive:
Restore function only.
Use the smallest possible change.
No redesign, no refactor, no adjacent improvements.

### PLAY: FULL SURFACE MAP
Use when:
- HALT.IMPACT

Before code, list:
- all impacted files
- imports/exports affected
- config or asset paths touched
- entry points involved
- likely regressions
- safest patch surface

Do not write code yet.

### PLAY: FAILURE SIMULATION
Use when:
- HALT.RUNTIME
- HALT.EDGE

Before code:
- list the top 3 ways the change could fail at runtime
- then propose the safest patch
- then provide exact verification steps

### PLAY: CONFLICT RESOLUTION
Use when:
- HALT.CONFLICT

Show:
- what currently exists
- what conflicts with the request
- the minimum viable resolution path
- what must not be touched

### PLAY: NO ASSUMPTION MODE
Use anytime hidden risk feels high.

Separate:
- verified facts
- inferred relationships
- unknowns

Proceed only on verified facts.

## OwlFly architecture boundaries

### Logic ≠ visual
Keep gameplay truth separate from rendering.

Gameplay truth belongs in:
- obstacle logic
- hitboxes
- gap spacing
- movement
- spawn pacing
- difficulty behavior

Visual interpretation belongs in:
- renderer sprite mapping
- animation frame cycling
- sprite scale and draw behavior
- visual skin swaps

Do not move gameplay truth into renderer or UI.

### Layer responsibilities
- App: bootstraps systems
- Core: constants, RNG, storage
- Engine: loop, physics, collision, difficulty
- Entities: owl + obstacle pair logic
- Systems: spawner + scoring
- Render: visual interpretation
- UI: overlays only

Do not collapse these layers unless function is blocked.

## File-lane discipline

### Shared high-risk files
These require extra caution:
- src/app/boot.js
- src/render/renderer.js
- shared config files
- entry HTML files
- manifest/service worker files

If a task touches one of these plus another system lane, emit HALT.IMPACT first.

### Lane ownership defaults
- Gameplay agent lane:
  - obstacle truth
  - spawner pacing
  - hitboxes
  - difficulty
- Render agent lane:
  - renderer mapping
  - sprite hookup
  - asset paths
  - frame mapping
- UI/runtime agent lane:
  - menu/HUD/game-over flow
  - overlay lifecycle
  - audio trigger behavior
  - startup/runtime issues
- Platform/QA lane:
  - build
  - tests
  - eval
  - Android/package verification
  - release readiness truth pass

## Current project priorities
Prioritize in this order:
1. startup stability
2. menu → game → game-over flow
3. duplicate UI elimination
4. audio one-shot correctness
5. asset/path reliability
6. Android fullscreen and icon correctness
7. obstacle fairness with current visuals
8. release readiness truth pass

## Patch discipline
- No unrelated cleanup.
- No stylistic rewrites.
- No renames unless reference proof is shown.
- No “while I’m here” changes.
- No speculative fixes across unseen files.
- If a shared primitive changes, check downstream callers first.

## Verification standards
When relevant, use these commands:

```bash
npm install
npm run dev
npm run build
npm run build:ps
npm run test
npm run eval
npm run repro