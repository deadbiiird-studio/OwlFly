#!/usr/bin/env node
/**
 * Publish OwlFly ONLY to a preverified Google Play closed testing track.
 * Uses a temporary Google access token from GitHub OIDC / WIF.
 *
 * Never calls this script from an unapproved workflow. Preflight has already
 * created an edit and verified the exact target track/version. A successful
 * edit commit makes the closed testing release available to enrolled testers.
 */
import fs from "node:fs";

const token = process.env.PLAY_ACCESS_TOKEN;
const edit = process.env.PLAY_EDIT_ID || "";
const track = process.env.OWLFLY_ALPHA_TRACK_ID || "";
const version = Number(process.env.OWLFLY_VERSION_CODE);
const versionName = process.env.OWLFLY_VERSION_NAME || "";
const bundlePath = "android/app/build/outputs/bundle/release/app-release.aab";
const pkg = "com.owlfly.game";
const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + pkg + "/edits/" + edit;
const uploadBase = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/" + pkg + "/edits/" + edit;

if (!token || !/^[a-zA-Z0-9_-]+$/.test(edit)) {
  throw new Error("Missing temporary Play OAuth access or verified edit ID.");
}
if (!/^[a-zA-Z0-9_.-]+$/.test(track) ||
    ["production", "qa", "internal", "beta"].includes(track.toLowerCase()) ||
    track.includes(":")) {
  throw new Error("Unsafe or missing closed-test track ID.");
}
if (!Number.isSafeInteger(version) || version < 2 || version >= 2100000000) {
  throw new Error("Invalid verified Play versionCode.");
}
if (!/^1\.0\.[0-9]+$/.test(versionName)) {
  throw new Error("Unexpected Play versionName. Refusing to release.");
}
if (!fs.existsSync(bundlePath) || fs.statSync(bundlePath).size < 1024) {
  throw new Error("Signed Android App Bundle is missing or too small.");
}

async function request(method, url, body, contentType, timeout = 30000) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/json",
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    ...(body === undefined ? {} : { body }),
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) {
    // Never print credentials or potentially sensitive response bodies.
    throw new Error("Google Play API " + method + " failed: HTTP " +
      response.status + " (" + new URL(url).pathname + ").");
  }
  return response.json();
}

const bytes = fs.readFileSync(bundlePath);
const bundle = await request(
  "POST",
  uploadBase + "/bundles?uploadType=media",
  bytes,
  "application/octet-stream",
  180000
);
if (Number(bundle.versionCode) !== version) {
  throw new Error("Google Play received an unexpected versionCode; edit remains uncommitted.");
}
console.log("Play accepted signed bundle versionCode " + version + ".");

const release = {
  track,
  releases: [{
    name: versionName,
    versionCodes: [String(version)],
    status: "completed",
    releaseNotes: [{
      language: "en-US",
      text: "OwlFly closed test: Android 16 compatibility and stability updates.",
    }],
  }],
};
const updated = await request(
  "PUT",
  base + "/tracks/" + encodeURIComponent(track),
  JSON.stringify(release),
  "application/json"
);
if (updated.track !== track ||
    !Array.isArray(updated.releases) ||
    !updated.releases.some((r) => (r.versionCodes || []).includes(String(version)))) {
  throw new Error("Play track response does not confirm intended track/version.");
}
// Never cancel an existing Play Console review as a side effect of a CI release.
await request(
  "POST",
  base + ":commit?changesInReviewBehavior=ERROR_IF_IN_REVIEW",
  undefined,
  undefined
);
console.log("Committed OwlFly " + versionName +
  " to closed-testing track " + track + " only.");
