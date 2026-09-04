import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ENVIRONMENT_LAYER_CONTRACT,
  ENVIRONMENT_LAYER_ORDER,
  getEnvironmentLayerSnapshot,
} from "../../../src/render/environmentGeometry.js";
import {
  READABILITY_POLICY,
  auditEnvironmentReadability,
} from "../readability-policy.mjs";

const ROOT = process.cwd();

function auditAt(t, viewportWidth = 480, reducedMotion = false) {
  return auditEnvironmentReadability({
    contract: ENVIRONMENT_LAYER_CONTRACT,
    order: ENVIRONMENT_LAYER_ORDER,
    snapshot: getEnvironmentLayerSnapshot(t, { reducedMotion, viewportWidth }),
    viewportWidth,
    viewportHeight: 800,
  });
}

test("quality visual readability: sealed A1 skyline stays inside A2 budgets", () => {
  for (const viewportWidth of [360, 480, 720]) {
    for (const reducedMotion of [false, true]) {
      for (const t of [0, 3.5, 11, 29, 61]) {
        const report = auditAt(t, viewportWidth, reducedMotion);
        assert.equal(
          report.pass,
          true,
          `readability failure at width=${viewportWidth} t=${t} reducedMotion=${reducedMotion}: ${report.failures.join("; ")}`
        );
      }
    }
  }
});

test("quality visual readability: upper flight field remains protected from city scenery", () => {
  assert.equal(READABILITY_POLICY.protectedFlightFieldBottomY, 500);

  for (const t of [0, 7, 31]) {
    const report = auditAt(t);
    for (const metrics of Object.values(report.metrics.layers)) {
      assert.ok(
        metrics.minTopY >= READABILITY_POLICY.protectedFlightFieldBottomY,
        `background scenery reached y=${metrics.minTopY}`
      );
    }
  }
});

test("quality visual readability: policy rejects alpha creep before it becomes hazard-like", () => {
  const unsafeContract = {
    ...ENVIRONMENT_LAYER_CONTRACT,
    near: {
      ...ENVIRONMENT_LAYER_CONTRACT.near,
      alpha: READABILITY_POLICY.layers.near.maxAlpha + 0.05,
    },
  };

  const report = auditEnvironmentReadability({
    contract: unsafeContract,
    order: ENVIRONMENT_LAYER_ORDER,
    snapshot: getEnvironmentLayerSnapshot(5, { viewportWidth: 480 }),
    viewportWidth: 480,
    viewportHeight: 800,
  });

  assert.equal(report.pass, false);
  assert.ok(report.failures.some((failure) => failure.includes("near: alpha")));
});

test("quality visual readability: policy rejects scenery entering the protected flight field", () => {
  const snapshot = getEnvironmentLayerSnapshot(5, { viewportWidth: 480 });
  const unsafeSnapshot = {
    ...snapshot,
    far: snapshot.far.map((segment, index) =>
      index === 0 ? { ...segment, y: 470 } : segment
    ),
  };

  const report = auditEnvironmentReadability({
    contract: ENVIRONMENT_LAYER_CONTRACT,
    order: ENVIRONMENT_LAYER_ORDER,
    snapshot: unsafeSnapshot,
    viewportWidth: 480,
    viewportHeight: 800,
  });

  assert.equal(report.pass, false);
  assert.ok(
    report.failures.some((failure) => failure.includes("protected flight field"))
  );
});

test("quality visual readability: policy rejects parallax motion crowding", () => {
  const unsafeContract = {
    ...ENVIRONMENT_LAYER_CONTRACT,
    mid: {
      ...ENVIRONMENT_LAYER_CONTRACT.mid,
      speedPxPerSec: ENVIRONMENT_LAYER_CONTRACT.far.speedPxPerSec + 1,
    },
  };

  const report = auditEnvironmentReadability({
    contract: unsafeContract,
    order: ENVIRONMENT_LAYER_ORDER,
    snapshot: getEnvironmentLayerSnapshot(5, { viewportWidth: 480 }),
    viewportWidth: 480,
    viewportHeight: 800,
  });

  assert.equal(report.pass, false);
  assert.ok(report.failures.some((failure) => failure.includes("parallax separation")));
});

test("quality visual readability: package quality command includes the visual gate", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
  );
  assert.equal(
    pkg.scripts["eval:visual"],
    "node tooling/eval/visual-readability.mjs"
  );
  assert.match(pkg.scripts.quality, /npm run eval:visual/);
});
