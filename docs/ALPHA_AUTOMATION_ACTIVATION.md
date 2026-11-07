# OwlFly — Closed Testing Alpha automation activation

This PR does **not** publish to Google Play. It prepares CI and a guarded publishing job.

## Verified before activation
- App identity is `com.owlfly.game`, unchanged.
- Web quality checks, Android debug APK, and unsigned Android AAB compile in GitHub Actions.
- The closed-testing publishing job runs **only on push to main** when repository variable `OWLFLY_AUTO_ALPHA=true`.
- The job checks the exact Play API track ID, uses a versionCode higher than existing Play bundles and track releases, verifies JAR signing on the release AAB, and uploads to the verified track.
- A failed publishing job attempts to discard its temporary Play edit. The Play API preflight itself creates an edit, which can invalidate another draft edit in progress. Avoid running it while someone is editing a release in Play Console.

## Owner-owned one-time setup (required, not done)
1. In **Google Play Console → OwlFly → Play app signing**, inspect both the app signing certificate and the **upload key certificate**. Compare the upload certificate SHA-256 fingerprint with the previously used private keystore. The public Git history included signing credentials; consider that upload key compromised if the registered certificate matches. Preserve the old keystore for recovery until the transition succeeds.
2. If compromised, generate a **new private upload keystore** and export its public certificate. Use **Request upload key reset** in Play Console and wait for confirmation. Do **not** change the Play-managed app-signing key or upload a new key that Play has not registered. Never paste passwords, private keys, or keystore bytes into PRs/issues/chat.
3. In Google Cloud, enable the **Google Play Android Developer API**. Create a service account and grant it only the required OwlFly app permissions, including **Release apps to testing tracks** in Play Console. Use a secure Google-managed alternative to long-lived JSON keys when available; the current workflow accepts a service account JSON GitHub secret.
4. In GitHub, create an environment named `google-play-alpha`. Configure appropriate environment protection rules. Enter the following **GitHub Actions secrets** scoped to that environment:
   - `UPLOAD_KEYSTORE_BASE64`: securely encoded bytes of the *registered* replacement upload keystore.
   - `UPLOAD_STORE_PASSWORD`
   - `UPLOAD_KEY_ALIAS`
   - `UPLOAD_KEY_PASSWORD`
   - `PLAY_SERVICE_ACCOUNT_JSON`: authorized service account credentials, kept private.
5. Set repository variable `OWLFLY_ALPHA_TRACK_ID` to the exact Play Developer API identifier of **OwlFly's existing Closed testing → Alpha** track. The default is `alpha`, but custom closed-testing tracks may use different IDs. The pipeline fails closed if that track is absent; it will never automatically fall back to internal or production.
6. Verify the release with an actual Android device, and bring any newer **Chromebook-only changes** into a reviewed GitHub branch. The GitHub builds currently represent repository contents only.
7. After the PR is reviewed/merged and every prerequisite is confirmed, **last**, set the repository variable `OWLFLY_AUTO_ALPHA=true`. That enables unattended Alpha uploads on subsequent successful pushes to `main`. Keep the switch unset or `false` until ready.

## Release safety
- Never commit private `.jks` files, service account JSON files, or credentials.
- Do not confuse the automatically generated **unsigned AAB** with a signed Play release.
- Production is never an upload target.
- A failed authentication, missing track, missing signing material, or failed signature verification stops publishing.
- Google Play may still require Console setup, review, and tester enrollment.
- For historical secrets in public Git commits, editing the current file does not erase past exposure. Rotate affected credentials and consider Git history cleanup only after preserving evidence and coordinating repository clones.
