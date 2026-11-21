import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { GAME, OBSTACLE } from "../../../src/core/constants.js";
import { VISION_OBSTACLE_SCALE } from "../../../src/render/renderer.js";
import { BUILDING_SIZE_VARIANTS, CLOUD_SIZE_VARIANTS, getCloudSpriteLayout } from "../../../src/engine/obstacleVisualFit.js";

const ROOT = process.cwd();
const renderer = fs.readFileSync(
  path.join(ROOT, "src/render/renderer.js"),
  "utf8"
);

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

test("vision mobile scale: cloud sprites can be tiny and dramatically large", () => {
  const bounds = { x: 520, y: 0, w: OBSTACLE.WIDTH, h: 260 };
  const tiny = getCloudSpriteLayout(bounds, CLOUD_SIZE_VARIANTS[0], VISION_OBSTACLE_SCALE);
  const massive = getCloudSpriteLayout(bounds, CLOUD_SIZE_VARIANTS[4], VISION_OBSTACLE_SCALE);

  assert.equal(tiny.boxes.length, 1);
  assert.equal(massive.boxes.length, 3);
  assert.ok(massive.clusterH >= tiny.clusterH * 2.4);
  assert.ok(massive.baseW >= tiny.baseW * 3);

  for (let i = 1; i <= 6; i++) {
    const cloud = pngSize(`web/assets/obstacles/clouds/cloud_${i}.png`);
    const smallDrawn = containSize({
      boxW: tiny.boxes[0].w, boxH: tiny.boxes[0].h,
      imageW: cloud.width, imageH: cloud.height,
    });
    const largeDrawn = containSize({
      boxW: massive.boxes[0].w, boxH: massive.boxes[0].h,
      imageW: cloud.width, imageH: cloud.height,
    });
    assert.ok(smallDrawn.height < GAME.BASE_HEIGHT * 0.2, "tiny cloud must really be tiny");
    assert.ok(largeDrawn.height > smallDrawn.height * 2.4,
      "large cloud must be perceptibly bigger than tiny");
  }
});

test("vision mobile scale: buildings preserve a readable tall end and a clearly smaller end", () => {
  const boxWidth = (variant) => Math.max(
    VISION_OBSTACLE_SCALE.buildingMinBoxWidth,
    Math.min(VISION_OBSTACLE_SCALE.buildingMaxBoxWidth,
      OBSTACLE.WIDTH * VISION_OBSTACLE_SCALE.buildingWidthFactor * variant.widthScale)
  );
  const boxHeight = (variant) => Math.max(
    VISION_OBSTACLE_SCALE.buildingMinBoxHeight,
    Math.min(VISION_OBSTACLE_SCALE.buildingMaxBoxHeight,
      280 * variant.heightScale * VISION_OBSTACLE_SCALE.buildingHeightFactor +
      VISION_OBSTACLE_SCALE.buildingHeightOffset)
  );

  for (let i = 1; i <= 13; i++) {
    const padded = String(i).padStart(2, "0");
    const building = pngSize(`web/assets/obstacles/buildings/building_${padded}.png`);
    const tiny = containSize({
      boxW: boxWidth(BUILDING_SIZE_VARIANTS[0]),
      boxH: boxHeight(BUILDING_SIZE_VARIANTS[0]),
      imageW: building.width, imageH: building.height,
    });
    const massive = containSize({
      boxW: boxWidth(BUILDING_SIZE_VARIANTS[4]),
      boxH: boxHeight(BUILDING_SIZE_VARIANTS[4]),
      imageW: building.width, imageH: building.height,
    });
    assert.ok(massive.height >= GAME.BASE_HEIGHT * 0.5,
      "large building still needs to read as a foreground hazard");
    assert.ok(massive.height >= tiny.height * 2,
      "building size differences must be evident at phone scale");
  }
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
