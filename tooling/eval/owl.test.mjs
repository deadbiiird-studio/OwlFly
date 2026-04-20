import test from "node:test";
import assert from "node:assert/strict";
import { Owl } from "../../src/engine/entities/owl.js";

test("Owl flap applies upward impulse", () => {
  const o = new Owl();
  const y0 = o.y;
  o.flap();
  assert.ok(o.vy < 0);
  o.update(1 / 60);
  assert.ok(o.y < y0);
});

test("Owl hit circle is forgiving", () => {
  const o = new Owl();
  const c = o.getCircle();
  assert.ok(c.r > 0);
  assert.ok(c.r < 18);
});