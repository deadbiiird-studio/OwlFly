import test from "node:test";
import assert from "node:assert/strict";
import { OWL } from "../../../src/core/constants.js";
import { jumpImpulse } from "../../../src/engine/physics.js";
import {
  Owl,
  OWL_PRESENTATION,
} from "../../../src/engine/entities/owl.js";

const EPSILON = 1e-9;

test("P1 game feel: flap keeps the sealed vertical impulse", () => {
  const owl = new Owl();
  const before = owl.getCircle();

  owl.flap();

  assert.equal(owl.vy, jumpImpulse(1));
  assert.equal(owl.x, OWL.X);
  assert.equal(owl.y, before.cy - 1);
  assert.deepEqual(owl.getCircle(), before);
});

test("P1 game feel: presentation pitch is bounded and never alters hit geometry", () => {
  const owl = new Owl();
  const hitBefore = owl.getCircle();

  owl.flap();
  const kick = owl.presentationPitchKick;

  assert.ok(kick <= 0);
  assert.ok(kick >= -OWL_PRESENTATION.maxPresentationPitch - EPSILON);
  assert.deepEqual(owl.getCircle(), hitBefore);
});

test("P1 game feel: flap pulse decays monotonically and clears", () => {
  const owl = new Owl();
  owl.flap();

  const p0 = owl.flapPulse;
  owl.update(OWL_PRESENTATION.normalFlapWindow * 0.25);
  const p1 = owl.flapPulse;
  owl.update(OWL_PRESENTATION.normalFlapWindow);
  const p2 = owl.flapPulse;

  assert.equal(p0, 1);
  assert.ok(p1 < p0 && p1 > 0);
  assert.equal(p2, 0);
});

test("P1 game feel: glide uses a softer, longer presentation kick without changing mode physics contract", () => {
  const owl = new Owl();
  owl.setFlightProfile({ jumpScale: 0.8 }, "glide");
  owl.flap();

  assert.equal(owl.flapT, OWL_PRESENTATION.glideFlapWindow);
  assert.ok(Math.abs(owl.presentationPitchKick) <= OWL_PRESENTATION.glidePitchKick + EPSILON);
  assert.equal(owl.vy, jumpImpulse(0.8));
});

test("P1 game feel: hurt pulse is presentation-only and bounded", () => {
  const owl = new Owl();
  const hitBefore = owl.getCircle();

  owl.kill();

  assert.equal(owl.alive, false);
  assert.equal(owl.hurtPulse, 1);
  assert.deepEqual(owl.getCircle(), hitBefore);
});
