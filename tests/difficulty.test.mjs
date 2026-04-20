import test from "node:test";
import assert from "node:assert/strict";
import { Difficulty } from "../../../src/engine/difficulty.js";
import { CACTUS, SPAWN } from "../../../src/core/constants.js";

test("Difficulty ramps and respects bounds", () => {
  const d = new Difficulty();
  const startSpeed = d.speed;
  const startGap = d.gap;
  const startInterval = d.spawnInterval;

  for (let i = 0; i < 60 * 60; i++) d.update(1 / 60);

  assert.ok(d.speed >= startSpeed && d.speed <= CACTUS.SPEED_MAX);
  assert.ok(d.gap <= startGap && d.gap >= CACTUS.MIN_GAP);
  assert.ok(d.spawnInterval <= startInterval && d.spawnInterval >= SPAWN.MIN_INTERVAL);
});