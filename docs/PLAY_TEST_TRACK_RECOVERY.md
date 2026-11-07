# OwlFly — repair Google Play tester access

Status: **Play Console action required**. The old URL shared in chat does not establish that a current testing release is available or that a user is eligible. Never infer an installation failure from a link alone.

## Confirm which distribution method is active

1. Open https://play.google.com/console/ and select the existing OwlFly app with package **com.owlfly.game**.
2. Go to **Test and release → Testing → Closed testing** and look at the track's status. If no release is active/available, there is nothing for a closed tester to install; uploading a bundle to the App bundle explorer alone does not start a testing release.
3. On the chosen closed-testing track open the **Testers** tab. Confirm the tester email list or Google Group is enabled. Provide the real feedback link/email and save.
4. Use the **Copy link** or opt-in URL shown in the track's Testers section. Do not assume the previously shared `https://play.google.com/apps/test/com.owlfly.game/1` is an active closed-test opt-in link.
5. On the Android device, use the **same Google account** that appears in the selected tester list, follow the opt-in instructions, accept testing, and open the actual Play listing after the release is available.
6. Confirm tester region, device compatibility, track availability, release status and any outstanding approval/review tasks.
7. If testing through **Internal app sharing** rather than a closed-test track, follow its *separate* uploader/tester permissions and link availability rules. Internal app sharing is not equivalent to closed testing and does not satisfy production-access closed-testing requirements.
8. If the console shows a specific error, record the exact text, distribution track, current versionCode, and status. Do not expose tester emails or private tokens.

## New release: 1.0.1 (code 2)

The Play Console screenshot captured Nov 7, 2026 displays exactly one uploaded version: code **1**, name **1.0**. This review branch defaults its Gradle version to code **2**, name **1.0.1**. The automation can override those values with environment variables.

Do **not** upload the older code-1 / API-35 AAB as the new update. A production or closed-testing upload needs a signed release AAB built from the approved game, using the Play-registered upload key. Older public history reportedly exposed an upload key: verify and reset it if compromised. The new pipeline's existing unsigned CI bundle is only for packaging verification.

## Current release blockers

- [ ] Confirm the GitHub game branch matches the intended playable Chromebook version; changes on the isolated gameplay-review branch are not automatically included.
- [ ] Confirm registered Play **upload certificate fingerprint** (not the Play app-signing certificate), and complete any upload-key reset before signing.
- [ ] Create a **signed** API-36 AAB for code 2 and verify its certificate and manifest.
- [ ] Verify Google Play's existing highest uploaded versionCode again before actual upload.
- [ ] Complete data safety, app content, store graphics, privacy policy URL, and tester configuration.
- [ ] Complete live-device smoke tests and approval.
- [ ] Keep `OWLFLY_AUTO_ALPHA` disabled; PR #16 remains draft and does not authorize Play publication.

## References

- https://support.google.com/googleplay/android-developer/answer/9845334
- https://support.google.com/googleplay/android-developer/answer/9844679
- https://support.google.com/googleplay/android-developer/answer/9859348
- https://support.google.com/googleplay/android-developer/answer/11926878
