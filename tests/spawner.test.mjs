import test from "node:test";
import assert from "node:assert/strict";

import { GAME, OBSTACLE, SPAWN } from "../src/core/constants.js";
import { Spawner } from "../src/systems/spawner.js";

class StubRng {
  constructor() {
    this._n = 0;
  }

  range(min, max) {
    const seq = [0.5, 0.1, 0.9, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6];
    const t = seq[this._n % seq.length];
    this._n++;
    return min + (max - min) * t;
  }
}

class StubDifficulty {
  constructor() {
    this.spawnInterval = 1.2;
    this.gap = 220;
    this.speed = 240;
  }
  reset() {}
  update() {}
}

test("spawner keeps top and bottom bounds legal", () => {
  const spawner = new Spawner(new StubRng(), new StubDifficulty());

  for (let i = 0; i < 40; i++) {
    spawner.spawnOne();
  }

  for (const o of spawner.active) {
    assert.ok(o.topH >= OBSTACLE.MIN_TOP);
    assert.ok(o.topH <= GAME.BASE_HEIGHT - OBSTACLE.MIN_BOTTOM - o.gap);

    const gapBottom = o.topH + o.gap;
    assert.ok(gapBottom <= GAME.BASE_HEIGHT - OBSTACLE.MIN_BOTTOM + o.gap);
  }
});

test("opening obstacles are softened", () => {
  const spawner = new Spawner(new StubRng(), new StubDifficulty());

  spawner.spawnOne();
  const a = spawner.active[0];

  assert.ok(a.gap >= 220);
  assert.ok(a.speed <= 240);
});

test("center shift never exceeds configured cap after first spawn", () => {
  const spawner = new Spawner(new StubRng(), new StubDifficulty());
  const centers = [];

  for (let i = 0; i < 20; i++) {
    spawner.spawnOne();
    centers.push(spawner.active[spawner.active.length - 1].getGapCenterY());
  }

  for (let i = 1; i < centers.length; i++) {
    const delta = Math.abs(centers[i] - centers[i - 1]);
    assert.ok(delta <= (SPAWN.MAX_CENTER_SHIFT_PX ?? 90) + 0.001);
  }
});