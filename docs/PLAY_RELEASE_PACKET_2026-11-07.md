# OwlFly — release gate summary (November 7, 2026)

**State:** Draft submission candidate, not published.

**Repository:** deadbiiird-studio/OwlFly, draft PR #16, branch automation/owlfly-delivery-pipeline.
**Package:** `com.owlfly.game`.
**Current Play evidence:** screenshot from App bundle explorer shows only code 1 / name 1.0, uploaded March 28, 2026.
**Proposed next default:** code 2 / name 1.0.1.
**Android compatibility:** minSdk 24, compile SDK 36, target SDK 36.
**CI state:** first API-36 workflow run 42408469568 passed quality and Android APK/AAB packaging; signed Play publishing was skipped.
**Signing gate:** original AAB was signed, but its signer is not yet verified as the registered Play upload-key certificate. It is not safe to assume the old signing material remains private.
**Game state:** GitHub `main` and `automation/owlfly-delivery-pipeline` use the same game.js blob; `review/owlfly-verified-20261104-53wE9JSj` has a different game.js blob. Decide and re-test the release game before signing.
**Source-of-truth:** the owner's current Chromebook OwlFly checkout and Play Console must be reconciled before upload.

## Ready for Play Console review

- Copy-ready store listing candidate: `docs/STORE_LISTING.md`.
- Tester access diagnostics: `docs/PLAY_TEST_TRACK_RECOVERY.md`.
- The existing `docs/PLAY_SUBMISSION_CHECKLIST_2026-11-07.md` and `docs/ALPHA_AUTOMATION_ACTIVATION.md` remain the release setup instructions.

## Do not claim as finished

- Registered upload key matching/rotation, signed code-2 AAB, privacy and data safety disclosures, owner store-contact information, screenshots/feature graphic, Play Console testing-track activation, and Android device acceptance.
- Production rollout or automatic Alpha uploads. Both remain out of scope.
