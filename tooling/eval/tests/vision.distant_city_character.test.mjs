import test from "node:test";
import assert from "node:assert/strict";
import {
  DISTANT_CITY_MOTIF,
  ENVIRONMENT_LAYER_CONTRACT,
  ENVIRONMENT_LAYER_ORDER,
  getCityLayerSegments,
  getEnvironmentLayerSnapshot,
} from "../../../src/render/environmentGeometry.js";
import {
  READABILITY_POLICY,
  auditEnvironmentReadability,
} from "../readability-policy.mjs";

function wrapIndex(value, length) {
  return ((value % length) + length) % length;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

test("A3 distant city: authored motif is deliberate, bounded, and uses only quiet roof vocabulary", () => {
  assert.ok(DISTANT_CITY_MOTIF.length >= 8, "distant city needs enough authored beats to read as a phrase");

  for (const [index, beat] of DISTANT_CITY_MOTIF.entries()) {
    assert.ok(beat.height >= 0 && beat.height <= 1, `motif ${index} height must stay normalized`);
    assert.ok(beat.width >= 0 && beat.width <= 1, `motif ${index} width must stay normalized`);
    assert.ok(
      READABILITY_POLICY.allowedRoofTypes.includes(beat.roofType),
      `motif ${index} roof type must remain inside the A2 quiet vocabulary`
    );
  }
});

test("A3 distant city: far skyline follows the authored phrase instead of hash-random proportions", () => {
  const layer = ENVIRONMENT_LAYER_CONTRACT.far;
  const segments = getCityLayerSegments("far", 12.5, { viewportWidth: 720 });

  for (const segment of segments) {
    const expectedIndex = wrapIndex(segment.worldIndex, DISTANT_CITY_MOTIF.length);
    const expected = DISTANT_CITY_MOTIF[expectedIndex];

    assert.equal(segment.motifIndex, expectedIndex);
    assert.equal(segment.roofType, expected.roofType);
    assert.equal(segment.w, lerp(layer.widthMin, layer.widthMax, expected.width));
    assert.equal(segment.h, lerp(layer.minHeight, layer.maxHeight, expected.height));
    assert.equal(segment.y, layer.baseY - segment.h);
  }
});

test("A3 distant city: authored phrase repeats consistently across world space", () => {
  const segments = getCityLayerSegments("far", 0, { viewportWidth: 960 });
  const byWorldIndex = new Map(segments.map((segment) => [segment.worldIndex, segment]));
  const period = DISTANT_CITY_MOTIF.length;

  let compared = 0;
  for (const segment of segments) {
    const repeated = byWorldIndex.get(segment.worldIndex + period);
    if (!repeated) continue;

    compared += 1;
    assert.equal(repeated.motifIndex, segment.motifIndex);
    assert.equal(repeated.w, segment.w);
    assert.equal(repeated.h, segment.h);
    assert.equal(repeated.roofType, segment.roofType);
  }

  assert.ok(compared >= 4, "test viewport should contain several repeated authored beats");
});

test("A3 distant city: authored character remains inside the complete A2 readability gate", () => {
  const widths = [360, 480, 720];
  const times = [0, 4.25, 12.5, 30];

  for (const viewportWidth of widths) {
    for (const reducedMotion of [false, true]) {
      for (const t of times) {
        const snapshot = getEnvironmentLayerSnapshot(t, {
          reducedMotion,
          viewportWidth,
        });
        const result = auditEnvironmentReadability({
          contract: ENVIRONMENT_LAYER_CONTRACT,
          order: ENVIRONMENT_LAYER_ORDER,
          snapshot,
          viewportWidth,
          viewportHeight: 800,
        });

        assert.equal(
          result.pass,
          true,
          `A3 must stay inside A2 budgets at width=${viewportWidth}, t=${t}, reducedMotion=${reducedMotion}: ${result.failures.join("; ")}`
        );
      }
    }
  }
});

test("A3 distant city: gameplay-independent layer contract remains unchanged", () => {
  assert.deepEqual(ENVIRONMENT_LAYER_ORDER, ["far", "mid", "near"]);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.far.alpha, 0.14);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.far.speedPxPerSec, 5);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.mid.speedPxPerSec, 11);
  assert.equal(ENVIRONMENT_LAYER_CONTRACT.near.speedPxPerSec, 20);
});
