#!/usr/bin/env bash
set -euo pipefail

app=${1:?Pass the path to the built App.app}
id=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app/Info.plist")
[[ "$id" == "$(node -p 'require("./capacitor.config.json").appId')" ]]
cmp web/index.html "$app/public/index.html"
cmp web/game.js "$app/public/game.js"
for asset in style.css privacy.html assets/sprites/owl_frame_0.png assets/audio/flap.wav; do
  cmp "web/$asset" "$app/public/$asset"
done
test -s "$app/Assets.car"
echo "Verified bundled OwlFly game in $app"
