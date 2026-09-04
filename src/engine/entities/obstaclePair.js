import { GAME, OBSTACLE } from "../../core/constants.js";
import { BUILDING_COLLISION_PROFILES, CLOUD_COLLISION_PROFILES } from "../obstacleCollisionProfiles.js";
import {
  BUILDING_GAP_VISUAL_REACH,
  fitBuildingSpriteHeight,
} from "../obstacleVisualFit.js";

let nextVisualSpawnId = 1;

export const BUILDING_GAP_COLLISION_REACH = BUILDING_GAP_VISUAL_REACH;

const COLLISION_RENDER_SCALE = {
  cloudMinHeight: 230,
  cloudMaxHeight: 360,
  cloudHeightFactor: 1.22,
  cloudWidthFactor: 2.9,
  buildingGroundInset: 8,
  buildingMinBoxWidth: 300,
  buildingMaxBoxWidth: 560,
  buildingWidthFactor: 3.3,
  buildingMinBoxHeight: 500,
  buildingMaxBoxHeight: 760,
  buildingHeightFactor: 2.25,
  buildingHeightOffset: 150,
};

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ensureCollisionVisualVariant(obstacle, kind) {
  const key = `${kind}:${obstacle.topH || 0}:${obstacle.gap || 0}`;
  const storeKey = kind === "building" ? "_buildingVisualVariant" : "_cloudVisualVariant";
  const current = obstacle[storeKey];
  if (current && current.key === key) return current;

  const buildingSizeBuckets = [
    { widthScale: 0.9, heightScale: 0.86 },
    { widthScale: 0.96, heightScale: 0.94 },
    { widthScale: 1.0, heightScale: 1.0 },
    { widthScale: 1.06, heightScale: 1.08 },
    { widthScale: 1.12, heightScale: 1.16 },
  ];
  const cloudSizeBuckets = [
    { widthScale: 0.94, scale: 0.94 },
    { widthScale: 1.0, scale: 1.0 },
    { widthScale: 1.06, scale: 1.05 },
  ];

  const variant = kind === "building"
    ? {
        key,
        frameIndex: clampIndex(obstacle.buildingVariantIndex, BUILDING_COLLISION_PROFILES.length),
        ...(buildingSizeBuckets[
          clampIndex(obstacle.buildingSizeBucket, buildingSizeBuckets.length)
        ] || buildingSizeBuckets[2]),
      }
    : {
        key,
        frameIndex: clampIndex(obstacle.cloudVariantIndex, CLOUD_COLLISION_PROFILES.length),
        ...(cloudSizeBuckets[
          clampIndex(obstacle.cloudScaleBucket, cloudSizeBuckets.length)
        ] || cloudSizeBuckets[1]),
      };

  obstacle[storeKey] = variant;
  return variant;
}

function containedImageRect(bounds, profile, bottomAnchored = false) {
  const scale = Math.min(bounds.w / profile.width, bounds.h / profile.height);
  const w = profile.width * scale;
  const h = profile.height * scale;
  return {
    x: bounds.x + (bounds.w - w) * 0.5,
    y: bottomAnchored
      ? bounds.y + bounds.h - h
      : bounds.y + (bounds.h - h) * 0.5,
    w,
    h,
  };
}

function makeBuildingBands(obstacle, bounds) {
  const variant = ensureCollisionVisualVariant(obstacle, "building");
  const profile =
    BUILDING_COLLISION_PROFILES[variant.frameIndex] ||
    BUILDING_COLLISION_PROFILES[0];
  const groundAnchorY = GAME.BASE_HEIGHT - COLLISION_RENDER_SCALE.buildingGroundInset;
  const nominalSpriteH = Math.max(
    COLLISION_RENDER_SCALE.buildingMinBoxHeight,
    Math.min(
      COLLISION_RENDER_SCALE.buildingMaxBoxHeight,
      bounds.h *
        (variant.heightScale ?? 1) *
        COLLISION_RENDER_SCALE.buildingHeightFactor +
        COLLISION_RENDER_SCALE.buildingHeightOffset
    )
  );
  const spriteW = Math.max(
    COLLISION_RENDER_SCALE.buildingMinBoxWidth,
    Math.min(
      COLLISION_RENDER_SCALE.buildingMaxBoxWidth,
      bounds.w *
        (variant.widthScale ?? 1) *
        COLLISION_RENDER_SCALE.buildingWidthFactor
    )
  );
  const spriteH = fitBuildingSpriteHeight({
    frameIndex: variant.frameIndex,
    nominalHeight: nominalSpriteH,
    spriteWidth: spriteW,
    groundAnchorY,
    gapBottomY: obstacle.topH + obstacle.gap,
  });
  const box = {
    x: bounds.x + bounds.w * 0.5 - spriteW * 0.5,
    y: groundAnchorY - spriteH,
    w: spriteW,
    h: spriteH,
  };
  const image = containedImageRect(box, profile, true);
  const bands = profile.bands.map(([x0, x1, edgeY]) => {
    const visualY = image.y + edgeY * image.h;
    const gapFloor =
      obstacle.topH + obstacle.gap - BUILDING_GAP_COLLISION_REACH;
    const y = Math.max(visualY, gapFloor);
    return {
      x: image.x + x0 * image.w,
      y,
      w: Math.max(1, (x1 - x0) * image.w),
      h: Math.max(1, GAME.BASE_HEIGHT - y),
    };
  });
  return { bands, spriteIndex: variant.frameIndex, imageBounds: image };
}

