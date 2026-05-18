import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("quality eval: obstacle deaths include actionable death context", () => {
  const result = spawnSync(process.execPath, [
    "tooling/eval/sim.mjs",
    "--seeds", "8",
    "--time", "20",
    "--bot", "humanish_lag",
    "--json",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);

  assert.ok(report.summary?.deathContexts, "summary.deathContexts must exist");

  const obstacleDeaths = report.runs.filter((run) =>
    run.death === "top_obstacle" || run.death === "bottom_obstacle"
  );

  assert.ok(obstacleDeaths.length > 0, "smoke sim should produce at least one obstacle death");

  for (const run of obstacleDeaths) {
    assert.ok(run.deathContext, `seed ${run.seed} must include deathContext`);
    assert.match(run.deathContext.kind, /^(top|bottom)_(fair_hit|edge_brush|gap_edge_brush)$/);
    assert.equal(typeof run.deathContext.penetrationPx, "number");
    assert.equal(typeof run.deathContext.gapCenterY, "number");
  }
});
