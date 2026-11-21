#!/usr/bin/env bash
set -euo pipefail

# Use an iPhone supplied by the active Xcode image.
device=$(xcrun simctl list devices available --json | python3 -c '
import json, sys
devices = json.load(sys.stdin)["devices"]
ios = {k: v for k, v in devices.items() if ".iOS-" in k}
for runtime in sorted(ios, key=lambda k: tuple(map(int, k.split(".iOS-")[1].split("-"))), reverse=True):
    phones = [d for d in ios[runtime] if d["isAvailable"] and d["name"].startswith("iPhone")]
    if phones:
        print(phones[0]["udid"])
        break
else:
    sys.exit("No available iPhone simulator in this Xcode image")
')
xcrun simctl bootstatus "$device" -b
xcodebuild -quiet -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination "id=$device" -derivedDataPath "$RUNNER_TEMP/OwlFlySim" \
  -onlyUsePackageVersionsFromResolvedFile build
app="$RUNNER_TEMP/OwlFlySim/Build/Products/Debug-iphonesimulator/App.app"
bash ios/ci/check-app.sh "$app"
xcrun simctl install "$device" "$app"
xcrun simctl launch "$device" "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app/Info.plist")"
xcrun --sdk macosx swiftc ios/ci/recognize-menu.swift -o "$RUNNER_TEMP/recognize-menu"
for attempt in {1..25}; do
  xcrun simctl io "$device" screenshot "$RUNNER_TEMP/owlfly-iphone.png"
  if "$RUNNER_TEMP/recognize-menu" "$RUNNER_TEMP/owlfly-iphone.png"; then
    echo 'The iPhone simulator rendered the Start Flight button.'
    exit 0
  fi
  sleep 2
done
echo 'The game menu did not appear. Inspect the screenshot artifact.' >&2
exit 1
