import { GAME, OBSTACLE } from "../../core/constants.js";

let nextVisualSpawnId = 1;

function clampToAvailable(target, available) {
  return Math.max(0, Math.min(target, available));
}

function clampIndex(value, max) {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.max(0, Math.min(max - 1, value | 0));
}

function hash01(value, salt = 0) {
  const x = Math.sin(value * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

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
    this.topH = topH;
    this.gap = gap;
    this.speed = speed;

    this.visualSpawnId = nextVisualSpawnId++;
    this.visualSeed =
      this.visualSpawnId * 0.173 +
      this.topH * 0.037 +
      this.gap * 0.019 +
      this.speed * 0.011;

    const cloudHash = hash01(this.visualSeed, 13);
    const buildingHash = hash01(this.visualSeed, 29);

    this.cloudVariantIndex = clampIndex(Math.floor(cloudHash * 6), 6);
    this.cloudScaleBucket = clampIndex(
      Math.floor(hash01(this.visualSeed, 17) * 3),
      3
    );

    this.buildingVariantIndex = clampIndex(
      Math.floor(buildingHash * 13),
      13
    );
    this.buildingSizeBucket = clampIndex(
      Math.floor(hash01(this.visualSeed, 31) * 5),
      5
    );
  }

  despawn() {
    this.active = false;
  }

  update(dt) {
    if (!this.active) return;

    this.x -= this.speed * dt;

    if (this.x + OBSTACLE.WIDTH < -40) {
      this.despawn();
    }
  }

  getRects() {
    const gapTopY = this.topH;
    const gapBottomY = this.topH + this.gap;

    const topAvailableHeight = Math.max(0, gapTopY);
    const topHitboxHeight = clampToAvailable(
      OBSTACLE.CLOUD_HITBOX_HEIGHT,
      topAvailableHeight
    );

    const bottomAvailableHeight = Math.max(0, GAME.BASE_HEIGHT - gapBottomY);
    const bottomHitboxHeight = clampToAvailable(
      OBSTACLE.TORNADO_HITBOX_HEIGHT,
      bottomAvailableHeight
    );

    const top = {
      x: this.x + OBSTACLE.CLOUD_HITBOX_INSET_X,
      y: Math.max(0, gapTopY - topHitboxHeight),
      w: Math.max(24, OBSTACLE.WIDTH - OBSTACLE.CLOUD_HITBOX_INSET_X * 2),
      h: topHitboxHeight,
    };

    const bottom = {
      x: this.x + OBSTACLE.TORNADO_HITBOX_INSET_X,
      y: GAME.BASE_HEIGHT - bottomHitboxHeight,
      w: Math.max(24, OBSTACLE.WIDTH - OBSTACLE.TORNADO_HITBOX_INSET_X * 2),
      h: bottomHitboxHeight,
    };

    return { top, bottom };
  }

  getVisualBounds() {
    const gapBottomY = this.topH + this.gap;

    return {
      top: {
        x: this.x,
        y: 0,
        w: OBSTACLE.WIDTH,
        h: Math.max(OBSTACLE.CLOUD_VISUAL_MIN_HEIGHT, this.topH),
      },
      bottom: {
        x: this.x,
        y: gapBottomY,
        w: OBSTACLE.WIDTH,
        h: Math.max(
          OBSTACLE.TORNADO_VISUAL_MIN_HEIGHT,
          GAME.BASE_HEIGHT - gapBottomY
        ),
      },
    };
  }

  getRenderHints() {
    const gapTopY = this.topH;
    const gapBottomY = this.topH + this.gap;

    const groundAnchorY =
      GAME.BASE_HEIGHT - (OBSTACLE.GROUND_VISUAL_INSET ?? 18);

    const bottomVisualHeight = Math.max(
      OBSTACLE.TORNADO_VISUAL_MIN_HEIGHT,
      GAME.BASE_HEIGHT - gapBottomY
    );

    const cloudScalePresets = [0.94, 1.0, 1.06];
    const buildingScalePresets = [
      { widthScale: 0.9, heightScale: 0.86 },
      { widthScale: 0.96, heightScale: 0.94 },
      { widthScale: 1.0, heightScale: 1.0 },
      { widthScale: 1.06, heightScale: 1.08 },
      { widthScale: 1.12, heightScale: 1.16 },
    ];

    const buildingScale =
      buildingScalePresets[this.buildingSizeBucket] || buildingScalePresets[2];

    return {
      gapTopY,
      gapBottomY,
      groundAnchorY,

      visualSpawnId: this.visualSpawnId,
      visualSeed: this.visualSeed,

      cloudVariantIndex: this.cloudVariantIndex,
      cloudScaleBucket: this.cloudScaleBucket,
      cloudScale: cloudScalePresets[this.cloudScaleBucket] || 1,

      buildingVariantIndex: this.buildingVariantIndex,
      buildingSizeBucket: this.buildingSizeBucket,
      buildingWidthScale: buildingScale.widthScale,
      buildingHeightScale: buildingScale.heightScale,
      buildingTopY: groundAnchorY - bottomVisualHeight,
      buildingHeight: bottomVisualHeight,
    };
  }

  getGapCenterY() {
    return this.topH + this.gap / 2;
  }
}
