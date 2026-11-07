#!/usr/bin/env node
/**
 * Google Play Closed testing Alpha preflight.
 *
 * Creates a temporary Play edit, confirms the exact track ID, selects a
 * monotonic versionCode, and returns that edit for the publishing action.
 * On failure, the edit is abandoned; this file never commits an edit.
 *
 * The job containing this script is disabled until the owner explicitly
 * enables OWLFLY_AUTO_ALPHA and configures Google Play credentials.
 */
import fs from "node:fs";

const pkg = "com.owlfly.game";
const token = process.env.PLAY_ACCESS_TOKEN;
const target = process.env.OWLFLY_ALPHA_TRACK_ID || "alpha";
const run = Number(process.env.GITHUB_RUN_NUMBER);
const output = process.env.GITHUB_OUTPUT;
const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + pkg;

if (!token || !output) {
  throw new Error("Missing Play OAuth token or GitHub step output path.");
}
if (!Number.isSafeInteger(run) || run < 1) {
  throw new Error("Invalid GitHub Actions run number.");
}
if (!/^[a-zA-Z0-9_.:-]+$/.test(target) ||
    ["production", "qa", "internal", "beta"].includes(target.toLowerCase()) ||
    target.includes(":")) {
  throw new Error("Unsafe or unsupported closed-testing track ID.");
}

async function api(method, url) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/json",
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" ? { body: "{}" } : {}),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error("Android Publisher API " + method + " failed (HTTP " +
      response.status + ", endpoint " + new URL(url).pathname + ").");
  }
  if (response.status === 204) return {};
  return response.json();
}

const editIdPattern = /^[a-zA-Z0-9_-]+$/;
let editId;
let handedOff = false;
try {
  const created = await api("POST", base + "/edits");
  editId = String(created.id || "");
  if (!editIdPattern.test(editId)) {
    throw new Error("Play API returned an invalid edit identifier.");
  }
  const editUrl = base + "/edits/" + editId;
  const [listed, bundles] = await Promise.all([
    api("GET", editUrl + "/tracks"),
    api("GET", editUrl + "/bundles"),
  ]);

  const tracks = Array.isArray(listed.tracks) ? listed.tracks : [];
  const match = tracks.find((track) => track.track === target);
  if (!match) {
    console.error("Configured Alpha track not found. Play API track IDs: " +
      tracks.map((t) => t.track).filter(Boolean).join(", "));
    throw new Error("Track verification failed: refusing to publish to another track.");
  }

  const codes = [
    ...(Array.isArray(bundles.bundles) ? bundles.bundles.map((b) => b.versionCode) : []),
    ...tracks.flatMap((t) => (t.releases || []).flatMap((r) => r.versionCodes || [])),
  ].map(Number).filter((n) => Number.isSafeInteger(n) && n > 0);

  const previousMax = Math.max(0, ...codes);
  const version = Math.max(previousMax + 1, 100000 + run);
  if (version >= 2100000000) throw new Error("Android versionCode exceeds safe range.");

  const versionName = "1.0." + run;
  console.log("Verified Google Play package: " + pkg);
  console.log("Verified closed-testing track ID: " + target);
  console.log("Highest existing versionCode: " + previousMax);
  console.log("Next versionCode: " + version);

  fs.appendFileSync(output, [
    "edit_id=" + editId,
    "track_id=" + target,
    "version_code=" + version,
    "version_name=" + versionName,
    "",
  ].join("\n"));
  handedOff = true;
} finally {
  if (editId && !handedOff) {
    try {
      await api("DELETE", base + "/edits/" + editId);
      console.log("Abandoned temporary Play edit after failed preflight.");
    } catch (error) {
      console.warn("Could not discard temporary Play edit: " + error.message);
    }
  }
}
