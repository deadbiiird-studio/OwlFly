import test from "node:test";
import assert from "node:assert/strict";

if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(String(key), String(value)),
    removeItem: (key) => store.delete(String(key)),
    clear: () => store.clear(),
  };
}

const { Scoring } = await import("../../../src/systems/scoring.js");

test("vision scoring: normal obstacle passes build combo language", () => {
  localStorage.clear();
  const scoring = new Scoring();
  scoring.startRun(0);

  const a = scoring.onPassObstacle(1, 300);
  const b = scoring.onPassObstacle(1, 600);
  const c = scoring.onPassObstacle(1, 900);

  assert.equal(a.combo, 1);
  assert.equal(b.combo, 2);
  assert.equal(c.combo, 3);
  assert.ok(scoring.score >= 3, "passing obstacles should grow score");
});

test("vision scoring: slow passes reset combo instead of faking streaks", () => {
  localStorage.clear();
  const scoring = new Scoring();
  scoring.startRun(0);

  scoring.onPassObstacle(1, 300);
  const slow = scoring.onPassObstacle(1, 1500);

  assert.equal(slow.combo, 1);
});

test("vision scoring: glide reward collection adds points without changing obstacle combo", () => {
  localStorage.clear();
  const scoring = new Scoring();
  scoring.startRun(0);
  scoring.onPassObstacle(1, 300);
  scoring.onPassObstacle(1, 600);

  const beforeCombo = scoring.combo;
  const beforeScore = scoring.score;
  const reward = scoring.onCollectReward(1);

  assert.equal(scoring.combo, beforeCombo, "reward collection should not pretend to be an obstacle pass");
  assert.ok(scoring.score > beforeScore, "reward collection should increase score");
  assert.ok(reward.points >= 1);
});
