import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { alphaBounds, readPngAlpha } from "../test-utils/png-alpha.mjs";
import {
  BUILDING_COLLISION_PROFILES,
  CLOUD_COLLISION_PROFILES,
} from "../../../src/engine/obstacleCollisionProfiles.js";

const ROOT = process.cwd();

function relPath(...parts) {
  return path.join(...parts).replaceAll(path.sep, "/");
}

function checkAlphaHull(rel, rules) {
  const full = path.join(ROOT, rel);
  assert.ok(fs.existsSync(full), `missing ${rel}`);

  const hull = alphaBounds(full);
  assert.equal(hull.empty, false, `${rel} has no visible alpha pixels`);
  assert.ok(
    hull.coverageX >= rules.minCoverageX,
    `${rel} visible width coverage ${hull.coverageX.toFixed(2)} < ${rules.minCoverageX}`
  );
  assert.ok(
    hull.coverageY >= rules.minCoverageY,
    `${rel} visible height coverage ${hull.coverageY.toFixed(2)} < ${rules.minCoverageY}`
  );
  assert.ok(
    Math.abs(hull.centerOffsetX) <= rules.maxCenterOffsetX,
    `${rel} visible alpha is horizontally off-center (${hull.centerOffsetX.toFixed(2)})`
  );
  assert.ok(
    Math.abs(hull.centerOffsetY) <= rules.maxCenterOffsetY,
    `${rel} visible alpha is vertically off-center (${hull.centerOffsetY.toFixed(2)})`
  );
  return hull;
}

function assertBandTracksAlpha(alphaData, band, kind, label) {
  const { width, height, alpha } = alphaData;
  const [nx0, nx1, edgeY] = band;
  const x0 = Math.max(0, Math.floor(nx0 * width));
  const x1 = Math.min(width - 1, Math.ceil(nx1 * width));
  const edge = Math.max(
    0,
    Math.min(height - 1, Math.round(edgeY * height))
  );

  const y0 =
    kind === "building"
      ? Math.max(0, edge - 3)
      : Math.max(0, edge - 12);
  const y1 =
    kind === "building"
      ? Math.min(height - 1, edge + 12)
      : Math.min(height - 1, edge + 3);

  let found = false;
  for (let y = y0; y <= y1 && !found; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (alpha[y * width + x] > 16) {
        found = true;
        break;
      }
    }
  }

  assert.ok(found, `${label} collision edge must stay near visible alpha`);
}

test("quality assets: owl frames have tight visible alpha hulls", () => {
  for (let i = 0; i <= 2; i += 1) {
    checkAlphaHull(
      relPath("web", "assets", "sprites", `owl_frame_${i}.png`),
      {
        minCoverageX: 0.88,
        minCoverageY: 0.6,
        maxCenterOffsetX: 0.08,
        maxCenterOffsetY: 0.12,
      }
    );
  }
});

test("quality assets: cloud hazard frames stay readable and collision-profiled", () => {
  assert.equal(
    CLOUD_COLLISION_PROFILES.length,
    6,
    "all six cloud PNGs need collision profiles"
  );

  for (let i = 1; i <= 6; i += 1) {
    const rel = relPath(
      "web",
      "assets",
      "obstacles",
      "clouds",
      `cloud_${i}.png`
    );
    checkAlphaHull(rel, {
      minCoverageX: 0.86,
      minCoverageY: 0.24,
      maxCenterOffsetX: 0.08,
      maxCenterOffsetY: 0.14,
    });

    const alpha = readPngAlpha(path.join(ROOT, rel));
    const profile = CLOUD_COLLISION_PROFILES[i - 1];
    assert.equal(profile.width, alpha.width, `${rel} profile width must match PNG`);
    assert.equal(
      profile.height,
      alpha.height,
      `${rel} profile height must match PNG`
    );
    assert.ok(profile.bands.length >= 6, `${rel} needs enough contour bands`);

    profile.bands.forEach((band, index) => {
      assertBandTracksAlpha(alpha, band, "cloud", `${rel} band ${index}`);
    });
  }
});

test("quality assets: Cozy City buildings stay bottom-anchored and collision-profiled", () => {
  assert.equal(
    BUILDING_COLLISION_PROFILES.length,
    13,
    "all thirteen building PNGs need collision profiles"
  );

  for (let i = 1; i <= 13; i += 1) {
    const padded = String(i).padStart(2, "0");
    const rel = relPath(
      "web",
      "assets",
      "obstacles",
      "buildings",
      `building_${padded}.png`
    );
    const hull = checkAlphaHull(rel, {
      minCoverageX: 0.48,
      minCoverageY: 0.3,
      maxCenterOffsetX: 0.18,
      maxCenterOffsetY: 0.34,
    });

    assert.ok(
      hull.y + hull.h >= hull.height - 12,
      `${rel} visible building must reach the bottom anchor zone`
    );

    const alpha = readPngAlpha(path.join(ROOT, rel));
    const profile = BUILDING_COLLISION_PROFILES[i - 1];
    assert.equal(profile.width, alpha.width, `${rel} profile width must match PNG`);
    assert.equal(
      profile.height,
      alpha.height,
      `${rel} profile height must match PNG`
    );
    assert.ok(profile.bands.length >= 6, `${rel} needs enough roof contour bands`);

    profile.bands.forEach((band, index) => {
      assertBandTracksAlpha(alpha, band, "building", `${rel} band ${index}`);
    });
  }
});
