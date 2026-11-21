import test from "node:test";
import assert from "node:assert/strict";
import { Input, AUTO_FLAP_INTERVAL } from "../src/engine/input.js";
import { Owl } from "../src/engine/entities/owl.js";
import { RoundCountdown } from "../src/engine/countdown.js";
import { AudioBank } from "../src/core/audio.js";

function setup() {
  const listeners = new Map();
  const win = {
    addEventListener(k, fn) { listeners.set("window:" + k, fn); },
    removeEventListener() {},
  };
  const canvas = {
    addEventListener(k, fn) { listeners.set("canvas:" + k, fn); },
    removeEventListener() {},
    setPointerCapture() {},
  };
  const before = globalThis.window;
  globalThis.window = win;
  const input = new Input(canvas);
  return {
    input,
    emit(where, type, e = {}) {
      listeners.get(where + ":" + type)?.({ preventDefault() {}, ...e });
    },
    restore() {
      input.dispose();
      if (before === undefined) delete globalThis.window;
      else globalThis.window = before;
    },
  };
}

test("tap initiates a flap; hold repeats; release stops", () => {
  const h = setup();
  try {
    h.emit("canvas", "pointerdown", { pointerId: 7, pointerType: "touch" });
    assert.equal(h.input.consumeFlap(1 / 60), true);
    let repeats = 0;
    for (let i = 0; i < 60; i++) if (h.input.consumeFlap(1 / 60)) repeats++;
    assert.ok(repeats >= 4 && repeats <= 6, "hold cadence should remain bounded");
    h.emit("window", "pointerup", { pointerId: 7 });
    for (let i = 0; i < 30; i++) assert.equal(h.input.consumeFlap(1 / 60), false);
  } finally { h.restore(); }
});

test("held touch during countdown cannot silently flap at GO", () => {
  const h = setup();
  try {
    h.emit("canvas", "pointerdown", { pointerId: 4, pointerType: "touch" });
    h.input.requireFreshPress();
    for (let i = 0; i < 30; i++) assert.equal(h.input.consumeFlap(1 / 60), false);
    h.emit("window", "pointerup", { pointerId: 4 });
    h.emit("canvas", "pointerdown", { pointerId: 5, pointerType: "touch" });
    assert.equal(h.input.consumeFlap(1 / 60), true);
  } finally { h.restore(); }
});

test("keyboard repeat is bounded and blur cancels hold", () => {
  const h = setup();
  try {
    h.emit("window", "keydown", { code: "Space", repeat: false });
    h.emit("window", "keydown", { code: "Space", repeat: true });
    assert.equal(h.input.consumeFlap(1 / 60), true);
    assert.equal(h.input.consumeFlap(1 / 60), false);
    h.emit("window", "blur");
    for (let i = 0; i < 30; i++) assert.equal(h.input.consumeFlap(1 / 60), false);
  } finally { h.restore(); }
});

test("countdown cues 3,2,1,GO once and resets every round", () => {
  const c = new RoundCountdown();
  const cues = [3];
  for (let i = 0; i < 240; i++) {
    const cue = c.advance(1 / 60);
    if (cue !== null) cues.push(cue);
  }
  assert.deepEqual(cues, [3, 2, 1, 0]);
  assert.equal(c.finished, true);
  assert.equal(c.label, "GO!");
  c.reset();
  assert.equal(c.label, "3");
  assert.equal(c.finished, false);
});

test("single flap immediately lifts and cycles all three owl frames", () => {
  const owl = new Owl();
  owl.flap();
  assert.ok(owl.vy < 0);
  const frames = new Set([owl.wingFrameIndex]);
  for (let i = 0; i < 12; i++) {
    owl.update(1 / 60);
    if (owl.wingFrameIndex !== null) frames.add(owl.wingFrameIndex);
  }
  assert.deepEqual([...frames].sort(), [0, 1, 2]);
});

test("audio retries a suspended or interrupted context on later start gestures", async () => {
  const audio = Object.create(AudioBank.prototype);
  let resumeCalls = 0;
  const ctx = {
    state: "suspended",
    async resume() {
      resumeCalls++;
      this.state = "running";
    },
  };
  audio._ctx = ctx;
  audio._primed = true;

  await audio.prime();
  assert.equal(resumeCalls, 1);
  assert.equal(ctx.state, "running");

  ctx.state = "interrupted";
  await audio.prime();
  assert.equal(resumeCalls, 2);
  assert.equal(ctx.state, "running");
});
