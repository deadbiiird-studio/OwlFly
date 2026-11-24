import test from "node:test";
import assert from "node:assert/strict";
import { AudioBank } from "../src/core/audio.js";
import { MusicLoop } from "../src/core/music.js";

test("backgrounding blocks SFX, stops queued voices and pauses every fallback", async () => {
  const bank = Object.create(AudioBank.prototype);
  let pauses = 0, stops = 0, disconnects = 0, suspends = 0, resumes = 0;
  Object.assign(bank, {
    _active: true, _muted: false, _mix: { master: 0.7, sfx: 1 },
    _gainMaster: { gain: { value: 0.7 } }, _gainSfx: null,
    _ctx: { state: "running", suspend: async () => { suspends++; }, resume: async () => { resumes++; } },
    _pools: { jump: [{ pause: () => { pauses++; }, currentTime: 3 }] },
    _voices: new Set([{ stop: () => { stops++; }, disconnect: () => { disconnects++; } }])
  });
  bank.setActive(false);
  assert.equal(bank._gainMaster.gain.value, 0);
  assert.equal(bank._voices.size, 0);
  assert.equal(bank._pools.jump[0].currentTime, 0);
  assert.deepEqual([pauses, stops, disconnects, suspends], [1,1,1,1]);
  bank.play("jump");
  assert.equal(bank.playCountdownTone(3), false);
  await bank.prime();
  assert.equal(resumes, 0);
  bank.setMuted(true);
  bank.setActive(true);
  assert.equal(bank._gainMaster.gain.value, 0);
  bank.setMuted(false);
  assert.equal(bank._gainMaster.gain.value, 0.7);
});

test("in-flight WebAudio activation cannot leave audio running in background", async () => {
  let finishResume, suspends = 0;
  const bank = Object.create(AudioBank.prototype);
  Object.assign(bank, {
    _active: true, _muted: false, _mix: { master: 1, sfx: 1 },
    _pools: {}, _voices: new Set(), _gainMaster: { gain: { value: 1 } },
    _ctx: { state: "suspended", resume: () => new Promise(r => { finishResume = r; }),
      suspend: async () => { suspends++; } }
  });
  const priming = bank.prime();
  bank.setActive(false);
  finishResume();
  await priming;
  assert.equal(suspends, 2);
  assert.equal(bank._gainMaster.gain.value, 0);
});

test("music stop clears scheduler and all previously scheduled voices", () => {
  const previous = globalThis.window;
  let intervals = 0, clears = 0, stops = 0;
  globalThis.window = { setInterval: () => ++intervals, clearInterval: () => { clears++; } };
  try {
    const music = new MusicLoop({ ctx: { state: "running", currentTime: 1 }, destination: {} });
    music.attach = () => {};
    music.setTheme = () => {};
    music._applyGain = () => {};
    music.start();
    music.start();
    assert.equal(intervals, 1);
    music._voices.add({ stop: () => { stops++; }, disconnect: () => {} });
    music.stop();
    music.stop();
    assert.equal(clears, 1);
    assert.equal(stops, 1);
    assert.equal(music._voices.size, 0);
    music.start();
    assert.equal(intervals, 2);
    music.stop();
    music._ctx.state = "suspended";
    music.start();
    assert.equal(intervals, 2);
  } finally { globalThis.window = previous; }
});
