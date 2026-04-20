#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_WEB="$ROOT_DIR/web"
TARGET_DIR="$ROOT_DIR/android/app/src/main/assets/public"

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Target not found: $TARGET_DIR"
  echo "Generate android/ first (Capacitor), or edit TARGET_DIR in this script."
  exit 1
fi

rsync -av --delete "$SRC_WEB/" "$TARGET_DIR/"
echo "Copied web/ -> $TARGET_DIR"
