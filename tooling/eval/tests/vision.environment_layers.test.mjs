import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ENVIRONMENT_LAYER_CONTRACT,
  ENVIRONMENT_LAYER_ORDER,
  getCityLayerSegments,
} from "../../../src/render/environmentGeometry.js";
import { GAME } from "../../../src/core/constants.js";

const ROOT = process.cwd();

function source(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

test("vision atmosphere: city depth contract is ordered far to near", () => {
  assert.deepEqual(ENVIRONMENT_LAYER_ORDER, ["far", "mid", "near"]);

  const far = ENVIRONMENT_LAYER_CONTRACT.far;
  const mid = ENVIRONMENT_LAYER_CONTRACT.mid;
  const near = ENVIRONMENT_LAYER_CONTRACT.near;

  assert.ok(far.depth < mid.depth && mid.depth < near.depth, "depth must increase toward camera");
  assert.ok(
    far.speedPxPerSec < mid.speedPxPerSec && mid.speedPxPerSec < near.speedPxPerSec,
    "parallax speed must increase toward camera"
  );
  assert.ok(far.baseY < mid.baseY && mid.baseY < near.baseY, "nearer layers should sit lower in frame");

  for (const layer of [far, mid, near]) {
    assert.ok(layer.alpha > 0 && layer.alpha <= 0.25, `${layer.id} alpha must stay background-safe`);
    assert.ok(layer.widthMin > 0 && layer.widthMax >= layer.widthMin, `${layer.id} width range invalid`);
    assert.ok(layer.minHeight > 0 && layer.maxHeight >= layer.minHeight, `${layer.id} height range invalid`);
  }
});

test("vision atmosphere: skyline generation is deterministic and bounded below the upper flight field", () => {
  for (const layerId of ENVIRONMENT_LAYER_ORDER) {
    const a = getCityLayerSegments(layerId, 12.5, { viewportWidth: GAME.BASE_WIDTH });
    const b = getCityLayerSegments(layerId, 12.5, { viewportWidth: GAME.BASE_WIDTH });
    assert.deepEqual(a, b, `${layerId} skyline should be deterministic for the same time`);
    assert.ok(a.length >= 8, `${layerId} skyline should cover the viewport with enough segments`);

    for (const segment of a) {
      assert.ok(Number.isFinite(segment.x), `${layerId} x must be finite`);
      assert.ok(Number.isFinite(segment.y), `${layerId} y must be finite`);
      assert.ok(segment.w > 0 && segment.h > 0, `${layerId} segment dimensions must be positive`);
      assert.ok(segment.y >= 500, `${layerId} scenery must stay out of the upper flight field`);
      assert.ok(segment.y + segment.h <= GAME.BASE_HEIGHT, `${layerId} scenery must remain inside base canvas`);
      assert.ok([0, 1, 2].includes(segment.roofType), `${layerId} roof type must stay in approved quiet set`);
    }
  }
});

test("vision atmosphere: reduced motion freezes parallax without changing geometry language", () => {
  for (const layerId of ENVIRONMENT_LAYER_ORDER) {
    const atZero = getCityLayerSegments(layerId, 0, {
      reducedMotion: true,
      viewportWidth: GAME.BASE_WIDTH,
    });
    const muchLater = getCityLayerSegments(layerId, 999, {
      reducedMotion: true,
      viewportWidth: GAME.BASE_WIDTH,
    });
    assert.deepEqual(muchLater, atZero, `${layerId} reduced-motion skyline must remain stationary`);
  }
});

test("vision atmosphere: normal motion actually produces layered parallax", () => {
  for (const layerId of ENVIRONMENT_LAYER_ORDER) {
    const a = getCityLayerSegments(layerId, 1, { viewportWidth: GAME.BASE_WIDTH });
    const b = getCityLayerSegments(layerId, 2, { viewportWidth: GAME.BASE_WIDTH });
    assert.notDeepEqual(a, b, `${layerId} skyline should move during normal motion`);
  }
});

test("vision atmosphere: renderer composes city depth behind ground and hazards", () => {
  const renderer = source("src/render/renderer.js");
  const cityAt = renderer.indexOf("drawCityDepthLayers(ctx, t, theme, reducedMotion)");
  const groundAt = renderer.indexOf("drawGround(ctx, t, theme)");
  const obstacleLoopAt = renderer.indexOf("for (const obstacle of spawner.active)");

  assert.ok(cityAt >= 0, "renderer must compose the city depth layer");
  assert.ok(groundAt > cityAt, "ground must render after non-collision city depth");
  assert.ok(obstacleLoopAt > groundAt, "gameplay hazards must render after background city layers");
});

test("vision atmosphere: every production build path loads environment geometry before renderer", () => {
  const nodeBuild = source("tooling/build.mjs");
  const psBuild = source("tooling/build.ps1");

  for (const [label, build, environmentMarker, rendererMarker] of [
    ["node", nodeBuild, '"render/environmentGeometry.js"', '"render/renderer.js"'],
    ["powershell", psBuild, '"render\\environmentGeometry.js"', '"render\\renderer.js"'],
  ]) {
    const environmentAt = build.indexOf(environmentMarker);
    const rendererAt = build.indexOf(rendererMarker);
    assert.ok(environmentAt >= 0, `${label} build missing environmentGeometry.js`);
    assert.ok(rendererAt >= 0, `${label} build missing renderer.js`);
    assert.ok(environmentAt < rendererAt, `${label} build must load environment geometry before renderer`);
  }
});
