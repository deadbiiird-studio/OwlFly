import { BUILDING_COLLISION_PROFILES } from "./obstacleCollisionProfiles.js";

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
