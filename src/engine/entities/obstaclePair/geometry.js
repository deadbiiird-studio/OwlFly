import { GAME, OBSTACLE } from "../../../core/constants.js";
import {
  obstacleClampNumber,
  obstacleClampToAvailable,
} from "./math.js";

export function normalizeObstaclePairSpawnGeometry({ topH, gap, gapBonus }) {
  const minGap = Number.isFinite(OBSTACLE.MIN_GAP) ? OBSTACLE.MIN_GAP : gap;
  const maxGap = Number.isFinite(OBSTACLE.MAX_GAP)
    ? OBSTACLE.MAX_GAP
    : gap + gapBonus;

  const grownGap = obstacleClampNumber(gap + gapBonus, minGap, maxGap);

  const minTop = Number.isFinite(OBSTACLE.MIN_TOP) ? OBSTACLE.MIN_TOP : 0;
  const minBottom = Number.isFinite(OBSTACLE.MIN_BOTTOM)
    ? OBSTACLE.MIN_BOTTOM
    : 0;

  const gapCenterY = topH + gap * 0.5;
  const maxTop = Math.max(minTop, GAME.BASE_HEIGHT - minBottom - grownGap);

  return {
    gap: grownGap,
    topH: obstacleClampNumber(gapCenterY - grownGap * 0.5, minTop, maxTop),
  };
}

export function getObstaclePairRects(obstacle, buildingMetrics = {}) {
  const gapTopY = obstacle.topH;
  const gapBottomY = obstacle.topH + obstacle.gap;

  const topAvailableHeight = Math.max(0, gapTopY);
  const topHitboxHeight = obstacleClampToAvailable(
    OBSTACLE.CLOUD_HITBOX_HEIGHT,
    topAvailableHeight
  );

  const bottomAvailableHeight = Math.max(0, GAME.BASE_HEIGHT - gapBottomY);
  const bottomHitboxHeight = obstacleClampToAvailable(
    (buildingMetrics.BUILDING_HITBOX_HEIGHT ?? OBSTACLE.BUILDING_HITBOX_HEIGHT ?? 150),
    bottomAvailableHeight
  );

  const top = {
    x: obstacle.x + OBSTACLE.CLOUD_HITBOX_INSET_X,
    y: Math.max(0, gapTopY - topHitboxHeight),
    w: Math.max(24, OBSTACLE.WIDTH - OBSTACLE.CLOUD_HITBOX_INSET_X * 2),
    h: topHitboxHeight,
  };

  const bottom = {
    x: obstacle.x + (buildingMetrics.BUILDING_HITBOX_INSET_X ?? OBSTACLE.BUILDING_HITBOX_INSET_X ?? 10),
    y: GAME.BASE_HEIGHT - bottomHitboxHeight,
    w: Math.max(24, OBSTACLE.WIDTH - (buildingMetrics.BUILDING_HITBOX_INSET_X ?? OBSTACLE.BUILDING_HITBOX_INSET_X ?? 10) * 2),
    h: bottomHitboxHeight,
  };

  return { top, bottom };
}

export function getObstaclePairVisualBounds(obstacle, buildingMetrics = {}) {
  const gapBottomY = obstacle.topH + obstacle.gap;

  return {
    top: {
      x: obstacle.x,
      y: 0,
      w: OBSTACLE.WIDTH,
      h: Math.max(OBSTACLE.CLOUD_VISUAL_MIN_HEIGHT, obstacle.topH),
    },
    bottom: {
      x: obstacle.x,
      y: gapBottomY,
      w: OBSTACLE.WIDTH,
      h: Math.max(
        (buildingMetrics.BUILDING_VISUAL_MIN_HEIGHT ?? OBSTACLE.BUILDING_VISUAL_MIN_HEIGHT ?? 170),
        GAME.BASE_HEIGHT - gapBottomY
      ),
    },
  };
}

export function getObstaclePairGapCenterY(obstacle) {
  return obstacle.topH + obstacle.gap / 2;
}

