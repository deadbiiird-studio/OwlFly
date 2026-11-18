import test from "node:test";
import assert from "node:assert/strict";

import { GAME, OBSTACLE, OWL, SPAWN } from "../src/core/constants.js";
import { circleAabbIntersect } from "../src/engine/collision.js";
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

test("the tower stretch leaves open sky and has collision only along real rooftops", () => {
  const spawner = new Spawner(new StubRng(), new StubDifficulty());
  const start = SPAWN.TOWER_FIRST_SPAWN - 1;
  const finish = start + SPAWN.TOWER_HEIGHTS.length;
  for (let i = 0; i <= start + SPAWN.TOWER_REPEAT_INTERVAL; i++) {
    spawner.spawnOne();
  }

  assert.ok(spawner.active.slice(0, start).every((obstacle) => !obstacle.tower));
  assert.ok(spawner.active[finish].getVisualBounds().top);
  assert.ok(spawner.active[start + SPAWN.TOWER_REPEAT_INTERVAL].tower);

  const heights = spawner.active.slice(start, finish).map((obstacle) => {
    const { top, bottom } = obstacle.getRects();
    assert.equal(obstacle.getVisualBounds().top, null);
    assert.deepEqual(top.bands, []);
    assert.equal(circleAabbIntersect(top.x + top.w / 2, OWL.RADIUS, OWL.RADIUS, top), false);

    const roof = bottom.bands.reduce((highest, band) => band.y < highest.y ? band : highest);
    const roofCenter = roof.x + roof.w / 2;
    assert.equal(circleAabbIntersect(roofCenter, roof.y + OWL.RADIUS, OWL.RADIUS, bottom), true);
    assert.equal(circleAabbIntersect(roofCenter, roof.y - OWL.RADIUS - 1, OWL.RADIUS, bottom), false);
    return Math.round(GAME.BASE_HEIGHT - roof.y);
  });

  assert.deepEqual(heights, SPAWN.TOWER_HEIGHTS);
  assert.ok(Math.max(...heights) >= GAME.BASE_HEIGHT * 0.65);
  assert.ok(heights.at(-1) < heights[0]);
});

test("a pooled tower stays active while visible and restores its cloud on normal reuse", () => {
  const spawner = new Spawner(new StubRng(), new StubDifficulty());
  const end = SPAWN.TOWER_FIRST_SPAWN + SPAWN.TOWER_HEIGHTS.length - 1;
  for (let i = 0; i < end; i++) spawner.spawnOne();
  const tower = spawner.active.reduce((tallest, obstacle) => (
    obstacle.tower && (!tallest.tower || obstacle.tower.height > tallest.tower.height)
      ? obstacle
      : tallest
  ));

  tower.update((tower.x + OBSTACLE.WIDTH + 41) / tower.speed);
  assert.ok(tower.active);
  tower.update(2);
  assert.equal(tower.active, false);

  spawner.update(0);
  spawner.spawnOne();
  assert.equal(spawner.active.at(-1), tower);
  assert.equal(tower.tower, null);
  assert.ok(tower.getVisualBounds().top);
  assert.ok(tower.getRects().top.bands.length > 0);
});
