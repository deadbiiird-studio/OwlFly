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
