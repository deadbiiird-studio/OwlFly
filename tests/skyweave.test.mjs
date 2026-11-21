import test from "node:test";
import assert from "node:assert/strict";

import { GAME, OBSTACLE, SPAWN } from "../src/core/constants.js";
import { RNG } from "../src/core/rng.js";
import { ObstaclePair } from "../src/engine/entities/obstaclePair.js";
import {
  BUILDING_SIZE_VARIANTS,
  CLOUD_SIZE_VARIANTS,
  OBSTACLE_VISUAL_SCALE,
  getCloudSpriteLayout,
} from "../src/engine/obstacleVisualFit.js";
import { Spawner } from "../src/systems/spawner.js";
import {
  AUTHORED_OPENING,
  SKYWEAVE_SIZES,
  composeFormation,
} from "../src/systems/formationComposer.js";

const noDifficultyChange = {
  spawnInterval: SPAWN.BASE_INTERVAL,
  speed: OBSTACLE.BASE_SPEED,
  gap: 232,
};

test("SkyWeave lets authors pick one building and one cloud per opening encounter", () => {
  assert.ok(AUTHORED_OPENING.length >= 8);
  const choices = AUTHORED_OPENING.map((entry, i) => composeFormation({
    seed: 104,
    ordinal: i + 1,
  }));

  assert.ok(new Set(choices.map((choice) => choice.buildingSizeIndex)).size >= 4);
  assert.ok(new Set(choices.map((choice) => choice.cloudSizeIndex)).size >= 4);
  assert.ok(new Set(choices.map((choice) => choice.buildingSpriteIndex)).size >= 7);
  assert.ok(new Set(choices.map((choice) => choice.cloudSpriteIndex)).size >= 4);
  assert.equal(SKYWEAVE_SIZES.length, 5);

  for (const [i, choice] of choices.entries()) {
    assert.equal(choice.ordinal, i + 1);
    assert.equal(choice.kind, "cloud-building");
    assert.equal(choice.buildingSpriteIndex, AUTHORED_OPENING[i].building.sprite - 1);
    assert.equal(choice.cloudSpriteIndex, AUTHORED_OPENING[i].cloud.sprite - 1);
  }
});

test("SkyWeave repeats the same sequence for the same seed and avoids identical adjacent generated pairs", () => {
  const generate = (seed) => {
    const choices = [];
    for (let ordinal = 1; ordinal <= 36; ordinal++) {
      choices.push(composeFormation({
        seed,
        ordinal,
        previous: choices.at(-1) ?? null,
        towerHeight: ordinal === SPAWN.TOWER_FIRST_SPAWN ? 290 : null,
      }));
    }
    return choices;
  };

  assert.deepEqual(generate(101), generate(101));
  assert.notDeepEqual(generate(101).slice(8), generate(202).slice(8));
  const choices = generate(101);
  for (let i = AUTHORED_OPENING.length; i < choices.length; i++) {
    const current = choices[i];
    const prior = choices[i - 1];
    assert.ok(current.buildingSpriteIndex !== prior.buildingSpriteIndex ||
      current.buildingSizeIndex !== prior.buildingSizeIndex);
    if (current.kind === "open-sky") {
      assert.equal(current.cloudSpriteIndex, null);
      assert.equal(current.cloudSizeIndex, null);
    }
  }
});

test("real cloud draw boxes vary from tiny single sprites to massive clusters", () => {
  const bounds = { x: 520, y: 0, w: OBSTACLE.WIDTH, h: 220 };
  const layouts = CLOUD_SIZE_VARIANTS.map((variant) =>
    getCloudSpriteLayout(bounds, variant, OBSTACLE_VISUAL_SCALE));

  assert.deepEqual(layouts.map(({ boxes }) => boxes.length), [1, 1, 2, 3, 3]);
  assert.ok(layouts[4].baseW >= layouts[0].baseW * 3);
  assert.ok(layouts[4].clusterH >= layouts[0].clusterH * 2.5);
  for (const layout of layouts) {
    for (const box of layout.boxes) {
      assert.ok(box.y >= bounds.y);
      assert.ok(box.y + box.h <= bounds.y + bounds.h + 0.001);
    }
  }
  assert.ok(BUILDING_SIZE_VARIANTS[4].widthScale > 2 * BUILDING_SIZE_VARIANTS[0].widthScale);
});

