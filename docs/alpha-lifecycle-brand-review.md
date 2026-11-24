# Alpha lifecycle and brand introduction — draft review

Base: 23084ac4411e6c661b2d007ed266dd9a3eaeea77. Candidate only; no production release or Play upload.

- Native Android focus/resume/pause and document visibility/page lifecycle gate audio and simulation.
- Backgrounding immediately zeros the master gain, stops queued WebAudio sources, pauses fallback media, and stops the music scheduler.
- Gameplay/countdown remains paused until a deliberate Resume flight action. Menu or game-over returns without starting a new run.
- Intro is a silent, offline, skippable 2.5-second SkyGlass Partners text/emblem concept, shortened to 1.2 seconds with reduced motion. The owl asset is reused. Branding is provisional and needs owner approval.
- No changes to gameplay physics, scoring, collisions, dependencies, version code, or Play track.

## Physical gates (not executed)
Test on A03s and A156E with music enabled and disabled, reduced motion on/off, and with airplane mode:
1. Fresh launch shows intro once; skip and automatic transition each reach main menu. Start Flight works, countdown is audible when enabled.
2. During menu, countdown, flight and game-over: Home, Recents, switch to another app, lock/unlock, notification shade. Sound stops while inactive; no doubled music on repeated returns.
3. During countdown and flight, wait in another app for at least 15 seconds. Return: score, position and countdown do not advance; Resume flight is required. No held-input carryover. Repeat 10 times.
4. Return after a crash or during startup: no duplicate runs or stuck resume screen; restart does not replay the studio intro.
5. Record device/model, candidate commit, APK source, exact steps and results; do not claim a pass without evidence.

## Release gate
Debug PR artifacts only. Android workflow currently pins versionCode 4 / versionName 1.0.3; before a new Play upload, verify the highest used version code and approve corresponding version/CI changes, signing, and Closed Alpha release. Main merges can deploy the website: review before merging. Debug APK signing differs from Play; use a spare device/profile or approved separate test setup, not uninstalling an enrolled tester's app casually.

Rollback: close draft and discard its branch. If later merged, revert the candidate commit and rebuild. Existing Play release remains untouched until a separately approved upload.
