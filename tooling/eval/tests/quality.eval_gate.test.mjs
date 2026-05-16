import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const output = "tooling/eval/gate-results.test.json";

test("quality eval gate: sim gate runs and writes a structured report", () => {
  try { fs.rmSync(output, { force: true }); } catch {}

  const result = spawnSync(process.execPath, [
    "tooling/eval/gate.mjs",
    "--seeds", "8",
    "--time", "12",
    "--bot", "humanish_lag",
    "--minScoreP50", "0",
    "--minScoreAvg", "0",
    "--minDurationAvg", "2",
    "--output", output,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(fs.existsSync(output), "gate did not write its report");

  const gate = JSON.parse(fs.readFileSync(output, "utf8"));
  assert.equal(gate.ok, true);
  assert.ok(Array.isArray(gate.checks) && gate.checks.length >= 5, "gate report missing checks");
  assert.equal(gate.report.meta.runs, 8);
});
