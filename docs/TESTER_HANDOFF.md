# OwlFly — Internal Test Handoff

## Build Under Test
Commit: [INSERT SHORT HASH]

## Purpose
This internal test is for:
- startup stability
- fullscreen / viewport fit
- menu → gameplay → game over flow
- input, collision, and score behavior
- fracture / glide / reentry behavior
- audio trigger sanity
- obvious missing asset/path issues

This internal test is **not** for:
- monetization
- leaderboards
- store polish
- feature requests

## Install

### Web
Link: [INSERT LINK]

### Android APK
APK path or link: [INSERT APK PATH OR LINK]

## Test Time
Expected duration: 15–20 minutes

## Required Test Order
Use:
- `docs/DEVICE_SMOKE_CHECKLIST.md`

Run the checklist in order. Do not skip startup, menu, or gameplay phases.

## What Counts As A Release-Blocking Failure
- app does not launch
- blank screen or missing core UI
- input does not work
- collision / game-over flow is broken
- score does not update correctly
- audio overlaps badly or triggers incorrectly
- fullscreen / viewport fit is broken on device
- obvious missing assets or broken paths

## What To Report
Send:
1. device model
2. OS version
3. exact steps
4. what happened
5. what you expected
6. screenshot or short video if possible

## Bug Report Channel
Email / form / contact: [INSERT CONTACT]

## Known Issues
See:
- `docs/KNOWN_ISSUES.md`

## Notes
Only report issues you can actually reproduce.