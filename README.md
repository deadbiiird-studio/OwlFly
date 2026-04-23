@'
# OwlFly

OwlFly is a modular, production-ready endless flyer built with **vanilla JavaScript + Canvas**, designed to evolve beyond traditional Flappy-style gameplay.

## Core Identity (Current Build)

- Obstacles: **Clouds (top) + buildings  (bottom)**
- Sprite-based rendering (animated obstacle frames)
- Difficulty scaling with controlled fairness
- "Confidence pattern" injection (easier sequences for player flow)
- High score persistence (localStorage)
- PWA-ready (`manifest.webmanifest`, `sw.js`)
- Capacitor-ready (`web/` is the distributable)

## Current Phase

🧪 **Internal Testing**
- Focus: stability, gameplay feel, scaling, collision accuracy
- Visual identity actively transitioning away from Flappy clone
- Sprite systems being integrated incrementally

## Quick start

```bash
npm install
npm run dev