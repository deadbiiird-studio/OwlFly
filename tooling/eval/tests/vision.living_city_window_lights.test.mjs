import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CITY_DETAIL_CONTRACT,
  ENVIRONMENT_LAYER_CONTRACT,
  ENVIRONMENT_LAYER_ORDER,
  getCityLayerSegments,
  getCityWindowLights,
} from "../../../src/render/environmentGeometry.js";

const EPSILON = 1e-9;

function localize(light, segment) {
  return {
    x: light.x - segment.x,
    y: light.y - segment.y,
    w: light.w,
    h: light.h,
    cellIndex: light.cellIndex,
  };
}

test("B1 living city: far-window detail contract stays sparse and quiet", () => {
  const detail = CITY_DETAIL_CONTRACT.farWindows;

  assert.ok(detail.maxPerSegment <= 4, "B1 must remain sparse per distant building");
  assert.ok(detail.alpha <= 0.20, "B1 lights must stay subordinate to gameplay silhouettes");
  assert.ok(detail.maxWidth <= 2.2, "B1 windows must remain tiny at base resolution");
  assert.ok(detail.height <= 3, "B1 windows must remain tiny at base resolution");
  assert.ok(detail.roofClearance >= 12, "B1 lights must stay clear of roof silhouettes");
  assert.ok(detail.bottomInset >= 8, "B1 lights must not create a ground/route edge cue");
});

test("B1 living city: window placement is deterministic and belongs only to the far layer", () => {
  const far = getCityLayerSegments("far", 8.5, { viewportWidth: 720 });
  assert.ok(far.length > 0);

  for (const segment of far) {
    assert.deepEqual(
      getCityWindowLights("far", segment),
      getCityWindowLights("far", segment),
      `world segment ${segment.worldIndex} must reproduce identical lights`
    );
    assert.deepEqual(getCityWindowLights("mid", segment), []);
    assert.deepEqual(getCityWindowLights("near", segment), []);
  }
});

test("B1 living city: every light remains inside its building body and below the protected flight field", () => {
  const detail = CITY_DETAIL_CONTRACT.farWindows;
  const times = [0, 4.25, 12.5, 30];
  const widths = [360, 480, 720];
  let sampledLights = 0;

  for (const viewportWidth of widths) {
    for (const t of times) {
      const segments = getCityLayerSegments("far", t, { viewportWidth });
      for (const segment of segments) {
        const lights = getCityWindowLights("far", segment);
        assert.ok(lights.length <= detail.maxPerSegment);

        for (const light of lights) {
          sampledLights += 1;
          assert.ok(light.x + EPSILON >= segment.x + detail.sideInset);
          assert.ok(light.x + light.w <= segment.x + segment.w - detail.sideInset + EPSILON);
          assert.ok(light.y + EPSILON >= segment.y + detail.roofClearance);
          assert.ok(light.y + light.h <= segment.y + segment.h - detail.bottomInset + EPSILON);
          assert.ok(light.y >= 500, "B1 detail must stay below the A2 protected upper flight field");

          const areaRatio = (light.w * light.h) / (segment.w * segment.h);
          assert.ok(areaRatio < 0.008, "a single distant window must remain visually tiny");
        }
      }
    }
  }

  assert.ok(sampledLights > 20, "test matrix should exercise a meaningful number of lit windows");
});

test("B1 living city: static light identity follows world segments without flicker or reshuffle", () => {
  const atZero = getCityLayerSegments("far", 0, { viewportWidth: 960 });
  const later = getCityLayerSegments("far", 4.25, { viewportWidth: 960 });
  const laterByIndex = new Map(later.map((segment) => [segment.worldIndex, segment]));
  let compared = 0;

  for (const segment of atZero) {
    const moved = laterByIndex.get(segment.worldIndex);
    if (!moved) continue;

    compared += 1;
    assert.deepEqual(
      getCityWindowLights("far", segment).map((light) => localize(light, segment)),
      getCityWindowLights("far", moved).map((light) => localize(light, moved)),
      `world segment ${segment.worldIndex} must keep the same local light pattern while parallax moves it`
    );
  }

  assert.ok(compared >= 8, "test should compare several shared world segments");
});

test("B1 living city: A3 layer/parallax contract remains sealed", () => {
  assert.deepEqual(ENVIRONMENT_LAYER_ORDER, ["far", "mid", "near"]);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.far.alpha, 0.14);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.far.speedPxPerSec, 5);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.mid.alpha, 0.20);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.mid.speedPxPerSec, 11);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.near.alpha, 0.25);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.near.speedPxPerSec, 20);
});

test("B1 living city: renderer consumes geometry-owned lights only on the far city layer", async () => {
  const rendererUrl = new URL("../../../src/render/renderer.js", import.meta.url);
  const source = await readFile(rendererUrl, "utf8");

  assert.match(source, /getCityWindowLights/);
  assert.match(source, /CITY_DETAIL_CONTRACT\.farWindows/);
  assert.match(source, /layerId === "far"/);
  assert.match(source, /drawCityWindowLights\(ctx, segments, theme\)/);
  assert.doesNotMatch(source, /Math\.random\(/, "B1 renderer must not introduce random detail placement");
});
