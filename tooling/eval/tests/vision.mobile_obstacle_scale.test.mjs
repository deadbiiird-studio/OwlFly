import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { GAME, OBSTACLE } from "../../../src/core/constants.js";
import { VISION_OBSTACLE_SCALE } from "../../../src/render/renderer.js";

const ROOT = process.cwd();
const renderer = fs.readFileSync(path.join(ROOT, "src/render/renderer.js"), "utf8");

function pngSize(rel) {
  const file = path.join(ROOT, rel);
  const b = fs.readFileSync(file);
  assert.equal(b.toString("ascii", 1, 4), "PNG", `${rel} is not a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function containSize({ boxW, boxH, imageW, imageH }) {
  const scale = Math.min(boxW / imageW, boxH / imageH);
  return { width: imageW * scale, height: imageH * scale };
}

test("vision mobile scale: renderer uses cloud scale constants", () => {
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.cloudMinHeight/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.cloudMaxHeight/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.cloudHeightFactor/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.cloudWidthFactor/);
});

test("vision mobile scale: renderer uses building scale constants", () => {
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.buildingGroundInset/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.buildingMinBoxHeight/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.buildingMaxBoxHeight/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.buildingHeightFactor/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.buildingHeightOffset/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.buildingMinBoxWidth/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.buildingMaxBoxWidth/);
  assert.match(renderer, /VISION_OBSTACLE_SCALE\.buildingWidthFactor/);
});

test("vision mobile scale: clouds occupy meaningful phone-height space", () => {
  const cloud = pngSize("web/assets/obstacles/clouds/cloud_1.png");
  const drawn = containSize({
    boxW: OBSTACLE.WIDTH * VISION_OBSTACLE_SCALE.cloudWidthFactor,
    boxH: VISION_OBSTACLE_SCALE.cloudMinHeight,
    imageW: cloud.width,
    imageH: cloud.height,
  });

  assert.ok(
    drawn.height >= GAME.BASE_HEIGHT * 0.28,
    `cloud visual height ${drawn.height.toFixed(1)}px should cover at least 28% of the base phone height`
  );
});

test("vision mobile scale: buildings read as tall foreground hazards", () => {
  const building = pngSize("web/assets/obstacles/buildings/building_01.png");
  const drawn = containSize({
    boxW: VISION_OBSTACLE_SCALE.buildingMinBoxWidth,
    boxH: VISION_OBSTACLE_SCALE.buildingMinBoxHeight,
    imageW: building.width,
    imageH: building.height,
  });

  assert.ok(
    drawn.height >= GAME.BASE_HEIGHT * 0.5,
    `building visual height ${drawn.height.toFixed(1)}px should cover at least 50% of the base phone height`
  );
});

test("vision mobile scale: building sprites are bottom-anchored after contain scaling", () => {
  assert.match(
    renderer,
    /drawImageContainBottom\(ctx, frame, \{ x, y, w: spriteW, h: spriteH \}\);/,
    "building image should be bottom-contained so the visible sprite reaches the ground anchor"
  );
});

test("vision mobile scale: drawImageContainBottom helper exists", () => {
  assert.match(
    renderer,
    /function drawImageContainBottom\(ctx, img, bounds\)/,
    "renderer must define the helper used by bottom building hazards"
  );
});
