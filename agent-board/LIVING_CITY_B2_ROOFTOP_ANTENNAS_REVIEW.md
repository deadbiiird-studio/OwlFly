# Living City B2 — Rooftop Antennas Review

## Status
**95/100 — IMPLEMENTED CANDIDATE. TARGET-MACHINE + HUMAN GATES PENDING.**

Base checkpoint: B1 merged `main` @ `50a88d5c28bc007a37cb11f47e25eddd7146f737`.

## Goal
Add the first rooftop-life vocabulary class without increasing gameplay ambiguity or converting the distant city into clutter.

## Implementation
`CITY_DETAIL_CONTRACT.farAntennas` adds one deterministic, static, silhouette-colored rooftop prop class:
- far layer only;
- maximum one antenna per eligible building;
- approximately 34% deterministic occupancy;
- 4–7px mast height;
- 1px mast with a 3px crossbar;
- anchor stays near the center of the roof;
- explicit refusal if a future motif edit would put the antenna above the protected y=500 flight-field boundary;
- no animation, blinking, glow, collision, randomness, assets, or mid/near detail.

The renderer draws antenna silhouette geometry before B1 warm windows so prop and occupancy semantics remain distinct.

## Hard preservation rules
- A3 12-beat motif unchanged;
- B1 window placement/contract unchanged;
- far/mid/near speed, alpha and base geometry unchanged;
- no antenna can enter the protected upper flight field;
- no prop can become collidable or resemble a route opening/reward;
- reduced motion must show the identical static antenna identity.

## Regression coverage
`vision.living_city_rooftop_antennas.test.mjs` verifies sparse density, deterministic far-only ownership, roof attachment, protected-field clearance, parallax-stable local identity, B1 independence, sealed layer values, and silhouette-before-window renderer order.

## Human gate
Approve only if antennas add subtle rooftop life and remain clearly distant scenery. Reject if they look like spikes/hazards, create a picket-fence rhythm, or make the skyline feel busier without feeling more alive.

## Verification
Run `npm run quality`, then several normal/reduced-motion runs in `npm run dev` with attention to skyline density rather than individual antennas.

## Rollback
Discard `living-city-b2-rooftop-antennas`; B1 remains sealed on `main` @ `50a88d5`.
