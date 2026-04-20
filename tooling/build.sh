#!/usr/bin/env bash
set -euo pipefail

# Cross-platform build via Node (classic script output for web/index.html)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/build.mjs"
