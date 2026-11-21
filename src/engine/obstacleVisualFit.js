import { BUILDING_COLLISION_PROFILES } from "./obstacleCollisionProfiles.js";

// Shared geometry: renderer and collision must use identical resolved boxes.
// The five size classes are substantially different, not 5% cosmetic nudges.
export const OBSTACLE_VISUAL_SCALE = Object.freeze({
  cloudMinHeight: 55,
  cloudMaxHeight: 360,
  cloudHeightFactor: 1,
  cloudWidthFactor: 2.9,
  buildingGroundInset: 8,
  buildingMinBoxWidth: 145,
  buildingMaxBoxWidth: 560,
  buildingWidthFactor: 3.3,
  buildingMinBoxHeight: 180,
  buildingMaxBoxHeight: 760,
  buildingHeightFactor: 2.25,
  buildingHeightOffset: 150,
});

export const CLOUD_SIZE_VARIANTS = Object.freeze([
  { name: "tiny", widthScale: 0.37, scale: 0.38, count: 1 },
  { name: "small", widthScale: 0.59, scale: 0.56, count: 1 },
  { name: "medium", widthScale: 0.84, scale: 0.77, count: 2 },
  { name: "large", widthScale: 1.08, scale: 0.92, count: 3 },
  { name: "massive", widthScale: 1.40, scale: 1.0, count: 3 },
]);

export const BUILDING_SIZE_VARIANTS = Object.freeze([
  { name: "tiny", widthScale: 0.58, heightScale: 0.50 },
  { name: "small", widthScale: 0.78, heightScale: 0.70 },
  { name: "medium", widthScale: 0.95, heightScale: 0.90 },
  { name: "large", widthScale: 1.15, heightScale: 1.13 },
  { name: "massive", widthScale: 1.32, heightScale: 1.32 },
]);

// Draw boxes are defined once. Each box is rendered with the source PNG's
// contain transform and gets collision bands from that same transformed image.
// Small clouds are isolated objects, not three large overlapping copies.
export function getCloudSpriteLayout(bounds, variant = {}, scale = OBSTACLE_VISUAL_SCALE) {
  const size = Number.isFinite(variant.scale) ? variant.scale : 1;
  const widthScale = Number.isFinite(variant.widthScale) ? variant.widthScale : 1;
  const cloudCount = Math.max(1, Math.min(3, Math.floor(variant.count ?? 3)));
  const clusterH = Math.max(
    scale.cloudMinHeight,
    Math.min(scale.cloudMaxHeight, bounds.h, bounds.h * scale.cloudHeightFactor * size)
  );
  const y = bounds.y + bounds.h - clusterH;
  const baseW = bounds.w * scale.cloudWidthFactor * widthScale;
  const center = bounds.x + bounds.w * 0.5;
  const offsets = cloudCount === 1 ? [0] : cloudCount === 2 ? [-0.27, 0.27] : [-0.4, 0, 0.4];
  const boxes = offsets.map((offset) => ({
    x: center - baseW * 0.5 + offset * baseW,
    y,
    w: baseW,
    h: clusterH,
  }));
  return { boxes, y, clusterH, baseW };
}

// Keep the rendered rooftop and the lethal rooftop contour in the same visual
// neighborhood. This is a presentation constraint, not a new gameplay rule.
export const BUILDING_GAP_VISUAL_REACH = 80;

export function getBuildingProfileTopEdge(frameIndex = 0) {
  const profile =
    BUILDING_COLLISION_PROFILES[clampIndex(frameIndex, BUILDING_COLLISION_PROFILES.length)] ||
    BUILDING_COLLISION_PROFILES[0];

  if (!profile?.bands?.length) return 0;

  let top = 1;
  for (const band of profile.bands) {
    const edgeY = Number(band?.[2]);
    if (Number.isFinite(edgeY)) top = Math.min(top, edgeY);
  }
  return clamp(top, 0, 0.92);
}

export function fitBuildingSpriteHeight({
  frameIndex = 0,
  nominalHeight,
  spriteWidth,
  groundAnchorY,
  gapBottomY,
  gapReach = BUILDING_GAP_VISUAL_REACH,
} = {}) {
  const profile =
    BUILDING_COLLISION_PROFILES[clampIndex(frameIndex, BUILDING_COLLISION_PROFILES.length)] ||
    BUILDING_COLLISION_PROFILES[0];

  const safeNominalHeight = Math.max(1, finiteOr(nominalHeight, 1));
  const safeSpriteWidth = Math.max(1, finiteOr(spriteWidth, 1));
  const safeGroundAnchorY = finiteOr(groundAnchorY, 0);
  const safeGapBottomY = finiteOr(gapBottomY, safeGroundAnchorY);
  const safeReach = Math.max(0, finiteOr(gapReach, BUILDING_GAP_VISUAL_REACH));

  if (!profile?.width || !profile?.height) return safeNominalHeight;

  const profileTop = getBuildingProfileTopEdge(frameIndex);
  const targetTopY = safeGapBottomY - safeReach;
  const denominator = Math.max(0.08, 1 - profileTop);
  const maxImageHeightByGap = Math.max(
    96,
    (safeGroundAnchorY - targetTopY) / denominator
  );

  const widthLimitedImageHeight =
    safeSpriteWidth * (profile.height / Math.max(1, profile.width));
  const nominalImageHeight = Math.min(
    safeNominalHeight,
    widthLimitedImageHeight
  );

  // If width already keeps the image below the gap-side cap, retain the
  // existing visual size. Otherwise let box height become the limiting axis.
  if (nominalImageHeight <= maxImageHeightByGap) {
    return safeNominalHeight;
  }

  return Math.min(safeNominalHeight, maxImageHeightByGap);
}

function clampIndex(value, max) {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.max(0, Math.min(max - 1, value | 0));
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
