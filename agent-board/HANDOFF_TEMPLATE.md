## Handoff
Completed:
- Added upper-screen trigger detection
- Added lower-screen return trigger
- Preserved existing score state

Touched files:
- web/game.js
- src/input/inputHandler.js

Needs review from:
- UI Agent: confirm overlay behavior during screen transition
- QA Agent: test repeated transitions and edge taps

Known risks:
- Transition timing may conflict with pause state
- Collision bounds may need recalibration in alternate zone