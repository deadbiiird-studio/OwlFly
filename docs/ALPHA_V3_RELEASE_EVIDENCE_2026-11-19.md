# OwlFly Alpha v3 — Evidence and Release Handoff (2026-11-19)

## Mission

Safely take the merged API 36 / gameplay changes from the GitHub repository to **one identified signed AAB** and, after owner review, the Google Play **closed testing** track. Preserve existing tester opt-ins and the currently installed baseline until the new release is accepted.

## Verified repository facts

- Current reviewed `main`: `6da055c8b817c95dd0ed6a9e18b5560162eda423`, merge of PR #31.
- `android/app/build.gradle`: package `com.owlfly.game`; `versionCode 3`; `versionName "1.0.2"`; min SDK 24; target SDK 36.
- PR #30 merged mandatory 3–2–1–GO safe launch, audible cue, tap/hold repeat flap and sprite synchronization; PR #22 merged varied tall rooftops.
- GitHub Actions run [44413829396](https://github.com/deadbiiird-studio/OwlFly/actions/runs/44413829396) on the **PR head** `763ee2afd` ended green and checked the **built debug APK manifest** for code 3, min 24 and target 36.
- Run `44413829396` produced the artifact `owlfly-debug-apk-44413829396` (artifact #14477957929, scheduled to expire 2026-11-21).
- The same run's `Decode existing Play upload keystore`, `Create signed Android App Bundle`, `Verify signed AAB`, and signed-AAB artifact steps were **SKIPPED** because the run was triggered by a pull request.

## Not verified / do not infer

- No *new manual* `workflow_dispatch` run from main for version 3 was found in the checked recent run list.
- No signed **v3** AAB upload, SHA-256, Play acceptance, policy clearance, active versionCode, or installed tester version has been established from this GitHub evidence.
- A successful debug APK build does not prove a signed AAB used the registered Play upload certificate or that the AAB manifest reports target API 36.
- PR #21 mobile centering and PR #23 schema-only private feedback are still open. Do not treat them as shipped.
- The website privacy page is merged; an accessible in-app privacy link is **not verified**.
- The Chromebook Desktop Commander device was offline at the review; the two visible Supabase projects were inactive Spark projects, not a verified OwlFly backend.

## Owner-controlled build: smallest next action

1. Open [Android bundle workflow](https://github.com/deadbiiird-studio/OwlFly/actions/workflows/android-bundle.yml) → **Run workflow**.
2. Select the `main` branch. Do not choose a PR branch. Dispatch only after confirming the four existing GitHub Actions signing secrets correspond to the registered Play **upload** key. Never paste credentials into chat or source.
3. In the new run, require success for web build, npm tests, Capacitor sync, debug APK manifest, signed AAB build, `jarsigner` verification, and signed-AAB artifact upload. **Record run ID and exact commit SHA.**
4. Download `owlfly-closed-alpha-signed-aab-<run_id>` from that new run before its 3-day retention expires. Compute and record its SHA-256; independently inspect **the AAB manifest** for `com.owlfly.game`, versionCode 3, min API 24, target API 36. (The workflow's current explicit `aapt` manifest check is for debug APK, not the AAB.)
5. Verify the signing certificate fingerprint matches the Play Console registered upload certificate. Do not rotate or substitute keys just to make the build green.

If signing secrets are unavailable, stop at a failing-closed build gate; do not generate a replacement key automatically.

## Owner-controlled Play submission

6. In Play Console, verify current highest versionCode and active closed-test track before uploading; older internal-track artifacts and drafts need separate inspection, not automatic deletion.
7. Upload **only the verified v3 signed AAB** to a new closed-testing Alpha release. Record Play's acceptance/error messages and the assigned release ID; do not assume target API warnings disappear immediately.
8. Verify the published privacy link and in-app policy access, Data safety declarations, target API policy, and any relevant age/content settings. Address any actual blockers before sending testers the update.
9. On a physical handset, confirm the installed versionCode matches the accepted release and execute `docs/DEVICE_SMOKE_CHECKLIST.md`—including 20 restarts and tap/hold/release.
10. Record opt-in and installed tester counts separately. Notify testers with the **confirmed** new build and an approved feedback link only after installation is independently verified.

## Evidence ledger

| Gate | State | Evidence |
| --- | --- | --- |
| v3 source/API 36 | VERIFIED (repository) | main `6da055c8`, PR #31 |
| PR debug build & APK manifest | VERIFIED (CI) | run `44413829396` |
| Main branch signed v3 AAB | UNVERIFIED | manual run ID needed |
| Signed AAB SHA-256 & certificate | UNVERIFIED | artifact and fingerprint needed |
| AAB manifest API 36 | UNVERIFIED | independent bundle inspection needed |
| Google Play closed-track v3 release | UNVERIFIED | release ID / screenshot needed |
| Tester opt-ins and installs | UNVERIFIED | Play Console / device evidence needed |
| Mobile physical regression | UNVERIFIED | checklist with device/result needed |
| In-app privacy link | NEEDS REVIEW | app UI inspection needed |
| Supabase in-game reports | NOT DEPLOYED | PR #23 is schema-only |

**Boundary:** This handoff authorizes no automated release, merges, credential changes, database schema changes, privacy declarations, or tester notifications. It exists to prevent the status of one system from being mistaken for proof about another.
