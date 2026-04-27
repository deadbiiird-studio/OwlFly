import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rendererPath = path.join(root, "src/render/renderer.js");
const renderer = fs.readFileSync(rendererPath, "utf8");

test("building visual baseline should connect close to the bottom edge without sinking", () => {
  assert.match(
    renderer,
    /const groundAnchorY = GAME\.BASE_HEIGHT - 8;/,
    "building visual baseline should connect near the ground instead of hovering"
  );

  assert.doesNotMatch(
    renderer,
    /const visualBottomY = GAME\.BASE_HEIGHT \+ 52;/,
    "building visual bottom must not be pushed below the screen"
  );
});

test("vision buildings: renderer still uses bottom-anchored draw math", () => {
  assert.match(
    renderer,
    /const y = groundAnchorY - spriteH;/,
    "building y-position should remain derived from baseline minus sprite height"
  );
});