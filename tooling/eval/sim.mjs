import { WORLD, OWL, GAME } from "../../src/core/constants.js";
import { RNG } from "../../src/core/rng.js";
import { Difficulty } from "../../src/engine/difficulty.js";
import { circleAabbIntersect } from "../../src/engine/collision.js";
import { Spawner } from "../../src/systems/spawner.js";
import { makeBot, makeController } from "./bots.mjs";

const GOLDEN_SEEDS = [101, 602, 1406, 184203, 999991];

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

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * p))
  );
  return sorted[idx];
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round(n, places = 3) {
  const m = 10 ** places;
  return Math.round(n * m) / m;
}

function makeOwlState() {
  return {
    x: OWL.X,
    y: GAME.BASE_HEIGHT * 0.5,
    vy: 0,
    radius: OWL.RADIUS * (OWL.HIT_RADIUS_SCALE ?? 1),
  };
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

function summarizeRun({
  seed,
  bot,
  score,
  elapsed,
  death,
  gapCenters,
  gapSizes,
}) {
  const shifts = [];
  for (let i = 1; i < gapCenters.length; i++) {
    shifts.push(Math.abs(gapCenters[i] - gapCenters[i - 1]));
  }

  return {
    seed,
    bot,
    score,
    durationSec: round(elapsed, 3),
    death,
    spawns: gapCenters.length,
    gapAvg: round(mean(gapSizes), 3),
    gapMin: gapSizes.length ? Math.min(...gapSizes) : 0,
    gapMax: gapSizes.length ? Math.max(...gapSizes) : 0,
    centerShiftP50: round(percentile(shifts, 0.5), 3),
    centerShiftP95: round(percentile(shifts, 0.95), 3),
    centerShiftMax: shifts.length ? Math.max(...shifts) : 0,
  };
}

function runOne(seed, options) {
  const spawnerRng = new RNG(seed);
  const controllerRng = new RNG(seed ^ 0x9e3779b9);

  const difficulty = new Difficulty();
  const spawner = new Spawner(spawnerRng, difficulty);
  const owl = makeOwlState();
  const bot = makeBot(options.bot);
  const controller = makeController(bot, controllerRng);

  if (typeof difficulty.reset === "function") difficulty.reset();
  if (typeof spawner.reset === "function") spawner.reset();

  const dt = 1 / 60;
  const maxTime = options.time;
  const gapCenters = [];
  const gapSizes = [];

  let lastSpawnCount = 0;
  let score = 0;
  let elapsed = 0;
  let death = "timeout";

  while (elapsed < maxTime) {
    if (typeof difficulty.update === "function") difficulty.update(dt);
    spawner.update(dt);

    if ((spawner._spawnCount ?? 0) > lastSpawnCount) {
      for (let i = lastSpawnCount; i < (spawner._spawnCount ?? 0); i++) {
        const newest = spawner.active[spawner.active.length - 1];
        if (newest) {
          gapCenters.push(newest.getGapCenterY());
          gapSizes.push(newest.gap);
        }
      }
      lastSpawnCount = spawner._spawnCount ?? lastSpawnCount;
    }

    if (controller.shouldFlap({ owl, spawner, difficulty, elapsed })) {
      flap(owl);
    }

    stepOwl(owl, dt);

    const c = circleFor(owl);

    if (c.cy - c.r < 0) {
      death = "top_bound";
      break;
    }

    if (c.cy + c.r > GAME.BASE_HEIGHT) {
      death = "bottom_bound";
      break;
    }

    for (const o of spawner.active) {
      if (!o.active) continue;

      const rects = o.getRects();
      const hitTop = circleAabbIntersect(c.cx, c.cy, c.r, rects.top);
      const hitBottom = circleAabbIntersect(c.cx, c.cy, c.r, rects.bottom);

      if (hitTop || hitBottom) {
        death = hitTop ? "top_obstacle" : "bottom_obstacle";
        elapsed += dt;

        return summarizeRun({
          seed,
          bot: bot.name,
          score,
          elapsed,
          death,
          gapCenters,
          gapSizes,
        });
      }

      if (!o.passed && o.x + rects.top.w < c.cx - c.r) {
        o.passed = true;
        score += 1;
      }
    }

    elapsed += dt;
  }

  return summarizeRun({
    seed,
    bot: bot.name,
    score,
    elapsed,
    death,
    gapCenters,
    gapSizes,
  });
}

function aggregate(runs, options) {
  const scores = runs.map((r) => r.score);
  const durations = runs.map((r) => r.durationSec);
  const shiftP95s = runs.map((r) => r.centerShiftP95);
  const gapMins = runs.map((r) => r.gapMin);
  const deathCounts = {};

  for (const r of runs) {
    deathCounts[r.death] = (deathCounts[r.death] ?? 0) + 1;
  }

  const failingSeeds = runs
    .filter((r) => r.death !== "timeout")
    .map((r) => ({
      seed: r.seed,
      death: r.death,
      score: r.score,
      durationSec: r.durationSec,
    }));

  return {
    meta: {
      seeds: options.seedList,
      runs: runs.length,
      timeLimitSec: options.time,
      bot: options.bot,
    },
    summary: {
      scoreAvg: round(mean(scores), 3),
      scoreP50: percentile(scores, 0.5),
      scoreP90: percentile(scores, 0.9),
      durationAvg: round(mean(durations), 3),
      centerShiftP95Avg: round(mean(shiftP95s), 3),
      gapMinOverall: gapMins.length ? Math.min(...gapMins) : 0,
      failures: failingSeeds.length,
      deaths: deathCounts,
    },
    failingSeeds,
    runs,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const seeds = Number(args.seeds ?? 50);
  const time = Number(args.time ?? 60);
  const bot = String(args.bot ?? "humanish_lag");
  const seedStart = Number(args.seedStart ?? 1000);
  const useGolden = !!args.golden;
  const jsonOnly = !!args.json;

  const seedList = useGolden
    ? GOLDEN_SEEDS
    : Array.from({ length: seeds }, (_, i) => seedStart + i);

  const options = { time, bot, seedList };
  const runs = seedList.map((seed) => runOne(seed, { time, bot }));
  const report = aggregate(runs, options);

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(
    `OwlFly sim — bot=${report.meta.bot} runs=${report.meta.runs} time=${report.meta.timeLimitSec}s`
  );
  console.log(
    `score avg=${report.summary.scoreAvg} p50=${report.summary.scoreP50} p90=${report.summary.scoreP90}`
  );
  console.log(
    `duration avg=${report.summary.durationAvg}s shift p95 avg=${report.summary.centerShiftP95Avg}`
  );
  console.log(
    `gapMin overall=${report.summary.gapMinOverall} failures=${report.summary.failures}`
  );
  console.log(`deaths=${JSON.stringify(report.summary.deaths)}`);

  if (report.failingSeeds.length) {
    console.log("failingSeeds=");
    console.log(JSON.stringify(report.failingSeeds, null, 2));
  }

  console.log(JSON.stringify(report, null, 2));
}

main();