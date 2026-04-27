import { GAME, OBSTACLE } from "../../core/constants.js";
import {
  getObstaclePairGapCenterY,
  getObstaclePairRects,
  getObstaclePairVisualBounds,
  normalizeObstaclePairSpawnGeometry,
} from "./obstaclePair/geometry.js";
import { updateObstaclePairMotion } from "./obstaclePair/motion.js";
import {
  createObstaclePairVisualState,
  getObstaclePairGapBonus,
  getObstaclePairRenderHints,
} from "./obstaclePair/visualState.js";
const BUILDING_HITBOX_HEIGHT = OBSTACLE.BUILDING_HITBOX_HEIGHT ?? 150;
const BUILDING_HITBOX_INSET_X = OBSTACLE.BUILDING_HITBOX_INSET_X ?? 10;
const BUILDING_VISUAL_MIN_HEIGHT = OBSTACLE.BUILDING_VISUAL_MIN_HEIGHT ?? 170;
const BUILDING_GROUND_VISUAL_INSET = OBSTACLE.BUILDING_GROUND_VISUAL_INSET ?? 8;

const BUILDING_METRICS = {
  BUILDING_HITBOX_HEIGHT,
  BUILDING_HITBOX_INSET_X,
  BUILDING_VISUAL_MIN_HEIGHT,
  BUILDING_GROUND_VISUAL_INSET,
};

export class ObstaclePair {
  constructor() {
    this.active = false;
    this.passed = false;
    this.x = GAME.BASE_WIDTH + 200;
    this.topH = 200;
    this.gap = 200;
    this.speed = OBSTACLE.BASE_SPEED;

    this.visualSpawnId = 0;
    this.visualSeed = 0;

    this.cloudVariantIndex = 0;
    this.cloudScaleBucket = 1;

    this.buildingVariantIndex = 0;
    this.buildingSizeBucket = 2;
  }

  spawn({ x, topH, gap, speed }) {
    this.active = true;
    this.passed = false;
    this.x = x;
    this.speed = speed;

    Object.assign(
      this,
      createObstaclePairVisualState({ topH, gap, speed })
    );

    const { topH: normalizedTopH, gap: normalizedGap } =
      normalizeObstaclePairSpawnGeometry({
        topH,
        gap,
        gapBonus: getObstaclePairGapBonus(this),
      });

    this.topH = normalizedTopH;
    this.gap = normalizedGap;
  }

  despawn() {
    this.active = false;
  }

  update(dt) {
    updateObstaclePairMotion(this, dt);
  }

  getRects() {
    return getObstaclePairRects(this, BUILDING_METRICS);
  }

  getVisualBounds() {
    return getObstaclePairVisualBounds(this, BUILDING_METRICS);
  }

  getRenderHints() {
    return getObstaclePairRenderHints(this, BUILDING_METRICS);
  }

  getGapCenterY() {
    return getObstaclePairGapCenterY(this);
  }
}

