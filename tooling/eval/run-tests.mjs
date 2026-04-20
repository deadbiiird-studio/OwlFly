#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["tooling/eval/tests", "tooling/eval"];

function safeReadDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (
      error?.code === "EPERM" ||
      error?.code === "EACCES" ||
      error?.code === "ENOENT"
    ) {
      console.warn(`Skipping unreadable test path: ${dir} (${error.code})`);
      return null;
    }
    throw error;
  }
}

function collectTestFiles(root) {
  if (!fs.existsSync(root)) return [];

  const out = [];
  const stack = [root];

  while (stack.length) {
    const dir = stack.pop();
    const entries = safeReadDir(dir);
    if (!entries) continue;

    for (const ent of entries) {
      const full = path.join(dir, ent.name);

      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }

      if (ent.isFile() && ent.name.endsWith(".test.mjs")) {
        out.push(full);
      }
    }
  }

  return out;
}

const files = [...new Set(roots.flatMap(collectTestFiles))]
  .map((f) => path.relative(process.cwd(), f))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.error("No *.test.mjs files found under tooling/eval.");
  process.exit(1);
}

console.log(`Found ${files.length} test files.`);
const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);