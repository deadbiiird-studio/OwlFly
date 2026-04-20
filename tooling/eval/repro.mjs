import { WORLD, OWL, GAME } from "../../src/core/constants.js";
import { RNG } from "../../src/core/rng.js";
import { Difficulty } from "../../src/engine/difficulty.js";
import { circleAabbIntersect } from "../../src/engine/collision.js";
import { Spawner } from "../../src/systems/spawner.js";
import { makeBot, makeController } from "./bots.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function flap(owl) {
  owl.vy = -WORLD.JUMP_IMPULSE;
}

function stepOwl(owl, dt) {
  owl.vy += WORLD.GRAVITY * dt;
  owl.vy = Math.min(owl.vy, WORLD.MAX_FALL_SPEED);
  owl.y += owl.vy * dt;
}

function circleFor(owl) {
  return { cx: owl.x, cy: owl.y, r: owl.radius };
}

function main() {
  const args = parseArgs(process.argv);
  const seed = Number(args.seed ?? 101);
  const time = Number(args.time ?? 30);
  const botName = String(args.bot ?? "humanish_lag");

  const spawnerRng = new RNG(seed);
  const controllerRng = new RNG(seed ^ 0x9e3779b9);

  const difficulty = new Difficulty();
  const spawner = new Spawner(spawnerRng, difficulty);
  const bot = makeBot(botName);
  const controller = makeController(bot, controllerRng);

  const owl = {
    x: OWL.X,
    y: GAME.BASE_HEIGHT * 0.5,
    vy: 0,
    radius: OWL.RADIUS * (OWL.HIT_RADIUS_SCALE ?? 1),
  };

  if (typeof difficulty.reset === "function") difficulty.reset();
  if (typeof spawner.reset === "function") spawner.reset();

  const dt = 1 / 60;
  let elapsed = 0;
  let score = 0;

  while (elapsed < time) {
    if (typeof difficulty.update === "function") difficulty.update(dt);
    spawner.update(dt);

    if (controller.shouldFlap({ owl, spawner, difficulty, elapsed })) {
      flap(owl);
      console.log(
        `[${elapsed.toFixed(3)}] flap -> y=${owl.y.toFixed(2)} vy=${owl.vy.toFixed(2)} bot=${bot.name}`
      );
    }

    stepOwl(owl, dt);
    const c = circleFor(owl);

    const ceilingClearance = c.cy - c.r;

    if (c.cy - c.r < 0 || c.cy + c.r > GAME.BASE_HEIGHT) {
      console.log(
        `[${elapsed.toFixed(3)}] death=bound score=${score} ceilingClearance=${ceilingClearance.toFixed(2)}`
      );
      console.log("owl", c);
      return;
    }

    for (const o of spawner.active) {
      if (!o.active) continue;

      const rects = o.getRects();
      const hitTop = circleAabbIntersect(c.cx, c.cy, c.r, rects.top);
      const hitBottom = circleAabbIntersect(c.cx, c.cy, c.r, rects.bottom);

      if (hitTop || hitBottom) {
        const cloudClearance = rects.top.y - (c.cy - c.r);
        const topLipOverlap = (rects.top.y + rects.top.h) - (c.cy - c.r);

        console.log(
          `[${elapsed.toFixed(3)}] death=${hitTop ? "top_obstacle" : "bottom_obstacle"} score=${score}`
        );
        console.log("owl", c);
        console.log("topRect", rects.top);
        console.log("bottomRect", rects.bottom);
        console.log("gapCenter", o.getGapCenterY());
        console.log("ceilingClearance", Number(ceilingClearance.toFixed(2)));
        console.log("cloudClearance", Number(cloudClearance.toFixed(2)));
        console.log("topLipOverlap", Number(topLipOverlap.toFixed(2)));

        if (typeof o.getVisualBounds === "function") {
          console.log("visual", o.getVisualBounds());
        }

        if (typeof o.getRenderHints === "function") {
          console.log("renderHints", o.getRenderHints());
        }

        return;
      }

      if (!o.passed && o.x + rects.top.w < c.cx - c.r) {
        o.passed = true;
        score += 1;
        console.log(
          `[${elapsed.toFixed(3)}] pass score=${score} gapCenter=${o.getGapCenterY().toFixed(2)} gap=${o.gap}`
        );
      }
    }

    elapsed += dt;
  }

  console.log(`timeout score=${score} after ${time}s`);
}

main();