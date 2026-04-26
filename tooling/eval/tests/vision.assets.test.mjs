import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function firstExisting(candidates) {
  return candidates.find((rel) => exists(rel)) || null;
}

function pngSize(rel) {
  const file = path.join(ROOT, rel);
  const b = fs.readFileSync(file);
  assert.equal(b.toString("ascii", 1, 4), "PNG", `${rel} is not a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function buildingCandidates(n) {
  const padded = String(n).padStart(2, "0");
  return [
    `web/assets/obstacles/buildings/building_${padded}.png`,
    `web/assets/obstacles/buildings/building_${n}.png`,
  ];
}

test("vision assets: owl has three readable normal animation frames", () => {
  for (let i = 0; i < 3; i++) {
    const rel = `web/assets/sprites/owl_frame_${i}.png`;
    assert.ok(exists(rel), `missing ${rel}`);
    const size = pngSize(rel);
    assert.ok(size.width >= 24, `${rel} width too small`);
    assert.ok(size.height >= 24, `${rel} height too small`);
  }
});

test("vision assets: six cloud hazard sprites exist and are readable", () => {
  for (let i = 1; i <= 6; i++) {
    const rel = `web/assets/obstacles/clouds/cloud_${i}.png`;
    assert.ok(exists(rel), `missing ${rel}`);
    const size = pngSize(rel);
    assert.ok(size.width >= 32, `${rel} width too small`);
    assert.ok(size.height >= 24, `${rel} height too small`);
  }
});

test("vision assets: thirteen skyline building slots exist", () => {
  for (let i = 1; i <= 13; i++) {
    const rel = firstExisting(buildingCandidates(i));
    assert.ok(rel, `missing building slot ${i}; expected building_${String(i).padStart(2, "0")}.png or building_${i}.png`);
    const size = pngSize(rel);
    assert.ok(size.width >= 32, `${rel} width too small`);
    assert.ok(size.height >= 48, `${rel} height too small`);
  }
});

test("vision assets: core audio files exist for jump, score, and hit feedback", () => {
  for (const rel of [
    "web/assets/audio/flap.wav",
    "web/assets/audio/score.wav",
    "web/assets/audio/hit.wav",
  ]) {
    assert.ok(exists(rel), `missing ${rel}`);
    assert.ok(fs.statSync(path.join(ROOT, rel)).size > 1024, `${rel} looks empty`);
  }
});

test("vision assets: ring/reward source art exists for glide collection language", () => {
  const ringCandidates = [
    "web/assets/rings/ring_1.png",
    "web/assets/rings/ring_2.png",
    "web/assets/rings/ring_3.png",
    "web/assets/rewards/reward.png",
    "web/assets/rewards/shard.png",
    "web/assets/sprites/reward_shard.png",
  ];

  const found = ringCandidates.filter(exists);
  assert.ok(found.length >= 1, `missing reward/ring sprite; checked: ${ringCandidates.join(", ")}`);
});
