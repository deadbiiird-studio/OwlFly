PLAY: FULL SURFACE MAP

Project: OwlFly

Before code, list:
- all impacted files
- exact filenames present under web/assets/**
- every failed runtime asset request grouped by category:
  - owl
  - glide
  - rewards
  - clouds
  - buildings
  - audio
  - icons
- where boot.js or audio loaders generate those paths
- which requests are primary 404s vs later ERR_CONNECTION_REFUSED fallout
- safest patch surface

Do not patch yet.
Proceed only from verified file inventory and verified failed requests.

PLAY: FULL SURFACE MAP

Project: OwlFly

Goal:
Map the exact asset/path mismatch surface before any patching.

Use only verified information from:
- src/app/boot.js
- web/index.dev.html
- web/index.html
- tooling/build.mjs
- web/assets/**
- browser console failures

Output:
1. Verified asset folders and actual filenames
2. Exact failing requested URLs grouped by type:
   - owl sprites
   - glide sprites
   - rewards
   - clouds
   - buildings
   - audio
   - icons
3. Which code path requests each group
4. Whether each failure is:
   - filename mismatch
   - folder mismatch
   - base-path mismatch
   - post-server-drop noise
5. Safest patch surface
6. Exact files to edit first

Do not write code yet.