test("selected sprite IDs and cloud sizes drive authoritative geometry without ghost ceiling collision", () => {
  const sizes = CLOUD_SIZE_VARIANTS.map((_, cloudSizeIndex) => {
    const obstacle = new ObstaclePair();
    const formation = {
      buildingSpriteIndex: 3,
      buildingSizeIndex: cloudSizeIndex,
      cloudSpriteIndex: 2,
      cloudSizeIndex,
    };
    obstacle.spawn({
      x: 520,
      topH: 220,
      gap: 232,
      speed: OBSTACLE.BASE_SPEED,
      formation,
    });
    const rects = obstacle.getRects();
    const visual = obstacle.getVisualBounds();
    assert.equal(rects.top.spriteIndex, 2);
    assert.equal(rects.bottom.spriteIndex, 3);
    assert.ok(rects.top.bands.length > 0);
    assert.ok(rects.bottom.bands.length > 0);

    const cloudLayout = getCloudSpriteLayout(
      visual.top,
      obstacle._cloudVisualVariant,
      OBSTACLE_VISUAL_SCALE
    );
    for (const band of rects.top.bands) {
      assert.ok(band.y > 0, "a separated cloud must not create a ghost ceiling collision");
      assert.ok(band.y + band.h <= visual.top.y + visual.top.h + 0.001);
      assert.ok(cloudLayout.boxes.some((box) =>
        band.x >= box.x - 0.001 &&
        band.x + band.w <= box.x + box.w + 0.001 &&
        band.y >= box.y - 0.001 &&
        band.y + band.h <= box.y + box.h + 0.001
      ), "each cloud collision band must belong to a visible sprite box");
    }
    assert.ok(rects.bottom.bands.every((band) =>
      band.y >= obstacle.topH + obstacle.gap - 80
    ), "building must retain its established gap-side collision reach");
    return cloudLayout;
  });

  assert.ok(sizes[0].boxes.length === 1 && sizes[4].boxes.length === 3);
});

test("seeded spawner uses SkyWeave without moving the legal gap corridor or tower schedule", () => {
  const generate = () => {
    const spawner = new Spawner(new RNG(1776), { ...noDifficultyChange });
    const result = [];
    for (let ordinal = 1; ordinal <= 30; ordinal++) {
      spawner.spawnOne();
      const o = spawner.active.at(-1);
      assert.equal(o.formation.ordinal, ordinal);
      assert.ok(o.gap >= OBSTACLE.MIN_GAP);
      assert.ok(o.getVisualBounds().bottom);
      result.push({
        ordinal,
        formation: o.formation,
        center: o.getGapCenterY(),
        tower: o.tower ? Math.round(GAME.BASE_HEIGHT - o.tower.roofY) : null,
      });
    }
    return result;
  };

  assert.deepEqual(generate(), generate());
  const run = generate();
  assert.ok(run.slice(0, SPAWN.TOWER_FIRST_SPAWN - 1).every((o) => o.tower === null));
  assert.equal(run[SPAWN.TOWER_FIRST_SPAWN - 1].tower, SPAWN.TOWER_HEIGHTS[0]);
  for (let i = 1; i < SPAWN.TOWER_FIRST_SPAWN - 1; i++) {
    assert.ok(
      Math.abs(run[i].center - run[i - 1].center) <= SPAWN.MAX_CENTER_SHIFT_PX + 0.001,
      "normal formations may not force a sudden center shift"
    );
  }
});

test("the first eight REAL obstacles expose visibly different rooftops and cloud spans", () => {
  const spawner = new Spawner(new RNG(109), { ...noDifficultyChange });
  const roofHeights = [];
  const cloudHeights = [];
  const cloudWidths = [];

  for (let i = 0; i < AUTHORED_OPENING.length; i++) {
    spawner.spawnOne();
    const obstacle = spawner.active.at(-1);
    const bands = obstacle.getRects();
    const roofY = Math.min(...bands.bottom.bands.map((band) => band.y));
    roofHeights.push(GAME.BASE_HEIGHT - roofY);

    const visual = obstacle.getVisualBounds();
    assert.ok(visual.top, "authored opening must pair visible cloud with building");
    const layout = getCloudSpriteLayout(visual.top, obstacle._cloudVisualVariant, OBSTACLE_VISUAL_SCALE);
    cloudHeights.push(layout.clusterH);
    cloudWidths.push(layout.baseW);
  }

  assert.ok(Math.max(...roofHeights) - Math.min(...roofHeights) >= 75,
    `first eight roof silhouettes should differ by at least 75px, got ${roofHeights}`);
  assert.ok(Math.max(...cloudHeights) >= 2 * Math.min(...cloudHeights),
    `first eight cloud heights should be dramatically different, got ${cloudHeights}`);
  assert.ok(Math.max(...cloudWidths) >= 2.5 * Math.min(...cloudWidths),
    `first eight cloud widths should be dramatically different, got ${cloudWidths}`);
});
