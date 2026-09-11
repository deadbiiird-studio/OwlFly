import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SOUND_POLICY,
  getCuePlaybackRate,
  normalizeEventGain,
} from "../../../src/core/audio.js";

test("P3 audio: cue policy keeps rapid SFX bounded", () => {
  assert.ok(SOUND_POLICY.jump.cooldownMs >= 20);
  assert.ok(SOUND_POLICY.jump.maxVoices <= 3);
  assert.ok(SOUND_POLICY.score.cooldownMs >= 40);
  assert.ok(SOUND_POLICY.score.maxVoices <= 2);
  assert.ok(SOUND_POLICY.hit.cooldownMs >= 100);
  assert.equal(SOUND_POLICY.hit.maxVoices, 1);
});

test("P3 audio: micro-variation is deterministic and tightly bounded", () => {
  const first = Array.from({ length: 16 }, (_, i) => getCuePlaybackRate("jump", i));
  const second = Array.from({ length: 16 }, (_, i) => getCuePlaybackRate("jump", i));

  assert.deepEqual(first, second);
  for (const rate of first) {
    assert.ok(rate >= 0.965 && rate <= 1.035);
  }
  assert.ok(new Set(first).size > 2, "flap cue should have subtle deterministic variation");
});

test("P3 audio: impact cue stays pitch-stable", () => {
  for (let i = 0; i < 12; i += 1) {
    assert.equal(getCuePlaybackRate("hit", i), 1);
  }
});

test("P3 audio: app premix is normalized so master and SFX are not squared", () => {
  const master = 0.5;
  const sfx = 0.8;
  const eventGain = 0.75;
  const callerGain = master * sfx * eventGain;

  assert.ok(Math.abs(normalizeEventGain(callerGain, master, sfx) - eventGain) < 1e-12);
  assert.equal(normalizeEventGain(eventGain, master, sfx, "event"), eventGain);
  assert.equal(normalizeEventGain(0, 0, sfx), 0);
});

test("P3 audio: production audio code does not use runtime Math.random for cue identity", async () => {
  const url = new URL("../../../src/core/audio.js", import.meta.url);
  const source = await readFile(url, "utf8");

  assert.doesNotMatch(source, /Math\.random\(/);
  assert.match(source, /_lastPlayAt/);
  assert.match(source, /_activeVoices/);
  assert.match(source, /linearRampToValueAtTime/);
  assert.match(source, /HTMLAudio pool fallback/);
  assert.match(source, /normalizeEventGain/);
});
