import test from "node:test";
import assert from "node:assert/strict";
import { FRACTURE } from "../../../src/core/constants.js";
import { Owl } from "../../../src/engine/entities/owl.js";
import { applyGravity } from "../../../src/engine/physics.js";

const glideProfile = {
  gravityScale: FRACTURE.GLIDE_GRAVITY_SCALE,
  jumpScale: FRACTURE.GLIDE_JUMP_SCALE,
  maxFallScale: FRACTURE.GLIDE_MAX_FALL_SCALE,
  rotDownScale: FRACTURE.GLIDE_ROT_DOWN_SCALE,
};

test("vision glide: glide mode uses softer lift than normal flap", () => {
  const normal = new Owl();
  normal.flap();

  const glide = new Owl();
  glide.setFlightProfile(glideProfile, "glide");
  glide.flap();

  assert.ok(normal.vy < glide.vy, "glide flap should be less forceful than normal flap");
  assert.ok(Math.abs(glide.vy) < Math.abs(normal.vy), "glide lift magnitude should be softer");
});

test("vision glide: glide gravity advances slower than normal falling", () => {
  const dt = 1 / 60;
  const normalVy = applyGravity(0, dt, 1, 1);
  const glideVy = applyGravity(0, dt, FRACTURE.GLIDE_GRAVITY_SCALE, FRACTURE.GLIDE_MAX_FALL_SCALE);

  assert.ok(glideVy > 0, "glide should still descend without input");
  assert.ok(glideVy < normalVy, "glide descent should be slower than normal descent");
});

test("vision glide: phase constants describe a distinct mode instead of a quick flicker", () => {
  assert.ok(FRACTURE.TRANSITION_DURATION >= 0.3, "fracture transition should be visible");
  assert.ok(FRACTURE.GLIDE_DURATION >= 3.0, "glide should last long enough to read");
  assert.ok(FRACTURE.REENTRY_DURATION >= 0.5, "reentry should be visible");
  assert.ok(FRACTURE.GLIDE_GRAVITY_SCALE < 0.7, "glide needs meaningfully reduced gravity");
  assert.ok(FRACTURE.GLIDE_JUMP_SCALE < 0.8, "glide needs meaningfully reduced flap impulse");
});
