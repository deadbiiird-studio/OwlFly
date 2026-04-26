import test from "node:test";
import assert from "node:assert/strict";
import { GAME, OBSTACLE, SPAWN } from "../../../src/core/constants.js";
import { ObstaclePair } from "../../../src/engine/entities/obstaclePair.js";
import { Difficulty } from "../../../src/engine/difficulty.js";
import { Spawner } from "../../../src/systems/spawner.js";
import { RNG } from "../../../src/core/rng.js";

function spawnPair(overrides = {}) {
  const o = new ObstaclePair();
  o.spawn({
    x: SPAWN.SPAWN_X ?? GAME.BASE_WIDTH + 40,
    topH: 220,
    gap: Math.round((OBSTACLE.MIN_GAP + OBSTACLE.MAX_GAP) / 2),
    speed: OBSTACLE.BASE_SPEED,
    ...overrides,
  });
  return o;
}

test("vision obstacles: bottom hazard hitbox remains anchored to the bottom of the world", () => {
  const cases = [
    { topH: OBSTACLE.MIN_TOP, gap: OBSTACLE.MIN_GAP },
    { topH: 220, gap: 210 },
    { topH: GAME.BASE_HEIGHT - OBSTACLE.MIN_BOTTOM - OBSTACLE.MIN_GAP, gap: OBSTACLE.MIN_GAP },
  ];

  for (const c of cases) {
    const o = spawnPair(c);
    const { bottom } = o.getRects();
    assert.equal(bottom.y + bottom.h, GAME.BASE_HEIGHT, `bottom hitbox floated for ${JSON.stringify(c)}`);
    assert.ok(bottom.h > 0, "bottom hitbox must have height");
  }
});

test("vision obstacles: render hints keep buildings ground-anchored", () => {
  const o = spawnPair({ topH: 260, gap: 220 });
  const hints = o.getRenderHints();

  assert.ok(Number.isFinite(hints.groundAnchorY), "missing groundAnchorY render hint");
  assert.ok(Number.isFinite(hints.buildingTopY), "missing buildingTopY render hint");
  assert.ok(Number.isFinite(hints.buildingHeight), "missing buildingHeight render hint");
  assert.equal(
    Math.round(hints.buildingTopY + hints.buildingHeight),
    Math.round(hints.groundAnchorY),
    "building visual should terminate at the ground anchor"
  );
});

test("vision obstacles: readable gap stays inside world safety margins after visual growth", () => {
  for (const topH of [OBSTACLE.MIN_TOP, 180, 260, 340]) {
    const o = spawnPair({ topH, gap: OBSTACLE.MIN_GAP });
    assert.ok(o.gap >= OBSTACLE.MIN_GAP, "gap below minimum");
    assert.ok(o.gap <= OBSTACLE.MAX_GAP, "gap above maximum readable range");
    assert.ok(o.topH >= OBSTACLE.MIN_TOP, "top gap clipped past minimum top margin");
    assert.ok(
      GAME.BASE_HEIGHT - (o.topH + o.gap) >= OBSTACLE.MIN_BOTTOM,
      "bottom clearance below minimum bottom margin"
    );
  }
});

test("vision obstacles: spawner center movement stays readable between consecutive pairs", () => {
  const spawner = new Spawner(new RNG(42), new Difficulty());
  const centers = [];

  for (let i = 0; i < 40; i++) {
    spawner.spawnOne();
    centers.push(spawner.active.at(-1).getGapCenterY());
  }

  for (let i = 1; i < centers.length; i++) {
    const jump = Math.abs(centers[i] - centers[i - 1]);
    assert.ok(
      jump <= (SPAWN.MAX_CENTER_SHIFT_PX ?? 90) + 2,
      `gap center jumped ${jump.toFixed(1)}px between pair ${i} and ${i + 1}`
    );
  }
});
