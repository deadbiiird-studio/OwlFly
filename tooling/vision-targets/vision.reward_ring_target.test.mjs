import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FRACTURE, OWL } from "../../src/core/constants.js";

const ROOT = process.cwd();

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

test("VISION TARGET: glide reward ring should read larger than the owl body", () => {
  const renderedRewardDiameter = FRACTURE.REWARD_RADIUS * 2.4;
  const targetDiameter = OWL.RENDER_W * 1.1;

  assert.ok(
    renderedRewardDiameter >= targetDiameter,
    `reward ring reads too small: rendered ${renderedRewardDiameter.toFixed(1)}px, target >= ${targetDiameter.toFixed(1)}px`
  );
});

test("VISION TARGET: renderer should have an explicit reward sprite candidate, not only fallback art", () => {
  const candidates = [
    "web/assets/rewards/shard.png",
    "web/assets/rewards/reward.png",
    "web/assets/sprites/reward_shard.png",
  ];

  assert.ok(
    candidates.some(exists),
    `add one explicit reward sprite used by boot reward candidates: ${candidates.join(", ")}`
  );
});
