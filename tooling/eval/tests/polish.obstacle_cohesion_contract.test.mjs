import test from "node:test";
import assert from "node:assert/strict";
import { GAME } from "../../../src/core/constants.js";
import { BUILDING_COLLISION_PROFILES } from "../../../src/engine/obstacleCollisionProfiles.js";
import {
  BUILDING_GAP_VISUAL_REACH,
  OBSTACLE_PRESENTATION_CONTRACT,
  fitBuildingSpriteHeight,
  getBuildingProfileTopEdge,
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
