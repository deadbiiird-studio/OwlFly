#!/usr/bin/env node
// Ensure the legacy Node and PowerShell assemblers include the modules
// required for accurate collision, visual-fit, and environment rendering.
import fs from "node:fs";
import path from "node:path";

const requirements = [
  ["engine/obstacleCollisionProfiles.js", "engine/entities/obstaclePair.js"],
  ["engine/obstacleVisualFit.js", "engine/entities/obstaclePair.js"],
  ["render/environmentGeometry.js", "render/renderer.js"],
];

for (const buildPath of ["tooling/build.mjs", "tooling/build.ps1"]) {
  const windows = buildPath.endsWith(".ps1");
  const source = fs.readFileSync(buildPath, "utf8");
  if (!source.includes(windows ? "$files = @(" : "const FILES = [")) {
    throw new Error("Unrecognized manifest layout in " + buildPath);
  }

  const lines = source.split(/\r?\n/);
  const quote = (value) =>
    '"' + (windows ? value.replaceAll("/", "\\") : value) + '"';

  for (const [moduleName, dependent] of requirements) {
    if (!fs.existsSync(path.join("src", moduleName))) {
      throw new Error("Missing required source module: src/" + moduleName);
    }

    const key = quote(moduleName);
    const anchor = quote(dependent);
    const at = lines.findIndex((line) => line.includes(anchor));
    if (at < 0) throw new Error("Missing anchor " + dependent + " in " + buildPath);

    const occurrences = lines
      .map((line, i) => line.includes(key) ? i : -1)
      .filter((i) => i >= 0);
    if (occurrences.length > 1) {
      throw new Error("Duplicate " + moduleName + " in " + buildPath);
    }

    if (occurrences.length === 1 && occurrences[0] < at) continue;

    if (occurrences.length === 1) lines.splice(occurrences[0], 1);
    const insertion = lines.findIndex((line) => line.includes(anchor));
    const indent = lines[insertion].match(/^\s*/)[0];
    lines.splice(insertion, 0, indent + key + ",");
    console.log("Restored build order: " + buildPath + " -> " + moduleName);
  }

  const updated = lines.join("\n");
  if (updated !== source) fs.writeFileSync(buildPath, updated, "utf8");
}
