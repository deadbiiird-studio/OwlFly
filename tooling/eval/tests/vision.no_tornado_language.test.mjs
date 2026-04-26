import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const obstaclePairPath = path.join(root, "src/engine/entities/obstaclePair.js");
const obstaclePair = fs.readFileSync(obstaclePairPath, "utf8");

test("vision language: obstacle pair uses building terminology instead of tornado terminology", () => {
  assert.doesNotMatch(
    obstaclePair,
    /TORNADO|tornado|Tornado/,
    "ObstaclePair should describe the bottom hazard as buildings, not tornadoes"
  );

  assert.match(
    obstaclePair,
    /BUILDING_HITBOX_HEIGHT/,
    "bottom hitbox should use building constants"
  );

  assert.match(
    obstaclePair,
    /BUILDING_VISUAL_MIN_HEIGHT/,
    "bottom visual bounds should use building constants"
  );
});

test("vision buildings: render hints lower building contact line toward screen bottom", () => {
  assert.match(
    obstaclePair,
    /BUILDING_GROUND_VISUAL_INSET \?\? 8/,
    "building ground inset should default to 8 so buildings sit lower"
  );
});