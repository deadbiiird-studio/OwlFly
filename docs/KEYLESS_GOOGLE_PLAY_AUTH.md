# OwlFly — keyless Google Play closed-testing authentication (review branch)

**Current state:** Draft PR #16. Automatic Alpha delivery is OFF. The service account exists, but the GitHub-to-Google identity trust is not yet verified. This document does not authorize a Play upload.

## Why this changed

Google Cloud organization policy `iam.disableServiceAccountKeyCreation` blocks exporting service-account JSON keys. **Keep this policy in place.** The workflow now uses short-lived Workload Identity Federation (GitHub OIDC) instead of `PLAY_SERVICE_ACCOUNT_JSON`. The older upload action required JSON; the workflow now calls the Play Developer API using its temporary OAuth access token. This code still needs live identity and signing verification before enabling any releases.

## Google Cloud — create the federation trust

1. Use the Cloud project that contains the existing `owlfly-play-publisher` service account. Verify the Google Play Android Developer API, IAM Service Account Credentials API, and Security Token Service API are enabled.
2. Open https://console.cloud.google.com/iam-admin/workload-identity-pools and create a new pool with ID `owlfly-github`.
3. Add an **OpenID Connect (OIDC)** provider: ID `owlfly-actions`, issuer `https://token.actions.githubusercontent.com/`, default audience.
4. Set mappings:
   - `google.subject=assertion.sub`
   - `attribute.repository=assertion.repository`
   - `attribute.repository_id=assertion.repository_id`
   - `attribute.ref=assertion.ref`
5. Restrict the provider with this CEL condition:

   `assertion.repository_id == '1146272117' && assertion.repository == 'deadbiiird-studio/OwlFly' && assertion.ref == 'refs/heads/main'`

   Use the numeric GitHub repository ID to defend against names being re-registered.
6. Grant **Workload Identity User** (`roles/iam.workloadIdentityUser`) on the `owlfly-play-publisher` service account to only the pool identities mapped to `attribute.repository=deadbiiird-studio/OwlFly`. Keep the condition above on the provider.
7. In Play Console, confirm this service account has OwlFly-specific **Release apps to testing tracks** access. Do not grant production release permission.

## GitHub Environment — nonsecret variables

Open https://github.com/deadbiiird-studio/OwlFly/settings/environments and select `google-play-alpha`. Set **environment variables**:

- `OWLFLY_WIF_PROVIDER`: the full provider resource, for example `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/owlfly-github/providers/owlfly-actions`. Use your real **numeric** Cloud project number.
- `OWLFLY_PLAY_SERVICE_ACCOUNT`: the service-account email from your Google Cloud project.
- `OWLFLY_ALPHA_TRACK_ID`: the **exact existing closed-testing track ID** in Google Play, not an assumed `alpha` string.

No downloaded JSON key is necessary. Do **not** create `PLAY_SERVICE_ACCOUNT_JSON`.

The **only signing secrets** still required for CI signing (not for OIDC authentication) are:
`UPLOAD_KEYSTORE_BASE64`, `UPLOAD_STORE_PASSWORD`, `UPLOAD_KEY_ALIAS`, `UPLOAD_KEY_PASSWORD`. Upload signing is a separate gate. The previously exposed signing material must be replaced/registered with Play if compromised; never paste a keystore in chat.

## Release gates remain closed

- [ ] Existing Chromebook game changes reconciled with GitHub game branch.
- [ ] API-36 Android build validated on a physical Android device.
- [ ] Play upload-key fingerprint checked and key reset finished if necessary.
- [ ] Signed release AAB verified using the registered key.
- [ ] Track ID, tester eligibility, privacy/data safety/store listing confirmed.
- [ ] Draft PR #16 reviewed and separately approved for merging.
- [ ] Only after owner approval, set `OWLFLY_AUTO_ALPHA=true` at repository level, with GitHub environment reviewer protections. Until then it must be unset/false.

**Important:** GitHub OIDC tokens are not credentials for this ChatGPT conversation to directly control the Play Console. This connects GitHub Actions to Google Play securely, and release jobs still need explicit configuration and gates.

## References
- https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines
- https://github.com/google-github-actions/auth
- https://developers.google.com/android-publisher/api-ref/rest/v3/edits.bundles/upload
- https://developers.google.com/android-publisher/api-ref/rest/v3/edits.tracks/update
- https://developers.google.com/android-publisher/api-ref/rest/v3/edits/commit
