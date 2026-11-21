# OwlFly SkyWeave — authored obstacle selection (candidate)

Status: **draft PR #38; not merged or published**. Source must pass quality gates and a real-device flight review before promotion. This is not a second runtime physics or collision authority.

## Pick sprites individually

Edit `src/systems/formationComposer.js`, in `AUTHORED_OPENING`. Each object represents exactly **one obstacle encounter**, in order:

```js
{ intent: "climb", building: { sprite: 3, size: "large" }, cloud: { sprite: 5, size: "tiny" } },
```

- Building sprite numbers: **1–13**, corresponding to `web/assets/obstacles/buildings/building_01.png` ... `building_13.png`.
- Cloud sprite numbers: **1–6**, corresponding to `web/assets/obstacles/clouds/cloud_1.png` ... `cloud_6.png`.
- Size names: **tiny**, **small**, **medium**, **large**, **massive**.
- `intent`: editable description of the flight decision being taught. It does **not** secretly change physics.
- To author another encounter, add one line to `AUTHORED_OPENING` with a new pair. Do not invent more assets first.

Currently the first **eight** encounters are individually authored to show unmistakable sizes early. The initial four still receive the existing softened opening gap/speed settings.

## How later challenges are chosen

`composeFormation({ seed, ordinal, previous, towerHeight })` returns one descriptor with separate building and cloud sprite IDs, size indices, intent, and a stable encounter ID. It uses a deterministic integer hash of seed + obstacle number, never `Math.random` or extra draws from the gameplay RNG.

After the authored opening, it chooses among bounded flight-decision patterns:

- **climb** — big roof / smaller cloud
- **duck** — low roof / large cloud
- **thread** — two large hazards
- **read** — balanced pair
- **recover** — lower pressure
- **crest**, **downshift** — contrasting silhouettes

A recovery phrase is deliberately scheduled every 12th encounter. The challenge mix gets denser in later tiers. Normal gap centers, widths, speeds, collision, and score are still owned by the existing gameplay systems.

## Visual and collision contract

- `src/engine/obstacleVisualFit.js` is the single source of five size classes and cloud image boxes.
- `src/render/renderer.js` draws exactly those image boxes (1 cloud for tiny/small, 2 for medium, 3 for large/massive).
- `src/engine/entities/obstaclePair.js` builds collision bands from those same boxes and the existing sprite alpha profiles.
- Tiny clouds **do not** preserve a hidden full-height ceiling hitbox.
- Buildings use existing alpha-aware rooftop bands. Tall special rooftops still start at obstacle **16**; those open-sky encounters have **no cloud and no top cloud collision**.
- The tallest special rooftops use a bounded anticipated flight-lane target. No invulnerability, collision relaxation, or one-feature physics rewrite.

## Reproducibility

```bash
npm ci
npm run build
npm run test
npm run eval:gate
npm run eval:visual
```

The workflow also checks that committed `web/game.js` exactly matches a fresh build.

Draft PR #38 gameplay CI [run 44880561404](https://github.com/deadbiiird-studio/OwlFly/actions/runs/44880561404) at commit `ce24f472755fbbec91b0993be82deb2cb7d30d86` reported:
- **94 unit/quality tests passing**, including measured real first-eight obstacle silhouette contrast
- **40-seed** fairness gate PASS (median score 6; mean score 10.175; mean survival 14.908 seconds)
- Minimum gap 207px (floor 196px), center shift p95 average 38.813px (ceiling 95px)
- World-bound deaths 2/40, **exactly** at the allowed limit of 5%; treat this as a risk to validate, not proof of safety across devices
- Visual readability PASS

Note: the test run is based on a simulated controller. It does not prove a human can perceive a cloud/roof silhouette at A03s screen size.

## Promotion and rollback

1. **Do not merge** until a phone player can distinguish tiny/large clouds and building heights in the first eight obstacles, read passages, and experience no ghost hits. Test both Samsung A03s and A156E when possible.
2. Validate countdown audio, tap/hold controls, and restart on actual devices; this feature must not regress them.
3. Once approved, merge the PR and let website CI verify actual deployed files. A Google Play closed-testing revision would require a separate explicit decision and a new version code; **v4 stays untouched** here.
4. If tests or feel fail, leave PR #38 draft, edit its branch, or close it. Production stays at its last tested baseline.

## Important boundary

SkyWeave is authored code in a **public GitHub repository**. The design can be proprietary to OwlFly in the normal sense of authorship, but the implementation is publicly inspectable and is not a trade secret as published.
