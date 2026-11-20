import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CITY_DETAIL_CONTRACT,
  ENVIRONMENT_LAYER_CONTRACT,
  ENVIRONMENT_LAYER_ORDER,
  getCityLayerSegments,
  getCityRooftopAntennas,
  getCityWindowLights,
} from "../../../src/render/environmentGeometry.js";

const EPSILON = 1e-9;

function localize(antenna, segment) {
  return {
    x: antenna.x - segment.x,
    y: antenna.y - segment.y,
    w: antenna.w,
    h: antenna.h,
    crossbarX: antenna.crossbarX - segment.x,
    crossbarY: antenna.crossbarY - segment.y,
    crossbarW: antenna.crossbarW,
    crossbarH: antenna.crossbarH,
  };
}

function assertNear(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= EPSILON, `${message}: ${actual} != ${expected}`);
}

test("B2 living city: antenna contract stays sparse, tiny, and background-only", () => {
  const detail = CITY_DETAIL_CONTRACT.farAntennas;

  assert.equal(detail.maxPerSegment, 1);
  assert.ok(detail.occupancyThreshold <= 0.35);
  assert.ok(detail.maxHeight <= 7);
  assert.ok(detail.mastWidth <= 1);
  assert.ok(detail.crossbarWidth <= 3);
  assert.equal(detail.protectedFlightFieldBottomY, 500);
});

test("B2 living city: antennas are deterministic and belong only to the far layer", () => {
  const segments = getCityLayerSegments("far", 8.5, { viewportWidth: 960 });
  let present = 0;

  for (const segment of segments) {
    const first = getCityRooftopAntennas("far", segment);
    const second = getCityRooftopAntennas("far", segment);
    assert.deepEqual(first, second);
    assert.ok(first.length <= 1);
    present += first.length;

    assert.deepEqual(getCityRooftopAntennas("mid", segment), []);
    assert.deepEqual(getCityRooftopAntennas("near", segment), []);
  }

  assert.ok(present >= 4, "wide test viewport should include several sparse antennas");
  assert.ok(present < segments.length, "B2 must not decorate every roof");
});

test("B2 living city: every antenna stays attached to its roof and below the protected field", () => {
  for (const t of [0, 4.25, 12.5, 30]) {
    for (const segment of getCityLayerSegments("far", t, { viewportWidth: 720 })) {
      for (const antenna of getCityRooftopAntennas("far", segment)) {
        assert.ok(antenna.x >= segment.x && antenna.x + antenna.w <= segment.x + segment.w + EPSILON);
        assert.ok(antenna.y >= CITY_DETAIL_CONTRACT.farAntennas.protectedFlightFieldBottomY);
        assertNear(antenna.y + antenna.h, antenna.roofY, "mast must terminate at roof anchor");
        assert.ok(antenna.crossbarY >= antenna.y && antenna.crossbarY <= antenna.roofY);
      }
    }
  }
});

test("B2 living city: antenna identity follows world segments while parallax moves", () => {
  const atZero = getCityLayerSegments("far", 0, { viewportWidth: 960 });
  const later = getCityLayerSegments("far", 4.25, { viewportWidth: 960 });
  const laterByIndex = new Map(later.map((segment) => [segment.worldIndex, segment]));
  let compared = 0;

  for (const segment of atZero) {
    const moved = laterByIndex.get(segment.worldIndex);
    if (!moved) continue;

    const a = getCityRooftopAntennas("far", segment).map((item) => localize(item, segment));
    const b = getCityRooftopAntennas("far", moved).map((item) => localize(item, moved));
    assert.equal(a.length, b.length);

    for (let i = 0; i < a.length; i += 1) {
      for (const key of Object.keys(a[i])) {
        assertNear(a[i][key], b[i][key], `world ${segment.worldIndex} ${key}`);
      }
    }
    compared += 1;
  }

  assert.ok(compared >= 8);
});

test("B2 living city: B1 windows and sealed parallax remain independent", () => {
  const sample = getCityLayerSegments("far", 7.25, { viewportWidth: 720 });
  for (const segment of sample) {
    assert.deepEqual(
      getCityWindowLights("far", segment),
      getCityWindowLights("far", segment),
      "B2 must not mutate B1 window identity"
    );
  }

  assert.deepEqual(ENVIRONMENT_LAYER_ORDER, ["far", "mid", "near"]);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.far.alpha, 0.14);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.far.speedPxPerSec, 5);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.mid.speedPxPerSec, 11);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.near.speedPxPerSec, 20);
});

test("B2 living city: renderer draws antennas as silhouette geometry before warm windows", async () => {
  const source = await readFile(new URL("../../../src/render/renderer.js", import.meta.url), "utf8");

  assert.match(source, /getCityRooftopAntennas/);
  assert.match(source, /drawCityRooftopAntennas\(ctx, segments\)/);
  const antennaAt = source.indexOf("drawCityRooftopAntennas(ctx, segments)");
  const windowAt = source.indexOf("drawCityWindowLights(ctx, segments, theme)");
  assert.ok(antennaAt >= 0 && windowAt > antennaAt);
  assert.doesNotMatch(source, /Math\.random\(/);
});
