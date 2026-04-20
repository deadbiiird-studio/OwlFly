import fs from "node:fs";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function pctDelta(a, b) {
  if (a === 0) return b === 0 ? 0 : 100;
  return ((b - a) / Math.abs(a)) * 100;
}

function printMetric(label, before, after, higherIsBetter = true) {
  const delta = pctDelta(before, after);
  const sign = delta > 0 ? "+" : "";
  const better =
    after === before
      ? "flat"
      : higherIsBetter
      ? after > before
        ? "better"
        : "worse"
      : after < before
      ? "better"
      : "worse";

  console.log(
    `${label}: ${before} -> ${after} (${sign}${delta.toFixed(2)}%, ${better})`
  );
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.baseline || !args.current) {
    console.error("Usage: node tooling/eval/compare.mjs --baseline baseline.json --current current.json");
    process.exit(1);
  }

  const base = loadJson(args.baseline);
  const curr = loadJson(args.current);

  console.log("OwlFly compare");
  printMetric("scoreAvg", base.summary.scoreAvg, curr.summary.scoreAvg, true);
  printMetric("scoreP50", base.summary.scoreP50, curr.summary.scoreP50, true);
  printMetric("scoreP90", base.summary.scoreP90, curr.summary.scoreP90, true);
  printMetric("durationAvg", base.summary.durationAvg, curr.summary.durationAvg, true);
  printMetric(
    "centerShiftP95Avg",
    base.summary.centerShiftP95Avg,
    curr.summary.centerShiftP95Avg,
    false
  );

  console.log("death counts baseline:", JSON.stringify(base.summary.deaths));
  console.log("death counts current :", JSON.stringify(curr.summary.deaths));
}

main();