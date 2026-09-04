// Atmosphere City A2 — measurable visual-readability policy.
// Tooling-only by design: this file observes and rejects unsafe visual changes
// without changing runtime rendering, collision, physics, scoring, or spawn truth.

export const READABILITY_POLICY = Object.freeze({
  protectedFlightFieldBottomY: 500,
  allowedRoofTypes: Object.freeze([0, 1, 2]),
  totalParallaxSpeedBudgetPxPerSec: 40,
  minAdjacentParallaxSpeedSeparationPxPerSec: 4,
  layers: Object.freeze({
    far: Object.freeze({
      maxAlpha: 0.14,
      maxSpeedPxPerSec: 6,
      maxSegmentsPer480: 20,
      offscreenSegmentAllowance: 5,
      maxVisibleWidthCoverageRatio: 0.90,
    }),
    mid: Object.freeze({
      maxAlpha: 0.20,
      maxSpeedPxPerSec: 13,
      maxSegmentsPer480: 16,
      offscreenSegmentAllowance: 5,
      maxVisibleWidthCoverageRatio: 0.90,
    }),
    near: Object.freeze({
      maxAlpha: 0.25,
      maxSpeedPxPerSec: 22,
      maxSegmentsPer480: 14,
      offscreenSegmentAllowance: 5,
      maxVisibleWidthCoverageRatio: 0.90,
    }),
  }),
});

export function auditEnvironmentReadability({
  contract,
  order,
  snapshot,
  viewportWidth = 480,
  viewportHeight = 800,
} = {}) {
  const failures = [];
  const metrics = {
    viewportWidth,
    viewportHeight,
    totalParallaxSpeedPxPerSec: 0,
    layers: {},
  };

  if (!contract || !snapshot || !Array.isArray(order)) {
    return {
      pass: false,
      failures: ["missing contract, order, or snapshot"],
      metrics,
    };
  }

  let previousSpeed = null;

  for (const layerId of order) {
    const layer = contract[layerId];
    const policy = READABILITY_POLICY.layers[layerId];
    const segments = Array.isArray(snapshot[layerId]) ? snapshot[layerId] : [];

    if (!layer || !policy) {
      failures.push(`${layerId}: missing layer contract or readability policy`);
      continue;
    }

    const widthScale = Math.max(1, viewportWidth) / 480;
    const baseVisibleBudget = Math.max(
      1,
      policy.maxSegmentsPer480 - policy.offscreenSegmentAllowance
    );
    const segmentBudget =
      Math.ceil(baseVisibleBudget * widthScale) + policy.offscreenSegmentAllowance;

    const visibleWidthCoverage = segments.reduce((sum, segment) => {
      if (!Number.isFinite(segment?.x) || !(segment?.w > 0)) return sum;
      const left = Math.max(0, segment.x);
      const right = Math.min(viewportWidth, segment.x + segment.w);
      return sum + Math.max(0, right - left);
    }, 0);
    const visibleWidthCoverageRatio =
      visibleWidthCoverage / Math.max(1, viewportWidth);
    const minTopY = segments.length
      ? Math.min(
          ...segments.map((segment) =>
            Number.isFinite(segment?.y) ? segment.y : Infinity
          )
        )
      : Infinity;

    metrics.totalParallaxSpeedPxPerSec += layer.speedPxPerSec;
    metrics.layers[layerId] = {
      alpha: layer.alpha,
      speedPxPerSec: layer.speedPxPerSec,
      segmentCount: segments.length,
      segmentBudget,
      visibleWidthCoverageRatio,
      minTopY,
    };

    if (!(layer.alpha > 0 && layer.alpha <= policy.maxAlpha)) {
      failures.push(`${layerId}: alpha ${layer.alpha} exceeds ${policy.maxAlpha}`);
    }

    if (!(layer.speedPxPerSec >= 0 && layer.speedPxPerSec <= policy.maxSpeedPxPerSec)) {
      failures.push(
        `${layerId}: parallax speed ${layer.speedPxPerSec} exceeds ${policy.maxSpeedPxPerSec}`
      );
    }

    if (previousSpeed !== null) {
      const separation = layer.speedPxPerSec - previousSpeed;
      if (separation < READABILITY_POLICY.minAdjacentParallaxSpeedSeparationPxPerSec) {
        failures.push(
          `${layerId}: parallax separation ${separation} is below ${READABILITY_POLICY.minAdjacentParallaxSpeedSeparationPxPerSec}`
        );
      }
    }
    previousSpeed = layer.speedPxPerSec;

    if (segments.length > segmentBudget) {
      failures.push(`${layerId}: ${segments.length} segments exceed budget ${segmentBudget}`);
    }

    if (visibleWidthCoverageRatio > policy.maxVisibleWidthCoverageRatio) {
      failures.push(
        `${layerId}: visible width coverage ${visibleWidthCoverageRatio.toFixed(3)} exceeds ${policy.maxVisibleWidthCoverageRatio}`
      );
    }

    for (const segment of segments) {
      if (!Number.isFinite(segment?.x) || !Number.isFinite(segment?.y)) {
        failures.push(`${layerId}: non-finite segment position`);
        continue;
      }

      if (!(segment.w > 0 && segment.h > 0)) {
        failures.push(`${layerId}: non-positive segment dimensions`);
      }

      if (segment.y < READABILITY_POLICY.protectedFlightFieldBottomY) {
        failures.push(
          `${layerId}: scenery enters protected flight field at y=${segment.y.toFixed(2)}`
        );
      }

      if (segment.y + segment.h > viewportHeight) {
        failures.push(`${layerId}: scenery extends below viewport`);
      }

      if (!READABILITY_POLICY.allowedRoofTypes.includes(segment.roofType)) {
        failures.push(`${layerId}: roof type ${segment.roofType} is not approved`);
      }
    }
  }

  if (
    metrics.totalParallaxSpeedPxPerSec >
    READABILITY_POLICY.totalParallaxSpeedBudgetPxPerSec
  ) {
    failures.push(
      `total parallax speed ${metrics.totalParallaxSpeedPxPerSec} exceeds ${READABILITY_POLICY.totalParallaxSpeedBudgetPxPerSec}`
    );
  }

  return {
    pass: failures.length === 0,
    failures,
    metrics,
  };
}
