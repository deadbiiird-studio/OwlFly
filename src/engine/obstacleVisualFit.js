import { BUILDING_COLLISION_PROFILES } from "./obstacleCollisionProfiles.js";

// Foreground obstacle art-direction contract. These values govern presentation
// only; collision contours and gameplay gap geometry remain untouched.
export const OBSTACLE_PRESENTATION_CONTRACT = Object.freeze({
  buildingGapReach: 72,
  previousBuildingGapReach: 80,
  maxReachTightening: 8,
  minimumRenderedBuildingHeight: 96,
  gapEdgeThickness: 2,
  gapEdgeInset: 7,
  gapEdgeAlpha: 0.14,
});

// Keep the rendered rooftop and the lethal rooftop contour in the same visual
// neighborhood. P4 tightens the family by only 8px from the sealed A1 value.
export const BUILDING_GAP_VISUAL_REACH =
  OBSTACLE_PRESENTATION_CONTRACT.buildingGapReach;

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
    OBSTACLE_PRESENTATION_CONTRACT.minimumRenderedBuildingHeight,
    (safeGroundAnchorY - targetTopY) / denominator
  );

  const widthLimitedImageHeight =
    safeSpriteWidth * (profile.height / Math.max(1, profile.width));
  const nominalImageHeight = Math.min(
    safeNominalHeight,
    widthLimitedImageHeight
  );

  // Width-limited or already-honest buildings retain their exact prior size.
  // Only sprites whose visible rooftop would exceed the shared presentation
  // reach are reduced, keeping the change local and rollback-friendly.
  if (nominalImageHeight <= maxImageHeightByGap) {
    return safeNominalHeight;
  }

  return Math.min(safeNominalHeight, maxImageHeightByGap);
}

export function getObstacleGapEdge(kind, bounds) {
  if (!bounds) return null;

  const x = finiteOr(bounds.x, 0);
  const y = finiteOr(bounds.y, 0);
  const w = Math.max(0, finiteOr(bounds.w, 0));
  const h = Math.max(0, finiteOr(bounds.h, 0));
  const inset = Math.min(
    OBSTACLE_PRESENTATION_CONTRACT.gapEdgeInset,
    Math.max(0, w * 0.25)
  );
  const thickness = Math.min(
    OBSTACLE_PRESENTATION_CONTRACT.gapEdgeThickness,
    h
  );
  const edgeW = Math.max(0, w - inset * 2);
  if (edgeW <= 0 || thickness <= 0) return null;

  const edgeY = kind === "building"
    ? y
    : y + Math.max(0, h - thickness);

  return {
    x: x + inset,
    y: edgeY,
    w: edgeW,
    h: thickness,
  };
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
