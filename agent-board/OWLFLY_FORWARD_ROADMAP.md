# OwlFly Forward Roadmap — Post-A3

## Baseline
Current sealed atmosphere checkpoint: A3 merged to `main` at `a28156c58e7ee76f35762c1f5c06857a333fa384`.

A3 uses authored Canvas geometry, not a sprite sheet. The distant city is a frozen 12-beat silhouette motif generated from `src/render/environmentGeometry.js` and rendered through the existing city-depth renderer.

## Default route

### B1 — Sparse deterministic window lights
Purpose: make the city feel occupied without changing skyline geometry, collision, physics, scoring, spawn cadence, or route signaling.

Target implementation:
- far-layer windows first;
- deterministic placement tied to world segment identity;
- tiny bounded count per segment;
- no flashing in the first slice;
- reduced-motion parity;
- dedicated density/luminance/readability tests;
- human gate before merge.

### B2 — Rooftop life
Add one class at a time: antennas, water tanks, vents, tiny plants. Non-collidable and silhouette-safe.

### B3 — Controlled motion
Introduce only restrained deterministic motion: antenna blink, vent spin, laundry sway, subtle light flicker. Reduced-motion must freeze or simplify motion.

### B4 — Distant aerial life
Rare background-only aircraft / mysterious craft / parachute-like silhouettes. Must never resemble hazards.

### C — District visual language
First coherent city districts:
- Cozy Residential
- Old Rooftops
- Downtown Glow
- Industrial Edge
- Storm Approach / Mist District

Districts differ first by palette, skyline rhythm, windows, atmosphere, and prop vocabulary — not physics.

### D — Theme reconciliation
Keep persistence-safe IDs stable while reinterpreting presentation:
- night -> Cozy Night City
- sunrise -> Sunrise Rooftops
- dusk -> Blue Dusk City
- haunted -> Fogbound / Old Quarter
- neon -> Neon Downtown

### E — Rare enterable buildings
Create a separate mechanic contract. Only rare unmistakably marked buildings become entrances. Interior flight keeps one-input grammar and exits through another readable opening.

### F — Owl environmental reaction
Scarf/gust response, lantern/fog response, tiny near-miss reaction, rain/wind visual response. Presentation first; no physics implication.

## Alternate schedules

### Route 1 — Identity-first (default)
B1 -> B2 -> B3 -> B4 -> C -> D -> E -> F
Best for coherent art direction, lowest regression risk, strongest long-term environment foundation.

### Route 2 — Submission-first
B1 -> small D pass -> packaging/store/release polish -> B2/B3 -> C -> E
Best if the immediate goal is a cleaner public/closed-testing build rather than maximum feature depth.

### Route 3 — Signature-mechanic sooner
B1 -> C-lite -> E prototype -> return to B2/B3/D
Best if enterable buildings are intended to become OwlFly's headline differentiator. Higher architecture and QA risk; requires its own >=90 mechanic contract before implementation.

### Route 4 — Atmosphere-first
B1 -> B3 -> weather presentation -> C -> D -> B2 -> E
Best for dramatic rain/wind/mist identity. Weather remains visual until a later mechanic contract explicitly approves gameplay effects.

### Route 5 — Content-production pipeline
B1 -> procedural/declarative prop contract -> sprite/decor asset pipeline -> C -> D -> E
Best if Lumiel or external generators will eventually feed OwlFly authored visual content at scale.

## Sprite-sheet opportunity
Do not replace the A3 distant skyline with a sprite sheet by default. The current geometry is cheap, themeable, resolution-independent, deterministic, and gate-friendly.

Sprite sheets become higher-value for:
- iconic district landmarks;
- decorative rooftop prop sets;
- animated signs/windows;
- enterable-building exterior markers;
- interior furniture/desk/lamp/shelf sets;
- weather animation tiles;
- rare background craft.

A hybrid system is likely stronger than choosing only procedural geometry or only sprites.

## Opportunity map beyond the obvious roadmap

### 1. City grammar as data
Move skyline motifs, prop vocabularies, density, palettes, and district rules into declarative data. This lets new districts be authored without rewriting renderer logic.

### 2. Seed-addressable runs
Expose deterministic environment seeds for screenshots, QA repros, challenge codes, and curated daily routes without changing gameplay physics.

### 3. Visual-semantic telemetry
Record which visual combinations precede deaths or human confusion. This can distinguish actual difficulty from perceived difficulty and protect route honesty automatically.

### 4. Screenshot identity gate
Create a test/evaluation harness that renders fixed seeds/themes and compares composition metrics or approved reference captures. Goal: protect OwlFly's visual identity as strongly as gameplay metrics are protected now.

### 5. Asset-generation API contract
Define an asset manifest that Lumiel or a sprite generator can satisfy: dimensions, alpha hull, anchor, safe bounds, palette family, animation cadence, semantic role, and collision/non-collision status. This converts sprite generation from ad-hoc art requests into a repeatable production pipeline.

### 6. District-to-interior continuity
When enterable buildings arrive, use exterior district identity to select interior palettes/props. A Neon Downtown building should lead to a recognizably related interior rather than a disconnected minigame.

### 7. Rare-event layer
Create non-gameplay rare events (distant craft, rooftop cat, odd window silhouette, meteor, balloon) using deterministic rarity. This creates discovery/replay conversation without adding obstacle complexity.

### 8. Photo-mode / seed capture
A lightweight pause/capture mode could leverage the authored backgrounds for shareable screenshots. Consider only after UI/submission needs are stable.

### 9. Accessibility-derived design leverage
Reduced-motion infrastructure can become a general environment-intensity control: motion, particle density, flicker, atmospheric opacity. This can improve accessibility and become a debugging/readability tool.

### 10. Release lanes
Maintain three conceptual lanes:
- sealed gameplay baseline;
- atmosphere/content candidate;
- mechanic experiment.
This prevents enterable-building or weather experiments from contaminating a release-ready build.

## Decision gates
Every material addition still follows the existing design contract:
- >=90/100 admission score;
- gameplay readability >=18/20;
- baseline preservation >=18/20;
- architecture >=13/15;
- automated build/test/eval/readability gates;
- human visual/playability veto;
- isolated rollback.

## Recommended next action
Proceed with B1 on `living-city-b1-window-lights`, starting with static deterministic far-layer windows only. Do not add blinking, antennas, tanks, weather, districts, or sprite assets in the same review. Prove one living-city detail class, checkpoint it, then stack the next class.