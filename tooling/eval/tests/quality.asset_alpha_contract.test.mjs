import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { alphaBounds } from "../test-utils/png-alpha.mjs";

const ROOT = process.cwd();

function relPath(...parts) {
  return path.join(...parts).replaceAll(path.sep, "/");
}

function checkAlphaHull(rel, rules) {
  const full = path.join(ROOT, rel);
  assert.ok(fs.existsSync(full), `missing ${rel}`);

  const hull = alphaBounds(full);
  assert.equal(hull.empty, false, `${rel} has no visible alpha pixels`);
  assert.ok(hull.coverageX >= rules.minCoverageX, `${rel} visible width coverage ${hull.coverageX.toFixed(2)} < ${rules.minCoverageX}`);
  assert.ok(hull.coverageY >= rules.minCoverageY, `${rel} visible height coverage ${hull.coverageY.toFixed(2)} < ${rules.minCoverageY}`);
  assert.ok(Math.abs(hull.centerOffsetX) <= rules.maxCenterOffsetX, `${rel} visible alpha is horizontally off-center (${hull.centerOffsetX.toFixed(2)})`);
  assert.ok(Math.abs(hull.centerOffsetY) <= rules.maxCenterOffsetY, `${rel} visible alpha is vertically off-center (${hull.centerOffsetY.toFixed(2)})`);
}

test("quality assets: owl frames have tight visible alpha hulls", () => {
  for (let i = 0; i <= 2; i += 1) {
    checkAlphaHull(relPath("web", "assets", "sprites", `owl_frame_${i}.png`), {
      minCoverageX: 0.88,
      minCoverageY: 0.6,
      maxCenterOffsetX: 0.08,
      maxCenterOffsetY: 0.12,
    });
  }
});

test("quality assets: cloud hazard frames are wide enough to read on phone screens", () => {
  for (let i = 1; i <= 6; i += 1) {
    checkAlphaHull(relPath("web", "assets", "obstacles", "clouds", `cloud_${i}.png`), {
      minCoverageX: 0.86,
      minCoverageY: 0.24,
      maxCenterOffsetX: 0.08,
      maxCenterOffsetY: 0.14,
    });
  }
});

test("quality assets: building frames have enough visible outline for bottom collisions", () => {
  for (let i = 1; i <= 13; i += 1) {
    const padded = String(i).padStart(2, "0");
    checkAlphaHull(relPath("web", "assets", "obstacles", "buildings", `building_${padded}.png`), {
      minCoverageX: 0.48,
      minCoverageY: 0.3,
      maxCenterOffsetX: 0.18,
      maxCenterOffsetY: 0.34,
    });
  }
});
