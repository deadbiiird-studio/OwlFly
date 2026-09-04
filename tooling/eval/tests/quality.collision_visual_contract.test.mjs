import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  GAME,
  OBSTACLE,
  OWL,
  SPAWN,
} from "../../../src/core/constants.js";
import {
  BUILDING_GAP_COLLISION_REACH,
  ObstaclePair,
} from "../../../src/engine/entities/obstaclePair.js";
import { circleAabbIntersect } from "../../../src/engine/collision.js";
import { alphaBounds } from "../test-utils/png-alpha.mjs";

const ROOT = process.cwd();
const EPS = 0.001;

function spawnPair(overrides = {}) {
  const o = new ObstaclePair();
  o.spawn({
    x: SPAWN.SPAWN_X ?? GAME.BASE_WIDTH + 40,
    topH: 220,
    gap: OBSTACLE.MIN_GAP,
    speed: OBSTACLE.BASE_SPEED,
    ...overrides,
  });
  return o;
}

function assertRectFinite(name, rect) {
  for (const key of ["x", "y", "w", "h"]) {
    assert.ok(Number.isFinite(rect[key]), `${name}.${key} must be finite`);
  }
  assert.ok(rect.w > 0, `${name}.w must be positive`);
  assert.ok(rect.h > 0, `${name}.h must be positive`);
}

function assertBandsFinite(name, bands) {
  assert.ok(
    Array.isArray(bands) && bands.length > 0,
    `${name} needs sprite-aware collision bands`
  );
  bands.forEach((band, index) =>
    assertRectFinite(`${name}.bands[${index}]`, band)
  );
}

function assertInside(label, inner, outer) {
  assert.ok(inner.x + EPS >= outer.x, `${label} x starts before visual outline`);
  assert.ok(inner.y + EPS >= outer.y, `${label} y starts before visual outline`);
  assert.ok(
    inner.x + inner.w <= outer.x + outer.w + EPS,
    `${label} x exceeds visual outline`
  );
  assert.ok(
    inner.y + inner.h <= outer.y + outer.h + EPS,
    `${label} y exceeds visual outline`
  );
}

function effectiveGapAtX(topBands, bottomBands, x) {
  let cloudBottom = -Infinity;
  let buildingTop = Infinity;

  for (const band of topBands) {
    if (x >= band.x && x <= band.x + band.w) {
      cloudBottom = Math.max(cloudBottom, band.y + band.h);
    }
  }

  for (const band of bottomBands) {
    if (x >= band.x && x <= band.x + band.w) {
      buildingTop = Math.min(buildingTop, band.y);
    }
  }

  if (!Number.isFinite(cloudBottom) || !Number.isFinite(buildingTop)) {
    return null;
  }
  return buildingTop - cloudBottom;
}

test("quality collision: legacy obstacle rectangles remain stable while sprite bands drive contact", () => {
  const cases = [
    { topH: OBSTACLE.MIN_TOP, gap: OBSTACLE.MIN_GAP },
    { topH: 180, gap: 236 },
    { topH: 260, gap: OBSTACLE.MIN_GAP },
    {
      topH:
        GAME.BASE_HEIGHT -
        OBSTACLE.MIN_BOTTOM -
        OBSTACLE.MIN_GAP,
      gap: OBSTACLE.MIN_GAP,
    },
  ];

  for (const c of cases) {
    const obstacle = spawnPair(c);
    const rects = obstacle.getRects();
    const visual = obstacle.getVisualBounds();

    assertRectFinite("top", rects.top);
    assertRectFinite("bottom", rects.bottom);
    assertInside(`top hitbox ${JSON.stringify(c)}`, rects.top, visual.top);
    assertInside(`bottom hitbox ${JSON.stringify(c)}`, rects.bottom, visual.bottom);
    assertBandsFinite("top", rects.top.bands);
    assertBandsFinite("bottom", rects.bottom.bands);

    assert.equal(
      Math.round(rects.bottom.y + rects.bottom.h),
      GAME.BASE_HEIGHT,
      "legacy bottom hitbox should remain bottom anchored"
    );
  }
});

