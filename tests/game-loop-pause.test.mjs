import test from "node:test";
import assert from "node:assert/strict";
import { GameLoop } from "../src/engine/gameLoop.js";

test("paused loop polls for resume without advancing game time", () => {
  const before = globalThis.requestAnimationFrame;
  let renders = 0;
  const steps = [];
  try {
    globalThis.requestAnimationFrame = () => 1;
    const loop = new GameLoop((dt) => {
      steps.push(dt);
      if (dt === 0) loop.setPaused(false);
    }, () => { renders++; });
    loop._running = true;
    loop._last = 100;
    loop.setPaused(true);
    loop._tick(150);
    assert.deepEqual(steps, [0]);
    assert.equal(loop.paused, false);
    assert.equal(renders, 1);
    loop._tick(167);
    assert.deepEqual(steps, [0, 1 / 60]);
    assert.equal(renders, 2);
  } finally {
    if (before === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = before;
  }
});

test("paused loop stays paused if input doesn't resume", () => {
  const before = globalThis.requestAnimationFrame;
  try {
    globalThis.requestAnimationFrame = () => 1;
    const steps = [];
    const loop = new GameLoop((dt) => steps.push(dt), () => {});
    loop._running = true;
    loop.setPaused(true);
    loop._tick(1000);
    loop._tick(2000);
    assert.deepEqual(steps, [0, 0]);
    assert.equal(loop.paused, true);
    assert.equal(loop._accum, 0);
  } finally {
    if (before === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = before;
  }
});
