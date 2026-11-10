# OwlFly release configuration — review required

These changes apply to the reviewed repository, not to live Play Console or DNS settings.

## Android signing

The Android release build now reads credentials from four environment variables rather than checked-in passwords or a machine-specific path:

- `OWLFLY_KEYSTORE_FILE`: absolute path to the existing upload keystore
- `OWLFLY_KEYSTORE_PASSWORD`: its password
- `OWLFLY_KEY_ALIAS`: the existing upload key alias
- `OWLFLY_KEY_PASSWORD`: password for that key

Release tasks fail when these values are missing. Debug builds and Gradle sync remain usable without them. Keep secrets out of source control and command history. Since credentials appeared in committed source history, treat them as exposed if real. Verify the key registered in Play Console before requesting an upload-key reset; do not casually replace the app-signing key.

After providing credentials securely, run `npm run build`, sync Capacitor assets, and execute `cd android && ./gradlew :app:bundleRelease` on a configured Android build machine. Android packaging was not tested in this review.

## Website

Pages uploads `web/`, which now contains `CNAME` for `owlfly.app`. Pages workflow checks all 80 current repository tests and regenerates the production bundle from `src/` before deployment. Confirm published DNS, HTTPS, and website access separately.

## Android App Links

The app manifest now targets `owlfly.app`. The supplied `web/.well-known/assetlinks.json` fingerprint was not verified against the current Play app-signing certificate. Confirm the public HTTPS file and the certificate in Play Console, then test links on a physical device. This patch does not prove App Links verification or Google indexing.

## Game runtime

Pause now polls input with a zero-duration step while physics is frozen, allowing Esc to resume. Collision handling guards against registering a crash more than once while the game-over screen is pending. Unit/build/evaluation checks pass locally; physical-device play is still outstanding.

The legacy Fracture/glide functions have no call to `beginFracture()` in the reviewed source. They are left untouched to avoid an unrelated architecture rewrite. Separate Python workshop tests require `lumiel.owlfly` modules absent from this repository, so no speculative implementation was created.