test("quality collision: all cloud/building variants receive readable sprite-aware contours", () => {
  const seenClouds = new Set();
  const seenBuildings = new Set();
  let minimumEffectiveGap = Infinity;

  for (let i = 0; i < 220; i += 1) {
    const obstacle = spawnPair({
      topH: OBSTACLE.MIN_TOP + ((i * 17) % 330),
      gap:
        OBSTACLE.MIN_GAP +
        ((i * 11) % (OBSTACLE.MAX_GAP - OBSTACLE.MIN_GAP + 1)),
    });
    const { top, bottom } = obstacle.getRects();

    seenClouds.add(top.spriteIndex);
    seenBuildings.add(bottom.spriteIndex);
    assertBandsFinite(`cloud sprite ${top.spriteIndex}`, top.bands);
    assertBandsFinite(`building sprite ${bottom.spriteIndex}`, bottom.bands);

    const gapBottomY = obstacle.topH + obstacle.gap;
    for (const band of bottom.bands) {
      assert.ok(
        band.y + EPS >= gapBottomY - BUILDING_GAP_COLLISION_REACH,
        `building ${bottom.spriteIndex} collision must not reach more than ${BUILDING_GAP_COLLISION_REACH}px into the nominal gap`
      );
      assert.equal(
        Math.round(band.y + band.h),
        GAME.BASE_HEIGHT,
        "building contour bands stay ground anchored"
      );
    }

    for (const band of top.bands) {
      assert.equal(band.y, 0, "cloud contour bands stay ceiling anchored");
    }

    const minX = Math.min(
      ...top.bands.map((band) => band.x),
      ...bottom.bands.map((band) => band.x)
    );
    const maxX = Math.max(
      ...top.bands.map((band) => band.x + band.w),
      ...bottom.bands.map((band) => band.x + band.w)
    );

    for (let x = minX; x <= maxX; x += 4) {
      const gap = effectiveGapAtX(top.bands, bottom.bands, x);
      if (gap !== null) {
        minimumEffectiveGap = Math.min(minimumEffectiveGap, gap);
      }
    }
  }

  assert.deepEqual(
    [...seenClouds].sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5]
  );
  assert.deepEqual(
    [...seenBuildings].sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  );
  assert.ok(
    minimumEffectiveGap >= 150,
    `effective sprite collision corridor ${minimumEffectiveGap.toFixed(1)}px is too narrow`
  );
});

test("quality collision: circle-vs-AABB honors sprite bands instead of the legacy envelope", () => {
  const rect = {
    x: 0,
    y: 0,
    w: 200,
    h: 200,
    bands: [{ x: 80, y: 80, w: 40, h: 40 }],
  };

  assert.equal(
    circleAabbIntersect(20, 20, 8, rect),
    false,
    "transparent envelope space must not collide"
  );
  assert.equal(
    circleAabbIntersect(100, 100, 8, rect),
    true,
    "visible contour band must collide"
  );
});

test("quality collision: owl hit circle remains inside the visible owl body scale", () => {
  const diameter = OWL.RADIUS * (OWL.HIT_RADIUS_SCALE ?? 1) * 2;

  for (let i = 0; i <= 2; i += 1) {
    const hull = alphaBounds(
      path.join(ROOT, "web", "assets", "sprites", `owl_frame_${i}.png`)
    );
    const renderedAlphaW = OWL.RENDER_W * hull.coverageX;
    const renderedAlphaH =
      OWL.RENDER_W * (hull.height / hull.width) * hull.coverageY;

    assert.ok(
      diameter <= renderedAlphaW * 0.76,
      `owl hit circle too wide for visible frame ${i}`
    );
    assert.ok(
      diameter <= renderedAlphaH * 0.76,
      `owl hit circle too tall for visible frame ${i}`
    );
    assert.ok(
      diameter >= renderedAlphaW * 0.32,
      `owl hit circle too tiny for visible frame ${i}`
    );
  }
});
