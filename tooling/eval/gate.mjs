#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { OBSTACLE, SPAWN } from "../../src/core/constants.js";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function numberArg(args, key, fallback) {
  const value = Number(args[key] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

function fail(message, details = {}) {
  return { ok: false, message, details };
}

function pass(message, details = {}) {
  return { ok: true, message, details };
}

function runSim({ seeds, time, bot, seedStart }) {
  const result = spawnSync(process.execPath, [
    "tooling/eval/sim.mjs",
    "--seeds", String(seeds),
    "--time", String(time),
    "--bot", bot,
    "--seedStart", String(seedStart),
    "--json",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`sim failed with exit ${result.status}:\n${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout);
}

function evaluate(report, args) {
  const summary = report.summary || {};
  const runs = Math.max(1, report.meta?.runs || report.runs?.length || 1);
  const deaths = summary.deaths || {};
  const boundDeaths = (deaths.top_bound || 0) + (deaths.bottom_bound || 0);
  const failureRate = (summary.failures || 0) / runs;
  const boundDeathRate = boundDeaths / runs;

  const thresholds = {
    minScoreP50: numberArg(args, "minScoreP50", 3),
    minScoreAvg: numberArg(args, "minScoreAvg", 4),
    minDurationAvg: numberArg(args, "minDurationAvg", 7),
    maxCenterShiftP95Avg: numberArg(args, "maxCenterShiftP95Avg", (SPAWN.MAX_CENTER_SHIFT_PX ?? 90) + 5),
    minGapOverall: numberArg(args, "minGapOverall", OBSTACLE.MIN_GAP),
    maxBoundDeathRate: numberArg(args, "maxBoundDeathRate", 0.05),
    maxFailureRate: numberArg(args, "maxFailureRate", 1),
  };

  return [
    summary.scoreP50 >= thresholds.minScoreP50
      ? pass("median score is inside playable smoke range", { actual: summary.scoreP50, min: thresholds.minScoreP50 })
      : fail("median score fell below playable smoke range", { actual: summary.scoreP50, min: thresholds.minScoreP50 }),

    summary.scoreAvg >= thresholds.minScoreAvg
      ? pass("average score is inside playable smoke range", { actual: summary.scoreAvg, min: thresholds.minScoreAvg })
      : fail("average score fell below playable smoke range", { actual: summary.scoreAvg, min: thresholds.minScoreAvg }),

    summary.durationAvg >= thresholds.minDurationAvg
      ? pass("average survival time is inside playable smoke range", { actual: summary.durationAvg, min: thresholds.minDurationAvg })
      : fail("average survival time fell below playable smoke range", { actual: summary.durationAvg, min: thresholds.minDurationAvg }),

    summary.centerShiftP95Avg <= thresholds.maxCenterShiftP95Avg
      ? pass("gap center movement remains readable", { actual: summary.centerShiftP95Avg, max: thresholds.maxCenterShiftP95Avg })
      : fail("gap center movement got too jumpy", { actual: summary.centerShiftP95Avg, max: thresholds.maxCenterShiftP95Avg }),

    summary.gapMinOverall >= thresholds.minGapOverall
      ? pass("minimum gap respects readability floor", { actual: summary.gapMinOverall, min: thresholds.minGapOverall })
      : fail("minimum gap fell below readability floor", { actual: summary.gapMinOverall, min: thresholds.minGapOverall }),

    boundDeathRate <= thresholds.maxBoundDeathRate
      ? pass("boundary deaths stay rare", { actual: boundDeathRate, max: thresholds.maxBoundDeathRate, boundDeaths })
      : fail("too many deaths hit world bounds instead of obstacles", { actual: boundDeathRate, max: thresholds.maxBoundDeathRate, boundDeaths }),

    failureRate <= thresholds.maxFailureRate
      ? pass("simulation failure rate is inside configured allowance", { actual: failureRate, max: thresholds.maxFailureRate })
      : fail("simulation failure rate exceeded configured allowance", { actual: failureRate, max: thresholds.maxFailureRate }),
  ];
}

function printGate(report, checks, outputPath) {
  console.log(`OwlFly eval gate — bot=${report.meta.bot} runs=${report.meta.runs} time=${report.meta.timeLimitSec}s`);
  console.log(`score avg=${report.summary.scoreAvg} p50=${report.summary.scoreP50} p90=${report.summary.scoreP90}`);
  console.log(`duration avg=${report.summary.durationAvg}s gapMin=${report.summary.gapMinOverall} shiftP95Avg=${report.summary.centerShiftP95Avg}`);
  console.log(`deaths=${JSON.stringify(report.summary.deaths)}`);
  console.log("");

  for (const check of checks) {
    const icon = check.ok ? "PASS" : "FAIL";
    console.log(`${icon}: ${check.message} ${JSON.stringify(check.details)}`);
  }

  console.log(`\nWrote ${outputPath}`);
}

function main() {
  const args = parseArgs(process.argv);
  const seeds = numberArg(args, "seeds", 40);
  const time = numberArg(args, "time", 45);
  const seedStart = numberArg(args, "seedStart", 1000);
  const bot = String(args.bot ?? "humanish_lag");
  const outputPath = path.resolve(String(args.output ?? "tooling/eval/gate-results.json"));

  const report = runSim({ seeds, time, bot, seedStart });
  const checks = evaluate(report, args);
  const ok = checks.every((check) => check.ok);
  const gate = {
    ok,
    generatedAt: new Date().toISOString(),
    thresholds: Object.fromEntries(checks.map((check) => [check.message, check.details])),
    report,
    checks,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(gate, null, 2)}\n`);

  printGate(report, checks, path.relative(process.cwd(), outputPath));
  if (!ok) process.exit(1);
}

main();
