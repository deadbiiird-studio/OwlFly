#!/usr/bin/env node
/**
 * Cleanup a preflight Play edit when the publishing job fails.
 * A completed edit may already be committed; 404 is safe to ignore.
 */
const editId = process.env.PLAY_EDIT_ID;
const token = process.env.PLAY_ACCESS_TOKEN;
if (!editId || !/^[a-zA-Z0-9_-]+$/.test(editId) || !token) {
  console.log("No valid Play edit/token to clean up.");
  process.exit(0);
}
const url = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.owlfly.game/edits/" + editId;
try {
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
    signal: AbortSignal.timeout(30000),
  });
  if (response.ok || response.status === 404) {
    console.log("Play edit cleaned up or already closed.");
  } else {
    console.warn("Unable to clean up Play edit (HTTP " + response.status +
      "). Check Play Console before another release.");
  }
} catch (error) {
  console.warn("Unable to clean up Play edit; inspect release state manually.");
}
