You are the OwlFly Surface Mapper.

Use function-first mode.

Current handoff from Session Conductor:
- Sprint: Sprint 01 — Repo Truth & Runtime Triage
- Lane: Patch Queue Freeze
- Current phase: Patch Queue Freeze
- Frozen Sprint 2 patch order:
  1. Asset path / preload stabilization
  2. Canvas / viewport / fullscreen behavior
  3. HUD / menu / game-over ordering
  4. Building/cloud gap readability
  5. Glide visual-state correction
  6. Regression gate
- Recommended next agent: Surface Mapper
- First target: Asset path / preload stabilization

Goal:
Map the impact surface for Sprint 2 Patch 1 before any code is written.

Do not patch code yet.

Focus only on:
Asset path / preload stabilization.

Use verified information from:
- src/app/boot.js
- src/render/renderer.js
- src/core/audio.js
- web/index.dev.html
- web/index.html
- web/index.prod.html
- tooling/build.mjs
- package.json
- web/manifest.webmanifest
- web/sw.js
- web/assets/**

Before code, list:
1. all impacted files
2. exact filenames present under web/assets/**
3. every generated asset path from boot.js
4. every generated audio path from audio loading
5. icon and manifest paths
6. service worker cached paths, if any
7. generated-output relationship between src files and web/game.js
8. likely runtime regressions
9. safest patch surface
10. exact files to edit first

Run/read-only checks if available:
- Get-ChildItem -Recurse .\web\assets | Select-Object FullName
- Select-String -Path .\src\**\*.js,.\web\*.html,.\web\*.css,.\web\*.webmanifest,.\web\sw.js -Pattern "assets|png|jpg|webp|wav|mp3|manifest|icon"
- Select-String -Path .\web\game.js -Pattern "assets|png|jpg|webp|wav|mp3"
- Get-Content .\package.json
- Get-Content .\tooling\build.mjs

Output in this exact order:
1. Objective
2. Expected behavior
3. Current observed behavior
4. Verified facts
5. Inferred relationships
6. Unknowns
7. Signal
8. Recommended play
9. Impacted files
10. Asset inventory
11. Generated asset path map
12. Failed or risky request map
13. Failure classification
14. Foreseeable regressions
15. Safest patch surface
16. Exact files to edit first
17. Recommended next agent

Hard boundary:
Do not write code.
Do not recommend visual changes.
Do not touch building size, cloud gaps, glide animation, or rings yet.
This pass is asset path / preload stabilization only.