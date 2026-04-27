import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

test("VISION TARGET: glide has its own wings-back owl frames", () => {
  const acceptableSets = [
    [
      "web/assets/sprites/owl_glide_0.png",
      "web/assets/sprites/owl_glide_1.png",
      "web/assets/sprites/owl_glide_2.png",
    ],
    [
      "web/assets/sprites/glide/owl_glide_0.png",
      "web/assets/sprites/glide/owl_glide_1.png",
      "web/assets/sprites/glide/owl_glide_2.png",
    ],
  ];

  const completeSet = acceptableSets.find((set) => set.every(exists));
  assert.ok(
    completeSet,
    "add a complete 3-frame glide owl set with wings-back silhouette"
  );
});
