import { GAME, CACTUS } from "../../src/core/constants.js";

export function getNextObstacle(spawner, owlX) {
  let best = null;
  for (const o of spawner.active) {
    if (!o.active) continue;
    if (o.x + CACTUS.WIDTH < owlX - 5) continue;
    if (!best || o.x < best.x) best = o;
  }
  return best;
}

function rnd(ctx, a, b) {
  const r = ctx?.rng;
  if (r && typeof r.range === "function") return r.range(a, b);
  return a + Math.random() * (b - a);
}

export function strategies() {
  // Human-ish with latency + occasional mistake, implemented with closure state
  const humanish_lag = (() => {
    let queued = false;
    let delay = 0;
    let cooldown = 0;

    return (ctx) => {
      const { owl, spawner, dt = 1 / 60 } = ctx;

      if (cooldown > 0) cooldown -= dt;

      // If we already decided to flap, wait out the reaction delay
      if (queued) {
        delay -= dt;
        if (delay <= 0 && cooldown <= 0) {
          queued = false;
          cooldown = 0.095; // ~6 frames lockout
          return true;
        }
        return false;
      }

      const next = getNextObstacle(spawner, owl.x);

      let targetY = GAME.BASE_HEIGHT * 0.45;
      if (next) targetY = next.getGapCenterY() - 4;

      // Slightly larger deadband than center_hold
      const band = 18 + rnd(ctx, -2, 3);

      // avoid double-flap while already rising fast
      const risingFast = owl.vy < -240;

      const wantsFlap = !risingFast && owl.y > targetY + band;

      if (wantsFlap && cooldown <= 0) {
        // chance to miss the input (human error)
        const miss = rnd(ctx, 0, 1) < 0.08;
        if (miss) return false;

        queued = true;
        delay = rnd(ctx, 0.04, 0.09); // ~2–5 frames reaction latency
      }

      return false;
    };
  })();

  return {
    // Deterministic controller: good for regression/smoke
    center_hold: (ctx) => {
      const { owl, spawner } = ctx;
      const next = getNextObstacle(spawner, owl.x);

      let targetY = GAME.BASE_HEIGHT * 0.45;
      if (next) targetY = next.getGapCenterY() - 6;

      const band = 14;
      const risingFast = owl.vy < -260;

      if (!risingFast && owl.y > targetY + band) return true;
      return false;
    },

    // Slightly noisy but still very strong
    humanish: (ctx) => {
      const { owl, spawner } = ctx;
      const next = getNextObstacle(spawner, owl.x);

      let targetY = GAME.BASE_HEIGHT * 0.45;
      if (next) targetY = next.getGapCenterY() - 2;

      const band = 16 + rnd(ctx, -2, 3);
      const risingFast = owl.vy < -240;

      if (!risingFast && owl.y > targetY + band) return true;
      return false;
    },

    // ✅ recommended for gameplay-quality testing
    humanish_lag,

    // Stress: aims higher (finds ceiling squeeze issues)
    high_bias: (ctx) => {
      const { owl, spawner } = ctx;
      const next = getNextObstacle(spawner, owl.x);

      let targetY = GAME.BASE_HEIGHT * 0.4;
      if (next) targetY = next.getGapCenterY() - 18;

      const band = 12;
      const risingFast = owl.vy < -280;

      if (!risingFast && owl.y > targetY + band) return true;
      return false;
    },
  };
}