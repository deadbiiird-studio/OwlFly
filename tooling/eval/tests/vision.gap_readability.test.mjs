import test from "node:test";
import assert from "node:assert/strict";
import { GAME, OBSTACLE, OWL, SPAWN } from "../../../src/core/constants.js";
import { ObstaclePair } from "../../../src/engine/entities/obstaclePair.js";

test("vision gaps: minimum gap supports larger skyline/cloud readability", () => {
  assert.ok(
    OBSTACLE.MIN_GAP >= Math.round(OWL.RENDER_W * 3.2),
    `minimum gap ${OBSTACLE.MIN_GAP}px is too tight for owl render width ${OWL.RENDER_W}px`
  );

  assert.ok(
    OBSTACLE.MAX_GAP >= OBSTACLE.MIN_GAP + 70,
    "gap range should leave enough tuning room between minimum and maximum"
  );
});

test("vision gaps: enlarged gap still leaves safe top and bottom margins", () => {
  const pair = new ObstaclePair();

  pair.spawn({
    x: SPAWN.SPAWN_X ?? GAME.BASE_WIDTH + 40,
    topH: 220,
    gap: OBSTACLE.MIN_GAP,
    speed: OBSTACLE.BASE_SPEED,
  });

  assert.ok(pair.gap >= OBSTACLE.MIN_GAP, "spawned gap fell below minimum");
  assert.ok(pair.gap <= OBSTACLE.MAX_GAP, "spawned gap exceeded maximum readable range");
  assert.ok(pair.topH >= OBSTACLE.MIN_TOP, "top margin became unsafe");

  const bottomClearance = GAME.BASE_HEIGHT - (pair.topH + pair.gap);
  assert.ok(
    bottomClearance >= OBSTACLE.MIN_BOTTOM,
    `bottom clearance ${bottomClearance}px fell below minimum ${OBSTACLE.MIN_BOTTOM}px`
  );
});