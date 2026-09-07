import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GAME } from "../../../src/core/constants.js";
import { BUILDING_COLLISION_PROFILES } from "../../../src/engine/obstacleCollisionProfiles.js";
import {
  BUILDING_GAP_VISUAL_REACH,
  OBSTACLE_PRESENTATION_CONTRACT,
  fitBuildingSpriteHeight,
  getBuildingProfileTopEdge,
  getObstacleGapEdge,
} from "../../../src/engine/obstacleVisualFit.js";

const GROUND = GAME.BASE_HEIGHT - 8;
const WIDTH = 300;
const NOMINAL = 760;

function visibleProfileTop(frameIndex, boxHeight) {
  const profile = BUILDING_COLLISION_PROFILES[frameIndex];
  const imageHeight = Math.min(boxHeight, WIDTH * (profile.height / profile.width));
  return GROUND - imageHeight + getBuildingProfileTopEdge(frameIndex) * imageHeight;
}

test("P4 obstacle cohesion: shared building reach only tightens the sealed envelope by 8px", () => {
  assert.equal(OBSTACLE_PRESENTATION_CONTRACT.previousBuildingGapReach, 80);
  assert.equal(BUILDING_GAP_VISUAL_REACH, 72);
  assert.equal(
    OBSTACLE_PRESENTATION_CONTRACT.previousBuildingGapReach - BUILDING_GAP_VISUAL_REACH,
    OBSTACLE_PRESENTATION_CONTRACT.maxReachTightening
  );
  assert.ok(OBSTACLE_PRESENTATION_CONTRACT.maxReachTightening <= 8);
});

test("P4 obstacle cohesion: every building stays at or farther from the gap than the prior 80px rule", () => {
  const gaps = [468, 560, 660];

  for (let frameIndex = 0; frameIndex < BUILDING_COLLISION_PROFILES.length; frameIndex += 1) {
    for (const gapBottomY of gaps) {
      const current = fitBuildingSpriteHeight({
        frameIndex,
        nominalHeight: NOMINAL,
        spriteWidth: WIDTH,
        groundAnchorY: GROUND,
        gapBottomY,
      });
      const previous = fitBuildingSpriteHeight({
        frameIndex,
        nominalHeight: NOMINAL,
        spriteWidth: WIDTH,
        groundAnchorY: GROUND,
        gapBottomY,
        gapReach: OBSTACLE_PRESENTATION_CONTRACT.previousBuildingGapReach,
      });

      const currentTop = visibleProfileTop(frameIndex, current);
      const previousTop = visibleProfileTop(frameIndex, previous);
      assert.ok(
        currentTop >= previousTop - 0.75,
        `building ${frameIndex + 1} must not move farther into the flight gap`
      );
      assert.ok(
        currentTop >= gapBottomY - BUILDING_GAP_VISUAL_REACH - 0.75,
        `building ${frameIndex + 1} must honor the shared 72px visual reach`
      );
    }
  }
});

test("P4 obstacle cohesion: already-honest high openings preserve exact existing scale", () => {
  for (let frameIndex = 0; frameIndex < BUILDING_COLLISION_PROFILES.length; frameIndex += 1) {
    const current = fitBuildingSpriteHeight({
      frameIndex,
      nominalHeight: 500,
      spriteWidth: WIDTH,
      groundAnchorY: GROUND,
      gapBottomY: 380,
    });
    const previous = fitBuildingSpriteHeight({
      frameIndex,
      nominalHeight: 500,
      spriteWidth: WIDTH,
      groundAnchorY: GROUND,
      gapBottomY: 380,
      gapReach: 80,
    });

    assert.equal(current, previous);
  }
});

test("P4 obstacle cohesion: shared cloud/building edge stays strictly inside obstacle bounds", () => {
  const top = { x: 120, y: 0, w: 96, h: 310 };
  const bottom = { x: 120, y: 548, w: 96, h: 252 };
  const cloudEdge = getObstacleGapEdge("cloud", top);
  const buildingEdge = getObstacleGapEdge("building", bottom);

  for (const [edge, bounds] of [[cloudEdge, top], [buildingEdge, bottom]]) {
    assert.ok(edge);
    assert.ok(edge.x >= bounds.x);
    assert.ok(edge.x + edge.w <= bounds.x + bounds.w);
    assert.ok(edge.y >= bounds.y);
    assert.ok(edge.y + edge.h <= bounds.y + bounds.h);
    assert.ok(edge.h <= 2);
  }

  assert.equal(cloudEdge.y + cloudEdge.h, top.y + top.h);
  assert.equal(buildingEdge.y, bottom.y);
});

test("P4 obstacle cohesion: collision profile data is consumed but never mutated", () => {
  const before = JSON.stringify(BUILDING_COLLISION_PROFILES);
  for (let frameIndex = 0; frameIndex < BUILDING_COLLISION_PROFILES.length; frameIndex += 1) {
    fitBuildingSpriteHeight({
      frameIndex,
      nominalHeight: NOMINAL,
      spriteWidth: WIDTH,
      groundAnchorY: GROUND,
      gapBottomY: 600,
    });
  }
  assert.equal(JSON.stringify(BUILDING_COLLISION_PROFILES), before);
});

test("P4 obstacle cohesion: renderer uses one shared inset edge helper for both hazard classes", async () => {
  const source = await readFile(new URL("../../../src/render/renderer.js", import.meta.url), "utf8");

  assert.match(source, /drawSharedGapEdge\(ctx, "cloud", bounds, theme\)/);
  assert.match(source, /drawSharedGapEdge\(ctx, "building", bounds, theme\)/);
  assert.match(source, /getObstacleGapEdge\(kind, bounds\)/);
  assert.match(source, /OBSTACLE_PRESENTATION_CONTRACT\.gapEdgeAlpha/);
});
