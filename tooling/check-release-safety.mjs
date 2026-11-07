#!/usr/bin/env node
// Fail fast if the public source contains release keys or changes the Play ID.
import fs from "node:fs";

const gradle = fs.readFileSync("android/app/build.gradle", "utf8");
const config = JSON.parse(fs.readFileSync("capacitor.config.json", "utf8"));
const ignored = fs.readFileSync(".gitignore", "utf8");

const checks = [
  [/\bcompileSdk\s+36\b/.test(gradle), 'Play 2026: compileSdk API 36 required'],
  [/\btargetSdkVersion\s+36\b/.test(gradle), 'Play 2026: targetSdk API 36 required'],
  [/\bminSdkVersion\s+24\b/.test(gradle), 'Capacitor 8 minimum SDK 24 required'],
  [config.appId === "com.owlfly.game", "Capacitor package ID must remain com.owlfly.game"],
  [/applicationId\s+["']com\.owlfly\.game["']/.test(gradle), "Gradle package ID must remain com.owlfly.game"],
  [!/^\s*(?:storePassword|keyPassword)\s+["'][^"']+["']/m.test(gradle), "Hardcoded signing password detected"],
  [!/storeFile\s+file\s*\(\s*["']/.test(gradle), "Hardcoded signing key path detected"],
  [/^\*\.jks\s*$/m.test(ignored), "Keystores must be gitignored"],
];
let errors = 0;
for (const [ok, description] of checks) {
  console.log((ok ? "PASS: " : "FAIL: ") + description);
  if (!ok) errors++;
}
if (errors) process.exit(1);
