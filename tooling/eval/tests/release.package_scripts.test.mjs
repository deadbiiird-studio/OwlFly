import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("release scripts: quality gates are wired into package.json", () => {
  for (const script of ["dev", "build", "build:ps", "test", "eval", "eval:baseline", "eval:repro", "eval:gate", "quality"]) {
    assert.ok(pkg.scripts?.[script], `missing npm script: ${script}`);
  }

  assert.match(pkg.scripts.test, /tooling\/eval\/run-tests\.mjs/, "npm test should use the repo test collector");
  assert.match(pkg.scripts["eval:gate"], /tooling\/eval\/gate\.mjs/, "eval:gate should run the release gate script");
});

test("release scripts: collision profiles are bundled before ObstaclePair on every build path", () => {
  for (const buildFile of ["tooling/build.mjs", "tooling/build.ps1"]) {
    const source = fs.readFileSync(buildFile, "utf8");
    const profilesAt = source.indexOf("obstacleCollisionProfiles.js");
    const obstaclePairAt = source.indexOf("obstaclePair.js");

    assert.ok(profilesAt >= 0, `${buildFile} missing obstacleCollisionProfiles.js`);
    assert.ok(obstaclePairAt >= 0, `${buildFile} missing obstaclePair.js`);
    assert.ok(profilesAt < obstaclePairAt, `${buildFile} must bundle collision profiles before ObstaclePair`);
  }
});
