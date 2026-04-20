# OwlFly Device Smoke Checklist

## Smoke Objective
Verify core game loop, state transitions, asset delivery, audio behavior, and fullscreen fit on physical device before release candidate approval.

---

## Test Environment Setup

### Required
- Physical device (Android phone/tablet or iOS device, 6" to 10" screen)
- Browser DevTools available (for console error inspection)
- Latest build deployed to device
- Test duration: ~15 minutes
- Fresh start (clear browser cache, or first install)

### Device Readiness
- Charge to >50%
- Volume audible (not muted at OS level)
- Screen brightness at default
- Orientation: Portrait, unless specified

---

## Exact Test Order

### Phase 1: Install & Launch (2 min)

#### TEST 1.1 — App Launch
**Action**: Open OwlFly from home screen or tap web link.
**Expected**: 
- Page loads within 3 seconds
- Canvas fills entire viewport
- No white/blank screen hangs
- Menu appears with "Sacred Portal" title, "OwlFly" heading, "Start Flight" button visible
- Score stats visible (Best, Runs, Flaps)

**Fail If**: 
- Blank screen >5 seconds
- Canvas doesn't fill screen
- Menu elements missing or cut off
- Any console error messages (check DevTools → Console)

**Release Blocker**: YES (startup crash or blank screen)

---

#### TEST 1.2 — Sprite & Asset Load
**Action**: Observe menu. Open DevTools Console.
**Expected**: 
- No error messages in console
- Menu renders with no broken images or missing text
- Controls (buttons, toggles, theme selector) visible and clickable
- If any warnings like "sprite X missing", they are logged as `console.warn`, not errors

**Fail If**: 
- Red console errors
- Menu text garbled or overlapped
- Buttons unresponsive or invisible
- 404 errors for audio or image files

**Release Blocker**: YES (broken assets = unplayable)

---

#### TEST 1.3 — Viewport & Fullscreen Fit
**Action**: Rotate device to landscape, then back to portrait.
**Expected**: 
- Canvas resizes smoothly on each rotation
- Canvas fills entire viewport (no letterbox, no black bars)
- UI elements (menu buttons, score display) reflow correctly
- No scroll bars appear
- No edges cut off on notched devices (iPhone X+, Android with notch)

**Fail If**: 
- Canvas doesn't rotate
- Black bars or gaps around canvas
- Buttons move off-screen
- Scroll appears where it shouldn't
- Notch causes element cutoff

**Release Blocker**: YES on notched device (UI unusable), otherwise NICE-TO-FIX (playable but jarring)

---

### Phase 2: Menu & Settings (3 min)

#### TEST 2.1 — Menu Display & Best Score
**Action**: Look at menu. Note displayed "Best" score.
**Expected**: 
- Best score displayed (should be 0 on fresh install, or saved value on repeat device)
- Runs and Flaps stats visible and accurate
- Menu theme is "night" (dark blue background)
- All buttons clickable and responsive to tap

**Fail If**: 
- Best score shows garbage or negative value
- Stats missing
- Menu unresponsive to taps

**Release Blocker**: NO (aesthetic, stats are stored correctly)

---

#### TEST 2.2 — Audio Controls
**Action**: Tap the mute button (🔊 or 🔇) in menu details section.
**Expected**: 
- Button toggles between 🔊 (unmuted) and 🔇 (muted)
- Toggle state persists if you restart: exit and relaunch app
- Music either plays or stops (audio cue, not just UI change)
- Reduced Motion button (✨ or 🐢) also toggles without crash

**Fail If**: 
- Button doesn't toggle visually
- Setting doesn't persist across restart
- Mute doesn't actually silence game audio
- Toggle crashes or causes console error

**Release Blocker**: YES (audio broken = confusing to user)

---

#### TEST 2.3 — Theme Selection
**Action**: If multiple themes are available in menu, click a different theme.
**Expected**: 
- Menu background color changes
- No crash or flash
- Theme name displayed as unlocked or locked with unlock condition
- If locked, shows reason (e.g., "keep playing")
- Selecting again goes back to that theme

**Fail If**: 
- Theme doesn't change or crashes
- Locked theme opens without unlock
- Menu disappears or freezes

