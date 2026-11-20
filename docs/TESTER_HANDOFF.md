# OwlFly — Closed Testing Alpha v3 Tester Handoff

This document describes **what to ask testers to check**, not a claim that version 3 is already in Play.

## Release identity — fill from actual Play Console evidence

- Package: `com.owlfly.game`
- Proposed next version: versionCode **3** / versionName **1.0.2**
- Source baseline: `6da055c8b817c95dd0ed6a9e18b5560162eda423`
- Signed-AAB GitHub Actions run: **UNVERIFIED**
- Accepted closed-testing track/release ID: **UNVERIFIED**
- Tester opt-in link: **ADD VERIFIED PLAY CONSOLE URL**
- Installed version observed on a tester device: **UNVERIFIED**
- Feedback destination: **ADD APPROVED PRIVATE CHANNEL**

Do not distribute an old debug APK as if it were the accepted Play release. The checked GitHub PR run `44413829396` produced a **debug** APK only. Signed bundle steps were skipped.

## What testers should notice

The new source contains a safe audible 3–2–1–GO countdown at **every** start/restart, one flap on tap, repeated flaps during a held press, normal gravity on release, and owl wing frames synchronized to flap events. The taller-rooftop prototype was merged to main, but its presence on a tester phone must be verified by installed build identity.

Ask testers to focus on clarity of first launch, controls, screen fit, obstacle anticipation and collision accuracy, audio cues, and restart stability. One failed flight is not automatically a defect; a failure before GO, unresponsive input, or collision mismatched to the visible obstacle may be.

## Exact test sequence

1. Confirm that the tester has joined the Play closed test and installed the **current named release**, not just received an email.
2. Note phone model, Android version and installed app versionCode.
3. Test first-launch menu and settings, then play once using taps.
4. Restart and verify the countdown again; hold to climb, release to descend.
5. Repeat restarts and test collisions with standard obstacles and taller buildings.
6. Test Motion: Full and Motion: Low before concluding owl-frame animation is broken.
7. Visit the in-app privacy link if one is present; report its absence.
8. Send a reproducible report to the **approved private channel**, with optional screenshot and no passwords or sensitive information.

Use `docs/DEVICE_SMOKE_CHECKLIST.md` for full test steps and issue fields. Keep the tester identity and any screenshot private. Database/screenshot automation is **not** active until independently deployed and disclosed.

## Release-blocking findings

App won't start; failure before GO; broken tap/hold/release; collision not matching visible geometry; repeated or missing run records; unusable phone UI; unsafe/inaccessible privacy disclosures; failure to install the intended Play version.

## Governance

No automatic Play upload or tester-message sending is authorized by this document. The release owner verifies signed AAB manifest, registered upload certificate, Play acceptance, tester participation, and privacy policy before sending release notifications.
