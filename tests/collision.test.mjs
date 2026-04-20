import test from "node:test";
import assert from "node:assert/strict";
import { aabbIntersect, circleAabbIntersect } from "../src/engine/collision.js";

test("aabbIntersect: overlapping boxes", () => {
  assert.equal(aabbIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }), true);
});

test("aabbIntersect: separated boxes", () => {
  assert.equal(aabbIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 }), false);
});

test("circleAabbIntersect: hits edge", () => {
  const rect = { x: 10, y: 10, w: 10, h: 10 };
  assert.equal(circleAabbIntersect(5, 15, 5, rect), true);
});

test("circleAabbIntersect: misses", () => {
  const rect = { x: 10, y: 10, w: 10, h: 10 };
  assert.equal(circleAabbIntersect(0, 0, 3, rect), false);
});