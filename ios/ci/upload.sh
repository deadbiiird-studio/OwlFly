#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${ASC_KEY_ID:?Set ASC_KEY_ID in ios-testflight}"
: "${ASC_ISSUER_ID:?Set ASC_ISSUER_ID in ios-testflight}"
: "${ASC_PRIVATE_KEY:?Set ASC_PRIVATE_KEY to the full .p8 text in ios-testflight}"
[[ "$ASC_KEY_ID" =~ ^[A-Za-z0-9]+$ ]] || { echo 'Invalid App Store Connect key ID.' >&2; exit 1; }

key_dir="$HOME/.appstoreconnect/private_keys"
mkdir -p "$key_dir"
key="$key_dir/AuthKey_${ASC_KEY_ID}.p8"
trap 'rm -f "$key"' EXIT
printf '%s\n' "$ASC_PRIVATE_KEY" > "$key"
xcrun altool --upload-app --type ios --file "$RUNNER_TEMP/OwlFly.ipa" --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
echo 'Upload delivered. Check processing and compliance in App Store Connect → OwlFly → TestFlight.' >> "$GITHUB_STEP_SUMMARY"
