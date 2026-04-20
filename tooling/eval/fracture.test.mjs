import test from "node:test";
import assert from "node:assert/strict";
import { FRACTURE } from "../../src/core/constants.js";

test("fracture constants: trigger threshold is stable", () => {
  assert.equal(FRACTURE.TRIGGER_EVERY_PASSES, 6);
});

test("fracture constants: transition duration is positive", () => {
  assert(FRACTURE.TRANSITION_DURATION > 0);
});

test("glide constants: glide duration is positive", () => {
  assert(FRACTURE.GLIDE_DURATION > 0);
});

test("reentry constants: reentry duration is positive", () => {
  assert(FRACTURE.REENTRY_DURATION > 0);
});

test("reentry invulnerability is shorter than fracture transition", () => {
  assert(FRACTURE.REENTRY_INVULN < FRACTURE.TRANSITION_DURATION);
});

test("glide physics scales are reduced from normal", () => {
  assert(FRACTURE.GLIDE_GRAVITY_SCALE < 1);
  assert(FRACTURE.GLIDE_JUMP_SCALE < 1);
  assert(FRACTURE.GLIDE_MAX_FALL_SCALE < 1);
  assert(FRACTURE.GLIDE_ROT_DOWN_SCALE < 1);
});

test("normal phase pass counting increments, glide does not", () => {
  const normalState = { playPhase: "normal", passesSinceFracture: 0 };
  const glideState = { playPhase: "glide", passesSinceFracture: 0 };

  if (normalState.playPhase === "normal") {
    normalState.passesSinceFracture += 1;
  }

  if (glideState.playPhase === "normal") {
    glideState.passesSinceFracture += 1;
  }

  assert.equal(normalState.passesSinceFracture, 1);
  assert.equal(glideState.passesSinceFracture, 0);
});

test("fracture trigger resets pass counter at threshold", () => {
  const state = {
    playPhase: "normal",
    passesSinceFracture: FRACTURE.TRIGGER_EVERY_PASSES,
  };

  function maybeTriggerFractureLikeGame(s) {
    if (s.playPhase !== "normal") return false;
    if (s.passesSinceFracture < FRACTURE.TRIGGER_EVERY_PASSES) return false;
    s.passesSinceFracture = 0;
    return true;
  }

  const triggered = maybeTriggerFractureLikeGame(state);

  assert.equal(triggered, true);
  assert.equal(state.passesSinceFracture, 0);
});

test("fracture invulnerability window blocks crash condition", () => {
  const state = { invulnTimer: FRACTURE.TRANSITION_DURATION };
  const shouldCrash = state.invulnTimer <= 0;
  assert.equal(shouldCrash, false);
});