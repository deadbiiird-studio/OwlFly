import test from "node:test";
import assert from "node:assert/strict";
import { GAME, OBSTACLE, OWL, SPAWN } from "../../../src/core/constants.js";
import { ObstaclePair } from "../../../src/engine/entities/obstaclePair.js";
import { alphaBounds } from "../test-utils/png-alpha.mjs";
import path from "node:path";

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

function assertInside(label, inner, outer) {
  assert.ok(inner.x + EPS >= outer.x, `${label} x starts before visual outline`);
  assert.ok(inner.y + EPS >= outer.y, `${label} y starts before visual outline`);
  assert.ok(inner.x + inner.w <= outer.x + outer.w + EPS, `${label} x exceeds visual outline`);
  assert.ok(inner.y + inner.h <= outer.y + outer.h + EPS, `${label} y exceeds visual outline`);
}

test("quality collision: obstacle hitboxes stay inside their visual bounds and outside the open gap", () => {
  const cases = [
    { topH: OBSTACLE.MIN_TOP, gap: OBSTACLE.MIN_GAP },
    { topH: 180, gap: 236 },
    { topH: 260, gap: OBSTACLE.MIN_GAP },
    { topH: GAME.BASE_HEIGHT - OBSTACLE.MIN_BOTTOM - OBSTACLE.MIN_GAP, gap: OBSTACLE.MIN_GAP },
  ];

  for (const c of cases) {
    const obstacle = spawnPair(c);
    const rects = obstacle.getRects();
    const visual = obstacle.getVisualBounds();

    assertRectFinite("top", rects.top);
    assertRectFinite("bottom", rects.bottom);
    assertInside(`top hitbox ${JSON.stringify(c)}`, rects.top, visual.top);
    assertInside(`bottom hitbox ${JSON.stringify(c)}`, rects.bottom, visual.bottom);

    assert.ok(rects.top.y + rects.top.h <= obstacle.topH + EPS, "top hitbox must not enter readable gap");
    assert.ok(rects.bottom.y + EPS >= obstacle.topH + obstacle.gap, "bottom hitbox must not enter readable gap");
    assert.equal(Math.round(rects.bottom.y + rects.bottom.h), GAME.BASE_HEIGHT, "bottom hitbox should remain bottom anchored");
  }
});

test("quality collision: owl hit circle remains inside the visible owl body scale", () => {
  const diameter = OWL.RADIUS * (OWL.HIT_RADIUS_SCALE ?? 1) * 2;

  for (let i = 0; i <= 2; i += 1) {
    const hull = alphaBounds(path.join(ROOT, "web", "assets", "sprites", `owl_frame_${i}.png`));
    const renderedAlphaW = OWL.RENDER_W * hull.coverageX;
    const renderedAlphaH = OWL.RENDER_W * (hull.height / hull.width) * hull.coverageY;

    assert.ok(diameter <= renderedAlphaW * 0.76, `owl hit circle too wide for visible frame ${i}`);
    assert.ok(diameter <= renderedAlphaH * 0.76, `owl hit circle too tall for visible frame ${i}`);
    assert.ok(diameter >= renderedAlphaW * 0.32, `owl hit circle too tiny for visible frame ${i}`);
  }
});