function makeCloudBands(obstacle, bounds) {
  const variant = ensureCollisionVisualVariant(obstacle, "cloud");
  const profile =
    CLOUD_COLLISION_PROFILES[variant.frameIndex] || CLOUD_COLLISION_PROFILES[0];
  const clusterScale = variant.scale ?? 1;
  const clusterH = Math.max(
    COLLISION_RENDER_SCALE.cloudMinHeight,
    Math.min(
      COLLISION_RENDER_SCALE.cloudMaxHeight,
      bounds.h * COLLISION_RENDER_SCALE.cloudHeightFactor * clusterScale
    )
  );
  const y = Math.max(0, bounds.y + bounds.h - clusterH);
  const baseW =
    bounds.w * COLLISION_RENDER_SCALE.cloudWidthFactor * (variant.widthScale ?? 1);
  const boxes = [
    { x: bounds.x - bounds.w * 0.28, y: y + 10, w: baseW, h: clusterH },
    {
      x: bounds.x - bounds.w * 0.04,
      y,
      w: baseW * 0.95,
      h: clusterH * 1.02,
    },
    {
      x: bounds.x + bounds.w * 0.22,
      y: y + 12,
      w: baseW * 0.9,
      h: clusterH * 0.96,
    },
  ];

  const bands = [];
  for (const box of boxes) {
    const image = containedImageRect(box, profile, false);
    for (const [x0, x1, edgeY] of profile.bands) {
      const bottomY = image.y + edgeY * image.h;
      bands.push({
        x: image.x + x0 * image.w,
        y: 0,
        w: Math.max(1, (x1 - x0) * image.w),
        h: Math.max(1, bottomY),
      });
    }
  }
  return { bands, spriteIndex: variant.frameIndex };
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
    this.speed = speed;

    this.visualSpawnId = nextVisualSpawnId++;
    this.visualSeed =
      this.visualSpawnId * 0.173 +
      topH * 0.037 +
      gap * 0.019 +
      speed * 0.011;

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

    const cloudGapBonusByBucket = [0, 12, 24];
    const buildingGapBonusByBucket = [0, 8, 16, 24, 32];

    const gapBonus =
      (cloudGapBonusByBucket[this.cloudScaleBucket] || 0) +
      (buildingGapBonusByBucket[this.buildingSizeBucket] || 0);

    const minGap = Number.isFinite(OBSTACLE.MIN_GAP) ? OBSTACLE.MIN_GAP : gap;
    const maxGap = Number.isFinite(OBSTACLE.MAX_GAP)
      ? OBSTACLE.MAX_GAP
      : gap + gapBonus;

    const grownGap = clamp(gap + gapBonus, minGap, maxGap);

    const minTop = Number.isFinite(OBSTACLE.MIN_TOP) ? OBSTACLE.MIN_TOP : 0;
    const minBottom = Number.isFinite(OBSTACLE.MIN_BOTTOM)
      ? OBSTACLE.MIN_BOTTOM
      : 0;

    const gapCenterY = topH + gap * 0.5;
    const maxTop = Math.max(
      minTop,
      GAME.BASE_HEIGHT - minBottom - grownGap
    );

    this.gap = grownGap;
    this.topH = clamp(gapCenterY - grownGap * 0.5, minTop, maxTop);

    // Seed the same visual cache that the renderer consumes so the collision
    // profile and the drawn PNG always refer to the same variant and scale.
    ensureCollisionVisualVariant(this, "cloud");
    ensureCollisionVisualVariant(this, "building");
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

    const topGapSafeInset = Math.max(
      0,
      OBSTACLE.CLOUD_GAP_SAFE_INSET ?? 0
    );
    const topAvailableHeight = Math.max(0, gapTopY - topGapSafeInset);
    const topHitboxHeight = clampToAvailable(
      OBSTACLE.CLOUD_HITBOX_HEIGHT,
      topAvailableHeight
    );

    const bottomAvailableHeight = Math.max(
      0,
      GAME.BASE_HEIGHT - gapBottomY
    );
    const bottomHitboxHeight = clampToAvailable(
      OBSTACLE.TORNADO_HITBOX_HEIGHT,
      bottomAvailableHeight
    );

    const top = {
      x: this.x + OBSTACLE.CLOUD_HITBOX_INSET_X,
      y: Math.max(
        0,
        gapTopY - topGapSafeInset - topHitboxHeight
      ),
      w: Math.max(
        24,
        OBSTACLE.WIDTH - OBSTACLE.CLOUD_HITBOX_INSET_X * 2
      ),
      h: topHitboxHeight,
    };

    const bottom = {
      x: this.x + OBSTACLE.TORNADO_HITBOX_INSET_X,
      y: GAME.BASE_HEIGHT - bottomHitboxHeight,
      w: Math.max(
        24,
        OBSTACLE.WIDTH - OBSTACLE.TORNADO_HITBOX_INSET_X * 2
      ),
      h: bottomHitboxHeight,
    };

    const visual = this.getVisualBounds();
    const cloudCollision = makeCloudBands(this, visual.top);
    const buildingCollision = makeBuildingBands(this, visual.bottom);

    // Preserve the legacy rectangle for scoring/eval contracts, while
    // circleAabbIntersect consumes the sharper sprite-aware bands.
    top.bands = cloudCollision.bands;
    top.spriteIndex = cloudCollision.spriteIndex;
    bottom.bands = buildingCollision.bands;
    bottom.spriteIndex = buildingCollision.spriteIndex;

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
      buildingScalePresets[this.buildingSizeBucket] ||
      buildingScalePresets[2];

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
