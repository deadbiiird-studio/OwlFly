import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { GAME } from "../../../src/core/constants.js";
import { BUILDING_COLLISION_PROFILES } from "../../../src/engine/obstacleCollisionProfiles.js";
import {
  BUILDING_GAP_VISUAL_REACH,
  fitBuildingSpriteHeight,
  getBuildingProfileTopEdge,
} from "../../../src/engine/obstacleVisualFit.js";

const ROOT = process.cwd();
const GROUND_ANCHOR_Y = GAME.BASE_HEIGHT - 8;
const NOMINAL_SPRITE_HEIGHT = 760;
const SPRITE_WIDTH = 300;

function drawnImageHeight(frameIndex, boxHeight) {
  const profile = BUILDING_COLLISION_PROFILES[frameIndex];
  const widthLimited = SPRITE_WIDTH * (profile.height / profile.width);
  return Math.min(boxHeight, widthLimited);
}

test("quality visual gap: building profile edge never visually crowds past its collision reach", () => {
  const gapBottomSamples = [380, 468, 560, 660];

  for (let frameIndex = 0; frameIndex < BUILDING_COLLISION_PROFILES.length; frameIndex += 1) {
    for (const gapBottomY of gapBottomSamples) {
      const boxHeight = fitBuildingSpriteHeight({
        frameIndex,
        nominalHeight: NOMINAL_SPRITE_HEIGHT,
        spriteWidth: SPRITE_WIDTH,
        groundAnchorY: GROUND_ANCHOR_Y,
        gapBottomY,
      });
      const imageHeight = drawnImageHeight(frameIndex, boxHeight);
      const imageTopY = GROUND_ANCHOR_Y - imageHeight;
      const profileTopY = imageTopY + getBuildingProfileTopEdge(frameIndex) * imageHeight;
      const minimumAllowedTopY = gapBottomY - BUILDING_GAP_VISUAL_REACH;

      assert.ok(
        profileTopY >= minimumAllowedTopY - 0.75,
        `building ${frameIndex + 1} profile enters the playable corridor at gapBottom=${gapBottomY}: ${profileTopY} < ${minimumAllowedTopY}`
      );
    }
  }
});

test("quality visual gap: the tall tower case is reduced instead of faking an impossible opening", () => {
  const building05Index = 4;
  const fitted = fitBuildingSpriteHeight({
    frameIndex: building05Index,
    nominalHeight: NOMINAL_SPRITE_HEIGHT,
    spriteWidth: SPRITE_WIDTH,
    groundAnchorY: GROUND_ANCHOR_Y,
    gapBottomY: 660,
  });

  assert.ok(fitted < 300, `expected tall low-gap tower to shrink below 300px, got ${fitted}`);
  assert.ok(fitted > 180, `tower should still read as a foreground building, got ${fitted}`);
});

test("quality visual gap: high openings keep the existing building scale when already honest", () => {
  const fitted = fitBuildingSpriteHeight({
    frameIndex: 4,
    nominalHeight: 500,
    spriteWidth: SPRITE_WIDTH,
    groundAnchorY: GROUND_ANCHOR_Y,
    gapBottomY: 380,
  });

  assert.equal(fitted, 500);
});

test("quality visual gap: every production path loads visual fit before obstacle pair and renderer", () => {
  const nodeBuild = fs.readFileSync(path.join(ROOT, "tooling", "build.mjs"), "utf8");
  const psBuild = fs.readFileSync(path.join(ROOT, "tooling", "build.ps1"), "utf8");

  for (const [label, source, fitMarker, pairMarker, rendererMarker] of [
    [
      "node",
      nodeBuild,
      '"engine/obstacleVisualFit.js"',
      '"engine/entities/obstaclePair.js"',
      '"render/renderer.js"',
    ],
    [
      "powershell",
      psBuild,
      '"engine\\obstacleVisualFit.js"',
      '"engine\\entities\\obstaclePair.js"',
      '"render\\renderer.js"',
    ],
  ]) {
    const fitAt = source.indexOf(fitMarker);
    const pairAt = source.indexOf(pairMarker);
    const rendererAt = source.indexOf(rendererMarker);

    assert.ok(fitAt >= 0, `${label} build missing obstacleVisualFit.js`);
    assert.ok(pairAt > fitAt, `${label} build must load visual fit before ObstaclePair`);
    assert.ok(rendererAt > fitAt, `${label} build must load visual fit before Renderer`);
  }
});

test("quality visual gap: production bundle contains the fit helper before gameplay/render consumers", () => {
  const bundlePath = path.join(ROOT, "web", "game.js");
  assert.ok(fs.existsSync(bundlePath), "web/game.js missing; run npm run build first");
  const bundle = fs.readFileSync(bundlePath, "utf8");

  const fitAt = bundle.indexOf("function fitBuildingSpriteHeight");
  const pairAt = bundle.indexOf("class ObstaclePair");
  const rendererAt = bundle.indexOf("class Renderer");

  assert.ok(fitAt >= 0, "production bundle missing fitBuildingSpriteHeight");
  assert.ok(pairAt > fitAt, "production bundle must define visual fit before ObstaclePair");
  assert.ok(rendererAt > fitAt, "production bundle must define visual fit before Renderer");
});
