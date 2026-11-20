# OwlFly — Closed Alpha v3 Physical-Device Smoke Test

**Authority:** Human tester on an installed Android build. This is a test procedure, not proof of passing.  
**Release baseline:** `com.owlfly.game`, versionCode **3**, versionName **1.0.2**, minimum API **24**, target API **36** (source on main at `6da055c8`).  
**Build identity:** Record actual installed Play versionCode, delivery track, device, and test date before completing this checklist. Do not assume the source version is already installed.

## Evidence header

- Tester ID (non-identifying): ______
- Date/time and time zone: ______
- Phone model / Android version: ______
- Play track: ______
- Installed package + versionCode: ______
- Signed AAB build run ID / commit SHA, if available: ______
- Result: PASS / FAIL / NOT TESTED
- Reproduction seed / run ID, when available: ______

## Phase A — Install, first launch, and menus

- [ ] Install the expected version from the authorized Play closed-testing link; do not infer participation from an invitation alone.
- [ ] Launch with no blank screen, missing assets, or inaccessible primary controls.
- [ ] On narrow and short portrait screens, confirm menu/buttons and game-over panel remain reachable. Mobile menu-centering PR #21 is **not merged**; record real measurements/issues instead of assuming it is fixed.
- [ ] Verify mute, Music On/Off, Motion: Low/Full, and sky-theme controls. Low motion can change how wing animation appears; compare Full motion before reporting missing frames.
- [ ] Check back-to-menu and pause/resume flows without duplicate overlays.

## Phase B — Every start and restart (mandatory)

- [ ] Start a flight and observe distinct **3–2–1–GO** visual countdown, then repeat after a crash and restart at least 20 times.
- [ ] No score, obstacle collision, or death is permitted *before* GO. A brief authored handoff may follow GO; record unexpected invulnerability during regular flight.
- [ ] Owl and world visibly animate during countdown; countdown tones and brighter GO cue are audible with sound on, without stacking.
- [ ] Mute disables countdown audio; visual countdown alone remains understandable.
- [ ] A touch held during countdown must be released before another hold can control the owl.

## Phase C — Tap, hold, release, sprites

- [ ] **Tap:** one flap impulse; visible upward response, normal gravity afterward.
- [ ] **Hold:** repeated bounded flap impulses approximately every 0.2 s; no infinite acceleration or silent collision immunity.
- [ ] **Release:** repeated flapping stops and normal falling resumes. Also verify pointer cancellation, app focus loss, and Space/Enter key release where applicable.
- [ ] Owl cycles its existing three wing frames in step with flap actions. Check both Motion: Full and Motion: Low.
- [ ] Owl remains within gameplay bounds; input does not trigger duplicate actions.

## Phase D — Buildings, clouds, score, collision

- [ ] Verify ordinary obstacle pairs and taller rooftop/open-sky stretches render with readable silhouettes.
- [ ] Rooftop variation should be present in the latest **source**, but confirm its presence in the **installed bundle** rather than assuming it was delivered.
- [ ] Check collisions against visible building edges and clouds, including when objects leave and reenter the screen.
- [ ] **Collision is authoritative:** a normal collision ends the run. No legacy Fracture/glide/reentry reward sequence or hidden invulnerability is an expected success condition.
- [ ] Passing obstacles increases score once each; one crash produces one game-over event and one completed run record.
- [ ] Restart resets current score without erasing stored best-score progress.

## Phase E — Audio, accessibility, resilience

- [ ] Compare countdown GO sound, flap, score and crash sounds for overlap or silence, including after repeated restarts.
- [ ] Change volume/mute/music settings, close and relaunch, and check persistence.
- [ ] Interrupt the app, return from multitasking, and verify no unintended held input or duplicate game loops.
- [ ] Check text contrast, interaction sizes, orientation changes and any clipped touch targets.
- [ ] Locate an accessible privacy-policy link *inside the Android app*. If absent, mark **FAIL/RELEASE REVIEW**, not PASS solely because the website has a policy page.
- [ ] If screenshots or questionnaires are used, verify explicit consent and privacy disclosures. PR #23 is schema-only; do **not** claim in-game capture exists without separate shipped proof.

## Defect record (one per issue)

- Expected / actual:
- Exact steps (including tap/hold timing):
- Package versionCode / release track:
- Device / OS / motion & audio settings:
- Approximate score/time, seed or run ID:
- Screenshot/video (optional; remove personal information):
- Severity: BLOCKER / MAJOR / MINOR
- Reproduction: ALWAYS / SOMETIMES / ONCE

## Exit gate

The smoke test passes only after a named build is installed on a physical handset and the tester records results. Do not mark Google Play policy compliance, signed-AAB validity, or all closed-testing participation complete from this checklist alone.

See `docs/ALPHA_V3_RELEASE_EVIDENCE_2026-11-19.md` for the separate build and Play delivery gates.
