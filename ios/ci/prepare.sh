#!/usr/bin/env bash
set -euo pipefail

xcodebuild -version
sdk=$(xcrun --sdk iphoneos --show-sdk-version)
echo "iPhoneOS SDK $sdk"
[[ ${sdk%%.*} -ge 26 ]] || { echo 'An iOS 26 or newer SDK is required.' >&2; exit 1; }
npm ci
npm run build
./node_modules/.bin/cap sync ios
git diff --exit-code -- ios/App/CapApp-SPM/Package.swift web/index.html web/game.js
