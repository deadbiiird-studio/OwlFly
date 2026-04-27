import { GAME, OBSTACLE } from "../../../core/constants.js";
import { obstacleClampIndex, obstacleHash01 } from "./math.js";

let nextObstaclePairVisualSpawnId = 1;

const OBSTACLE_PAIR_CLOUD_GAP_BONUS_BY_BUCKET = [0, 12, 24];
const OBSTACLE_PAIR_BUILDING_GAP_BONUS_BY_BUCKET = [0, 8, 16, 24, 32];

const OBSTACLE_PAIR_CLOUD_SCALE_PRESETS = [0.94, 1.0, 1.06];
const OBSTACLE_PAIR_BUILDING_SCALE_PRESETS = [
  { widthScale: 0.9, heightScale: 0.86 },
  { widthScale: 0.96, heightScale: 0.94 },
  { widthScale: 1.0, heightScale: 1.0 },
  { widthScale: 1.06, heightScale: 1.08 },
  { widthScale: 1.12, heightScale: 1.16 },
];

export function createObstaclePairVisualState({ topH, gap, speed }) {
  const visualSpawnId = nextObstaclePairVisualSpawnId++;
  const visualSeed =
    visualSpawnId * 0.173 + topH * 0.037 + gap * 0.019 + speed * 0.011;

  const cloudHash = obstacleHash01(visualSeed, 13);
  const buildingHash = obstacleHash01(visualSeed, 29);

  const cloudScaleBucket = obstacleClampIndex(
    Math.floor(obstacleHash01(visualSeed, 17) * 3),
    3
  );

  const buildingSizeBucket = obstacleClampIndex(
    Math.floor(obstacleHash01(visualSeed, 31) * 5),
    5
  );

  return {
    visualSpawnId,
    visualSeed,
    cloudVariantIndex: obstacleClampIndex(Math.floor(cloudHash * 6), 6),
    cloudScaleBucket,
    buildingVariantIndex: obstacleClampIndex(Math.floor(buildingHash * 13), 13),
    buildingSizeBucket,
  };
}

export function getObstaclePairGapBonus(obstacle) {
  return (
    (OBSTACLE_PAIR_CLOUD_GAP_BONUS_BY_BUCKET[obstacle.cloudScaleBucket] || 0) +
    (OBSTACLE_PAIR_BUILDING_GAP_BONUS_BY_BUCKET[
      obstacle.buildingSizeBucket
    ] || 0)
  );
}

export function getObstaclePairRenderHints(obstacle, buildingMetrics = {}) {
  const gapTopY = obstacle.topH;
  const gapBottomY = obstacle.topH + obstacle.gap;

  const buildingGroundVisualInset =
    buildingMetrics.BUILDING_GROUND_VISUAL_INSET ??
    OBSTACLE.BUILDING_GROUND_VISUAL_INSET ??
    8;

  const groundAnchorY = GAME.BASE_HEIGHT - buildingGroundVisualInset;

  const bottomVisualHeight = Math.max(
    (buildingMetrics.BUILDING_VISUAL_MIN_HEIGHT ?? OBSTACLE.BUILDING_VISUAL_MIN_HEIGHT ?? 170),
    GAME.BASE_HEIGHT - gapBottomY
  );

  const buildingScale =
    OBSTACLE_PAIR_BUILDING_SCALE_PRESETS[obstacle.buildingSizeBucket] ||
    OBSTACLE_PAIR_BUILDING_SCALE_PRESETS[2];

  return {
    gapTopY,
    gapBottomY,
    groundAnchorY,

    visualSpawnId: obstacle.visualSpawnId,
    visualSeed: obstacle.visualSeed,

    cloudVariantIndex: obstacle.cloudVariantIndex,
    cloudScaleBucket: obstacle.cloudScaleBucket,
    cloudScale:
      OBSTACLE_PAIR_CLOUD_SCALE_PRESETS[obstacle.cloudScaleBucket] || 1,

    buildingVariantIndex: obstacle.buildingVariantIndex,
    buildingSizeBucket: obstacle.buildingSizeBucket,
    buildingWidthScale: buildingScale.widthScale,
    buildingHeightScale: buildingScale.heightScale,
    buildingTopY: groundAnchorY - bottomVisualHeight,
    buildingHeight: bottomVisualHeight,
  };
}

