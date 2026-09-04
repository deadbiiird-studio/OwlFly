import {
  ENVIRONMENT_LAYER_CONTRACT,
  ENVIRONMENT_LAYER_ORDER,
  getEnvironmentLayerSnapshot,
} from "../../src/render/environmentGeometry.js";
import { auditEnvironmentReadability } from "./readability-policy.mjs";

const SAMPLE_TIMES = [0, 3.5, 11, 29, 61];
const VIEWPORTS = [
  { width: 480, height: 800, label: "base" },
  { width: 360, height: 800, label: "phone-narrow" },
  { width: 720, height: 800, label: "wide" },
];

const reports = [];
let pass = true;

for (const viewport of VIEWPORTS) {
  for (const reducedMotion of [false, true]) {
    for (const t of SAMPLE_TIMES) {
      const snapshot = getEnvironmentLayerSnapshot(t, {
        reducedMotion,
        viewportWidth: viewport.width,
      });

      const report = auditEnvironmentReadability({
        contract: ENVIRONMENT_LAYER_CONTRACT,
        order: ENVIRONMENT_LAYER_ORDER,
        snapshot,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
      });

      reports.push({
        viewport: viewport.label,
        width: viewport.width,
        height: viewport.height,
        t,
        reducedMotion,
        ...report,
      });

      if (!report.pass) pass = false;
    }
  }
}

const failures = reports.flatMap((report) =>
  report.failures.map((failure) => ({
    viewport: report.viewport,
    t: report.t,
    reducedMotion: report.reducedMotion,
    failure,
  }))
);

const worst = {};
for (const report of reports) {
  for (const [layerId, metrics] of Object.entries(report.metrics.layers || {})) {
    if (!worst[layerId]) {
      worst[layerId] = {
        maxAlpha: 0,
        maxSpeedPxPerSec: 0,
        maxSegmentCount: 0,
        maxWidthCoverageRatio: 0,
        minTopY: Infinity,
      };
    }
    const w = worst[layerId];
    w.maxAlpha = Math.max(w.maxAlpha, metrics.alpha || 0);
    w.maxSpeedPxPerSec = Math.max(w.maxSpeedPxPerSec, metrics.speedPxPerSec || 0);
    w.maxSegmentCount = Math.max(w.maxSegmentCount, metrics.segmentCount || 0);
    w.maxWidthCoverageRatio = Math.max(
      w.maxWidthCoverageRatio,
      metrics.widthCoverageRatio || 0
    );
    w.minTopY = Math.min(w.minTopY, metrics.minTopY);
  }
}

console.log("OwlFly visual-readability gate");
for (const [layerId, metrics] of Object.entries(worst)) {
  console.log(
    `${layerId}: alpha=${metrics.maxAlpha.toFixed(2)} speed=${metrics.maxSpeedPxPerSec.toFixed(1)} ` +
      `segments<=${metrics.maxSegmentCount} coverage<=${metrics.maxWidthCoverageRatio.toFixed(3)} ` +
      `top>=${Number.isFinite(metrics.minTopY) ? metrics.minTopY.toFixed(1) : "n/a"}`
  );
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} readability violation(s)`);
  for (const item of failures.slice(0, 20)) {
    console.error(
      `- ${item.viewport} t=${item.t} reducedMotion=${item.reducedMotion}: ${item.failure}`
    );
  }
  if (failures.length > 20) {
    console.error(`- ... ${failures.length - 20} more`);
  }
  process.exitCode = 1;
} else {
  console.log(`PASS: ${reports.length} sampled environment states stayed inside the A2 readability budget`);
}