**Release Blocker**: NO (secondary feature, doesn't block play)

---

### Phase 3: Game Flow (5 min)

#### TEST 3.1 — Start Game
**Action**: Tap "Start Flight" button.
**Expected**: 
- Menu disappears immediately
- HUD appears with "Score 0" label
- Toast message shows "🦉 Fly clean. Break through."
- Canvas shows game scene (ground, sky, owl at bottom-center)
- Owl is clearly visible and centered
- No stutter or lag on start

**Fail If**: 
- Menu stays visible
- HUD doesn't appear
- Owl or obstacles invisible
- Game crashes to menu

**Release Blocker**: YES (game won't start = unplayable)

---

#### TEST 3.2 — Input & Owl Movement
**Action**: Tap/click anywhere on canvas once to flap.
**Expected**: 
- Owl visibly moves up immediately on tap
- Owl animates sprite frames (wing flap visible)
- Sound plays once per tap (flap sound)
- Owl gradually falls due to gravity if no more taps
- Owl stays within bounds (doesn't fly off top or sink below ground)

**Fail If**: 
- Owl doesn't respond to tap
- Owl moves but no sound plays
- Owl glitches through bounds
- Flap sound plays multiple times per single tap

**Release Blocker**: YES (input = core game mechanic)

---

#### TEST 3.3 — Obstacles & Collision
**Action**: Continue playing without flapping; let owl hit an obstacle.
**Expected**: 
- Obstacles (clouds on top, buildings on bottom) spawn and move left
- Obstacles move at steady pace without stutter
- When owl collides, screen goes to "SKY FRACTURED" / "Flight Ended" panel
- Score snapshot shown
- No crash or blank screen

**Fail If**: 
- Obstacles don't spawn
- Obstacles glitch through bounds
- Collision doesn't trigger game-over
- Game-over screen shows garbage or is unreadable

**Release Blocker**: YES (collision broken = unfair)

---

#### TEST 3.4 — Scoring
**Action**: Play carefully and pass 2–3 obstacles without hitting them.
**Expected**: 
- Score increments by 1 for each safe pass
- HUD score updates visibly
- A "score" sound plays once per pass (not multiple times)
- Score displayed in final game-over screen matches run total

**Fail If**: 
- Score doesn't increment
- Score sound plays multiple times per pass
- HUD doesn't update in real-time
- Final score doesn't match

**Release Blocker**: YES (scoring broken = no sense of progress)

---

### Phase 4: Fracture, Glide & Reentry (4 min)

#### TEST 4.1 — Fracture Trigger (After 6 Safe Passes)
**Action**: Play safe and let the game auto-trigger fracture (after 6 obstacle passes).
**Expected**: 
- Toast shows "⚡ Fracture opening"
- Screen visual transitions (overlay or effect appears)
- Obstacles pause or disappear temporarily
- After ~1 second, screen transitions to glide mode

**Fail If**: 
- No fracture trigger after 6+ passes
- Fracture toast never appears
- Visual doesn't change or crashes
- Game freezes during transition

**Release Blocker**: YES (fracture is core feature)

---

#### TEST 4.2 — Glide Mode
**Action**: During glide phase (after fracture transition).
**Expected**: 
- Owl sprite changes (if glide frames exist) or remains visible
- Toast shows "✨ Glide mode — collect the line"
- Reward objects (shards) spawn from right and move left
- Owl responds to taps but moves slower / falls slower
- Rewards have clear visual contrast
- Tapping still produces sound (though may be different)

**Fail If**: 
- Rewards don't spawn
- Owl unresponsive or crashes during glide
- Rewards invisible (missing asset)
- No visual indication of glide mode

**Release Blocker**: YES (glide is required phase)

---

#### TEST 4.3 — Reward Collection & Score
**Action**: During glide, tap to collect 2–3 reward objects.
**Expected**: 
- Reward disappears when owl touches it
- Score increments (shows visible jump, e.g., 6 → 9 for 3 rewards)
- Reward sound plays once per collection (not overlapping)
- HUD score updates in real-time

**Fail If**: 
- Rewards don't collide
- Score doesn't increment
- Multiple sounds per reward
- HUD doesn't reflect reward points

**Release Blocker**: YES (glide scoring broken = no incentive)

---

#### TEST 4.4 — Reentry Phase
**Action**: Let glide timer expire (watch for reentry to auto-trigger).
**Expected**: 
- Toast shows "🌀 Reentry"
- Visual transitions back (fracture overlay reduces)
- Obstacles reappear at increased difficulty
- Owl briefly invulnerable (can clip through top obstacle, then recovers)
- After ~0.5 second, invulnerability ends and collision becomes active again
- Gameplay returns to normal (passes increment fracture counter again)

**Fail If**: 
- Reentry doesn't trigger after glide ends
- No visual feedback
- Invulnerability not applied (hits obstacle immediately and dies)
- Obstacles don't respawn or spawn incorrectly

**Release Blocker**: YES (reentry crash breaks fracture loop)

---

#### TEST 4.5 — Full Fracture Cycle (Optional Extended Test)
**Action**: If time permits, trigger fracture 2–3 more times and complete a full multi-cycle run.
**Expected**: 
- Each cycle (normal → fracture → glide → reentry → normal) completes cleanly
- Difficulty increases slightly each cycle (obstacles spawn faster, gaps tighter)
- Score accumulates correctly across all phases
- No desync between visual and gameplay state
- Run ends on collision and displays final score

**Fail If**: 
- Cycle breaks mid-way
- Score resets unexpectedly
- Visual/gameplay desync (owl collision position vs. visual position)
- Game hangs or crashes mid-run

**Release Blocker**: NICE-TO-FIX if only 1 cycle works (playable), YES if all cycles fail

---

### Phase 5: Game Over & Restart Flow (2 min)

#### TEST 5.1 — Game Over Screen
**Action**: Let owl crash or complete a run (from previous tests).
**Expected**: 
- "SKY FRACTURED" panel appears centered on screen
- "Flight Ended" or "New Best Flight" heading shown (depending on score)
- Final score displayed clearly and accurately
- Best score displayed for comparison
- No duplicate UI elements (menu and game-over should not both be visible)
- Buttons: "Restart Flight" and "Back to Menu" visible and clickable

**Fail If**: 
- Game over screen missing or black
- Score shows wrong value or is unreadable
- Buttons missing or unclickable
- Menu and game-over both showing (duplicate UI bug)

**Release Blocker**: YES (game-over broken = can't replay)

---

#### TEST 5.2 — Restart Flow
**Action**: Tap "Restart Flight" button on game-over screen.
**Expected**: 
- Game-over screen disappears
- HUD reappears with "Score 0"
- Game resets (owl at start position, spawner cleared)
- New run can begin immediately
- Old score retained in "Best" display after this run ends

**Fail If**: 
- Game doesn't reset
- Score carries over from previous run
- HUD missing or unresponsive
- Game crashes

**Release Blocker**: YES (restart broken = can't play again)

---

#### TEST 5.3 — Menu Return
**Action**: Tap "Back to Menu" button on game-over screen.
**Expected**: 
- Game-over screen closes
- Menu reappears with correct best score
- HUD is hidden
- Music continues or restarts appropriately
- Menu is fully interactive (can start new game or adjust settings)

**Fail If**: 
- Menu doesn't appear
- Best score is wrong
- Menu is unresponsive
- Game-over screen lingers in background

**Release Blocker**: YES (menu broken = navigation stuck)

---

### Phase 6: Audio Sanity (1 min)

#### TEST 6.1 — One-Shot Compliance
**Action**: During a single game run, hit obstacles or trigger events rapidly.
**Expected**: 
- Jump sounds play once per flap (no echo or repeated plays)
- Score/pass sounds play once per pass (even if rapid)
- Hit/crash sound plays exactly once when collision occurs
- No overlapping sounds (audio doesn't pile up or distort)
- If muted, no sounds play

**Fail If**: 
- Sounds repeat or echo
- "Hit" sound plays multiple times on single crash
- Audio cuts out mid-play
- Mute toggle doesn't prevent audio

**Release Blocker**: YES (audio bugs = immersion broken, release-facing issue)

---

#### TEST 6.2 — Music Continuity
**Action**: Start game, play for 10+ seconds, transition to game-over, then back to menu.
**Expected**: 
- Music plays smoothly during game (background audio, not obtrusive)
- Music doesn't stutter or restart repeatedly
- If music is toggled off in menu, it stops and stays stopped
- If toggled on, it resumes without loud spike
- No audio context errors in console

**Fail If**: 
- Music never plays
- Music constantly restarts
- Music plays at wrong volume
- Toggle doesn't control music

**Release Blocker**: NICE-TO-FIX (secondary feature, doesn't block play)

---

### Phase 7: Path & Asset Verification (1 min)

#### TEST 7.1 — Console Inspection
**Action**: Complete the above tests, then open DevTools → Console tab.
**Expected**: 
- No red error messages
- Allowed: `console.warn()` for missing optional sprites (e.g., "Cloud sprite 5 missing")
- Allowed: Service worker registration messages (if not local dev)
- Allowed: "Failed to register service worker" on localhost (expected)
- No `404 Not Found` messages for critical assets (owl, obstacles, audio)

**Fail If**: 
- Any red error (e.g., `Uncaught TypeError`, `Uncaught ReferenceError`)
- 404 errors for core sprites or audio files
- Repeated error messages spamming console

**Release Blocker**: YES if errors relate to core assets or runtime

---

### Phase 8: Android-Specific (If Testing on Android) (1 min)

#### TEST 8.1 — Fullscreen & Navigation
**Action**: Open app on Android device.
**Expected**: 
- App runs fullscreen (no system nav bar visible, or immersive mode applied)
- App icon on home screen appears correctly (512x512 PNG, not blurry)
- Back button (if tapped) exits to menu or home, doesn't crash
- Orientation lock doesn't prevent portrait/landscape switch (if device supports both)

**Fail If**: 
- System nav bar visible and overlaps canvas
- App icon is generic or broken
- Back button crashes or freezes game
- Canvas gets stuck in one orientation

**Release Blocker**: YES on production release (fullscreen is required UX)

---

### Phase 9: Android Build Verification (If Just Built) (2 min)

#### TEST 9.1 — APK Installation
**Action**: If freshly built from `npm run build:ps`, verify APK transferred and installed.
**Expected**: 
- APK file exists at expected path (check build log)
- APK transfers to device without error
- Install completes without prompts or failures
- App appears on home screen or app drawer
- App launches on first tap

**Fail If**: 
- APK missing or invalid
- Install fails with permissions error
- App won't launch after install
- Multiple copies appear on home screen (install duplication bug)

**Release Blocker**: YES (release candidate must build and install cleanly)

---

---

## Failure Interpretation & Triage

### Release-Blocking Failures (MUST fix before release)
1. **Startup crash or blank screen** → Check `src/app/boot.js`, canvas initialization
2. **Missing or broken assets** → Verify asset paths in `src/app/boot.js` (assetCandidates, audioCandidates)
3. **Input not working** → Check `src/engine/input.js`, canvas event listeners
4. **Collision broken or unfair** → Check `src/engine/collision.js`, invulnerability window
5. **Audio overlapping or not one-shot** → Check `src/core/audio.js`, play() deduplication
6. **Fracture/glide/reentry phase doesn't trigger or crashes** → Check `src/app/boot.js` state machine, phase timers
7. **Score doesn't increment or persists incorrectly** → Check `src/systems/scoring.js`, profile save/load
8. **Menu → Game → Game Over flow breaks** → Check `src/ui/*.js`, state transitions in `boot.js`
9. **Canvas doesn't resize on rotation** → Check `syncCanvasSize()` in `src/app/boot.js`, viewport meta tag
10. **Duplicate UI elements** → Check `ensureUi()` and `.hidden` class toggling in `src/ui/*.js`

### Nice-to-Fix (Can defer to post-launch patch)
1. Theme unlocks don't appear or look janky
2. Reduced Motion toggle doesn't fully disable animations
3. Audio stutters on slower devices (fallback to HTMLAudio works, but WebAudio priming slow)
4. Music doesn't cross-fade smoothly on mode transitions
5. Obstacle sprites look stretched or misaligned (visual, not gameplay)
6. Score toast/HUD text overlap in tight layout

---

## Go/No-Go Criteria

### ✅ GO (Approve for Release)
- All Phase 1–3 tests pass (startup, menu, game flow)
- Phase 4 tests pass (fracture/glide/reentry cycle works without crash)
- Phase 5 tests pass (game-over and restart flow work)
- Phase 6 audio tests pass (one-shot, no overlapping)
- Phase 7 console is clean (no red errors for core assets)
- Phase 8/9 (Android-specific) pass if deploying to Android
- No release-blocking failures detected

### 🛑 NO-GO (Do Not Release)
- Any startup, input, collision, or scoring test fails
- Fracture/glide/reentry crashes or desync
- Audio overlaps or distorts
- Duplicate UI elements visible during gameplay
- Console has red errors for core assets
- Canvas doesn't fill screen or rotate
- APK doesn't build or install on Android

### ⚠️ CONDITIONAL (Release with Known Limitation)
- Single-cycle fracture works, multi-cycle fracture has minor visual glitch → **GO with note**
- Fullscreen on Android has 2–3px nav bar visible but doesn't overlap canvas → **GO with note for next patch**
- Reduced Motion toggle works but animation still visible in one edge case → **GO, fix in polish phase**

---

## Verification Command Reference

### Pre-Test Build
```bash
npm install
npm run build
# (or npm run build:ps on Windows)
```

### Tests to Run Before Device Test
```bash
npm run test           # Unit tests (collision, difficulty, spawner)
npm run eval          # Regression gate (if baseline exists)
```

### Local Dev Test (Before Device)
```bash
npm run dev
# Opens http://localhost:5173 (or similar)
# Test menu, game, fracture cycle in browser first
```

### Android Deployment
```bash
npm run build:ps      # On Windows; generates APK path
# Transfer APK to device via adb or file transfer
adb install <APK_PATH>
```

---

## Session Notes

- **Tester Name**: _________________
- **Device**: _________________
- **OS Version**: _________________
- **Screen Size**: _________________
- **Date**: _________________

### Failures Observed
```
[List any failed test #s and exact error]
```

### Deviations from Expected
```
[Note any behavior that doesn't match expected but didn't explicitly fail]
```

### Release Recommendation
- [ ] GO
- [ ] NO-GO
- [ ] CONDITIONAL (note reason)

---

**Prepared by**: Runtime Verifier
**Version**: 1.0
**Last Updated**: 2026-04-20
