import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rendererPath = path.join(root, "src/render/renderer.js");
const renderer = fs.readFileSync(rendererPath, "utf8");

test("vision background: distant city renders before ground", () => {
  const farGlowIndex = renderer.indexOf("drawFarGlow(ctx, theme);");
  const backdropIndex = renderer.indexOf("drawDistantCityBackdrop(ctx, t, theme);");
  const groundIndex = renderer.indexOf("drawGround(ctx, t, theme);");

  assert.ok(farGlowIndex >= 0, "drawFarGlow call missing");
  assert.ok(backdropIndex >= 0, "drawDistantCityBackdrop call missing");
  assert.ok(groundIndex >= 0, "drawGround call missing");

  assert.ok(
    farGlowIndex < backdropIndex && backdropIndex < groundIndex,
    "background city should render after far glow and before ground"
  );
});

test("vision background: raised horizon is active", () => {
  assert.match(
    renderer,
    /const horizonY = GAME\.BASE_HEIGHT - 238;/,
    "distant city backdrop should use a higher horizon"
  );

  assert.match(
    renderer,
    /const baseY = GAME\.BASE_HEIGHT - 106;/,
    "distant city skyline should sit above the bottom edge"
  );
});

test("vision background: ground is not a deck or platform strip", () => {
  assert.doesNotMatch(
    renderer,
    /deckTop|contactY|Top deck edge|Dark structural band|city-platform/i,
    "ground should be atmospheric fade only, not a deck/platform"
  );

  assert.doesNotMatch(
    renderer,
    /function drawDistantSkyline/,
    "old unused skyline helper should be removed to prevent background drift"
  );
});
