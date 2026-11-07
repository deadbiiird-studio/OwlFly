# OwlFly — Google Play closed-test submission (review copy, 2026-11-07)

**Not published.** Draft PR #16. No automatic uploads, merges or production deployment authorized.

## Release acceptance
- [ ] Compare with latest local Chromebook OwlFly game (uncommitted changes not included automatically).
- [ ] API 36 web quality, Android debug APK, and unsigned AAB checks pass.
- [ ] Re-test startup, tap controls, collisions, restarts, music and small-screen/Android 16 edge-to-edge behavior on a real Android phone.
- [ ] Package stays `com.owlfly.game`; release versionCode exceeds highest Play version.
- [ ] Sign release AAB with the **registered, trusted upload key**. The CI-generated unsigned AAB is not a Play submission.

## Owner steps in https://play.google.com/console/
1. Create/select OwlFly as a **Game**, not a duplicate entry. Confirm package `com.owlfly.game`.
2. Finish store listing: app name, descriptions, icon, feature graphic, screenshots, contact information, category and availability countries.
3. Complete **Policy and programs → App content** accurately: privacy policy (public HTTPS and also in app), Data safety (including SDKs), ads declaration, access, content rating, target audience and other Console prompts. Do not guess data practices.
4. Check Play App Signing. Old OwlFly public Git history reportedly exposed upload credentials; if the active upload key is compromised, request an upload-key reset and wait for approval before using the replacement.
5. Create/verify **Closed testing** and its testers. If using a personal account created after Nov 13, 2023, at least 12 people must stay opted in continuously for at least 14 days to apply for production access.
6. For the first upload, use Play Console and a **signed** AAB; resolve Google validation issues, then start closed testing and collect real install/crash/feedback evidence. Keep production gated.

## Future automated Alpha releases — OFF until authorized
- [ ] Draft PR #16 reviewed/merged only after CI and manual acceptance.
- [ ] Least-privilege Google Play service account authorized for OwlFly testing tracks.
- [ ] GitHub environment `google-play-alpha` protected.
- [ ] Secrets added privately: `UPLOAD_KEYSTORE_BASE64`, `UPLOAD_STORE_PASSWORD`, `UPLOAD_KEY_ALIAS`, `UPLOAD_KEY_PASSWORD`.
- [ ] Repo variable `OWLFLY_ALPHA_TRACK_ID` matches exact closed test track ID.
- [ ] Leave `OWLFLY_AUTO_ALPHA` unset/false until a separate explicit authorization.

## Sources
- https://support.google.com/googleplay/android-developer/answer/11926878
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/9859455
- https://capacitorjs.com/docs/updating/8-0

Authentication update: use keyless Workload Identity Federation variables `OWLFLY_WIF_PROVIDER` and `OWLFLY_PLAY_SERVICE_ACCOUNT` per `docs/KEYLESS_GOOGLE_PLAY_AUTH.md`, not `PLAY_SERVICE_ACCOUNT_JSON`.
