# Native Android audio gate — physical regression follow-up

User report: the opening branding is visible and music still plays when the app is closed or backgrounded. Exact installed artifact, device, lifecycle path and duration are not yet confirmed. Previous automated checks did not prove real-device silence.

Candidate adds AndroidX WebView audio muting using the existing androidxWebkitVersion 1.12.1, runtime feature detection, immediate mute on focus loss/pause/stop/destroy, and a generation guard against late foreground callbacks. Existing JS scheduler/voice shutdown remains the fallback; no branding or gameplay changes. Native output muting is defense in depth, not proof that background computation has stopped. No release version change or Play upload.

## Evidence
Use the exact candidate debug APK on a spare device, or a separately approved signed update. Capture:
- device model, Android version, WebView provider/version, exact APK commit and build type.
- From main menu with audible music: press Home, switch to another app, swipe OwlFly from Recents, lock, and reopen. Wait 15 seconds each. Also test countdown and gameplay.
- Whether audio stops, resume works, mute preference remains, and there is no duplicate music.
- If sound persists, force stop OwlFly and check whether it stops; check if a browser tab is playing OwlFly separately.
- With adb connected: `adb logcat -s OwlFlyAudioGate` (capture active=false and native muted=true, or unsupported/error).
- A successful build is not a physical pass. If WebView muting is unsupported, explicitly test the JS fallback on that device.

No merge, signing, release or version bump until review. Rollback: close draft PR and discard branch.
