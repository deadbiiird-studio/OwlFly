#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${IOS_P12_BASE64:?Set IOS_P12_BASE64 in ios-testflight}"
: "${IOS_P12_PASSWORD:?Set IOS_P12_PASSWORD in ios-testflight}"
: "${IOS_PROFILE_BASE64:?Set IOS_PROFILE_BASE64 in ios-testflight}"

work=$(mktemp -d "$RUNNER_TEMP/owlfly-sign.XXXXXX")
keychain="$work/signing.keychain-db"
profile_path=''
previous_keychains=()
while IFS= read -r line; do
  previous_keychains+=("$(printf '%s' "$line" | sed -E 's/^[[:space:]]*"//;s/"$//')")
done < <(security list-keychains -d user)
cleanup() {
  if [[ -n "$profile_path" ]]; then rm -f "$profile_path"; fi
  security list-keychains -d user -s "${previous_keychains[@]}" >/dev/null 2>&1 || true
  security delete-keychain "$keychain" >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

printf '%s' "$IOS_P12_BASE64" | base64 -D > "$work/dist.p12"
printf '%s' "$IOS_PROFILE_BASE64" | base64 -D > "$work/app.mobileprovision"
security cms -D -i "$work/app.mobileprovision" > "$work/profile.plist"
password=$(openssl rand -hex 32)
security create-keychain -p "$password" "$keychain"
security set-keychain-settings -lut 3600 "$keychain"
security unlock-keychain -p "$password" "$keychain"
security import "$work/dist.p12" -f pkcs12 -P "$IOS_P12_PASSWORD" -k "$keychain" -T /usr/bin/codesign -T /usr/bin/security >/dev/null
security set-key-partition-list -S apple-tool:,apple: -s -k "$password" "$keychain" >/dev/null
security list-keychains -d user -s "$keychain" "${previous_keychains[@]}"
identity=$(security find-identity -v -p codesigning "$keychain" | awk '/"Apple Distribution:/ {print $2; exit}')
[[ -n "$identity" ]] || { echo 'A valid Apple Distribution identity and its private key are required.' >&2; exit 1; }

bundle=$(node -p 'require("./capacitor.config.json").appId')
python3 - "$work/profile.plist" "$bundle" "$identity" "$work/export.plist" <<'PY'
import datetime, hashlib, plistlib, sys
from pathlib import Path

source, bundle, identity, destination = sys.argv[1:]
p = plistlib.loads(Path(source).read_bytes())
team = p["TeamIdentifier"][0]
ent = p["Entitlements"]
if ent.get("application-identifier") != p["ApplicationIdentifierPrefix"][0] + "." + bundle:
    sys.exit("The provisioning profile does not match the OwlFly bundle ID.")
if (p["ExpirationDate"] <= datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    or p.get("ProvisionedDevices") or p.get("ProvisionsAllDevices") or ent.get("get-task-allow")):
    sys.exit("An active App Store Connect distribution profile is required.")
if identity.lower() not in [hashlib.sha1(cert).hexdigest() for cert in p["DeveloperCertificates"]]:
    sys.exit("The distribution certificate and the provisioning profile do not match.")
options = {"method": "app-store-connect", "destination": "export", "signingStyle": "manual",
           "teamID": team, "signingCertificate": identity, "provisioningProfiles": {bundle: p["UUID"]},
           "manageAppVersionAndBuildNumber": False}
Path(destination).write_bytes(plistlib.dumps(options))
PY
plist=/usr/libexec/PlistBuddy
team=$("$plist" -c 'Print :TeamIdentifier:0' "$work/profile.plist")
uuid=$("$plist" -c 'Print :UUID' "$work/profile.plist")
profile_name=$("$plist" -c 'Print :Name' "$work/profile.plist")
profile_dir="$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"
mkdir -p "$profile_dir"
profile_path="$profile_dir/$uuid.mobileprovision"
cp "$work/app.mobileprovision" "$profile_path"

# Two trailing components keep retries unique within Apple's build-number limits.
build="$(( (GITHUB_RUN_NUMBER - 1) / 100 + 1 )).$(( (GITHUB_RUN_NUMBER - 1) % 100 )).$GITHUB_RUN_ATTEMPT"
xcodebuild -quiet -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -onlyUsePackageVersionsFromResolvedFile \
  -archivePath "$work/OwlFly.xcarchive" "OWL_TEAM_ID=$team" \
  "OWL_PROFILE_NAME=$profile_name" "CURRENT_PROJECT_VERSION=$build" archive
xcodebuild -quiet -exportArchive -archivePath "$work/OwlFly.xcarchive" \
  -exportPath "$work/export" -exportOptionsPlist "$work/export.plist"
ipas=("$work/export/"*.ipa)
[[ ${#ipas[@]} -eq 1 && -s "${ipas[0]}" ]]
unzip -q "${ipas[0]}" -d "$work/verify"
app="$work/verify/Payload/App.app"
codesign --verify --deep --strict "$app"
bash ios/ci/check-app.sh "$app"
[[ "$("$plist" -c 'Print :CFBundleVersion' "$app/Info.plist")" == "$build" ]]
test -s "$app/embedded.mobileprovision"
cp "${ipas[0]}" "$RUNNER_TEMP/OwlFly.ipa"
echo "Verified signed iPhone build $build at revision $GITHUB_SHA." >> "$GITHUB_STEP_SUMMARY"
