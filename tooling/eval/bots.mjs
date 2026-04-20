import { GAME } from "../../src/core/constants.js";

export function makeBot(name = "humanish_lag") {
  switch (name) {
    case "center_hold":
      return {
        name,
        reactionFrames: 0,
        deadband: 10,
        panicBand: 22,
        flapVyThreshold: 30,
        targetBias: 0,
        jitterPx: 0,
        skipFlapChance: 0,
        extraFlapChance: 0,
        minFlapGapFrames: 0,
      };

    case "panic_tapper":
      return {
        name,
        reactionFrames: 3,
        deadband: 7,
        panicBand: 18,
        flapVyThreshold: -20,
        targetBias: 6,
        jitterPx: 10,
        skipFlapChance: 0.01,
        extraFlapChance: 0.08,
        minFlapGapFrames: 4,
      };

    case "late_human":
      return {
        name,
        reactionFrames: 8,
        deadband: 20,
        panicBand: 34,
        flapVyThreshold: 170,
        targetBias: -2,
        jitterPx: 10,
        skipFlapChance: 0.02,
        extraFlapChance: 0.0,
        minFlapGapFrames: 8,
      };

    case "sloppy_human":
      return {
        name,
        reactionFrames: 10,
        deadband: 24,
        panicBand: 38,
        flapVyThreshold: 220,
        targetBias: -6,
        jitterPx: 14,
        skipFlapChance: 0.05,
        extraFlapChance: 0.01,
        minFlapGapFrames: 10,
      };

    case "humanish_lag":
    default:
      return {
        name: "humanish_lag",
        reactionFrames: 5,
        deadband: 13,
        panicBand: 24,
        flapVyThreshold: 80,
        targetBias: 4,
        jitterPx: 6,
        skipFlapChance: 0.01,
        extraFlapChance: 0.01,
        minFlapGapFrames: 5,
      };
  }
}

export function nextObstacle(spawner, owlX) {
  let best = null;
  let bestDx = Infinity;

  for (const o of spawner.active) {
    if (!o.active) continue;
    const rects = o.getRects();
    const dx = rects.top.x + rects.top.w - owlX;
    if (dx >= -20 && dx < bestDx) {
      bestDx = dx;
      best = o;
    }
  }

  return best;
}

export function makeController(bot, rng) {
  const sampleQueue = [];
  let framesSinceFlap = 9999;

  return {
    shouldFlap(state) {
      framesSinceFlap++;

      const obs = nextObstacle(state.spawner, state.owl.x);
      const fallbackTarget = GAME.BASE_HEIGHT * 0.5;
      const gapTarget = obs ? obs.getGapCenterY() : fallbackTarget;

      const noisyTarget =
        gapTarget + bot.targetBias + rng.range(-bot.jitterPx, bot.jitterPx);

      sampleQueue.push(noisyTarget);

      const delay = Math.max(0, bot.reactionFrames | 0);
      const delayedTarget =
        sampleQueue.length > delay ? sampleQueue.shift() : noisyTarget;

      const y = state.owl.y;
      const vy = state.owl.vy;

      let wantsFlap = false;

      if (framesSinceFlap >= (bot.minFlapGapFrames ?? 0)) {
        if (y > delayedTarget + bot.panicBand) wantsFlap = true;
        if (y > delayedTarget + bot.deadband && vy > bot.flapVyThreshold) {
          wantsFlap = true;
        }
      }

      if (wantsFlap && rng.range(0, 1) < (bot.skipFlapChance ?? 0)) {
        return false;
      }

      if (!wantsFlap && rng.range(0, 1) < (bot.extraFlapChance ?? 0)) {
        wantsFlap = true;
      }

      if (wantsFlap) {
        framesSinceFlap = 0;
        return true;
      }

      return false;
    },
  };
}