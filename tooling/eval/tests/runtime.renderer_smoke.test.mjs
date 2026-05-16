import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Renderer } from "../../../src/render/renderer.js";
import { GAME, OBSTACLE, OWL, SPAWN } from "../../../src/core/constants.js";
import { ObstaclePair } from "../../../src/engine/entities/obstaclePair.js";

const ROOT = process.cwd();

function makeCtx() {
  const gradient = { addColorStop() {} };
  const pattern = {};
  const target = {
    canvas: null,
    measureText(text) { return { width: String(text || "").length * 8 }; },
    createLinearGradient() { return gradient; },
    createRadialGradient() { return gradient; },
    createPattern() { return pattern; },
    getImageData() { return { data: new Uint8ClampedArray(4) }; },
    putImageData() {},
    isPointInPath() { return false; },
    isPointInStroke() { return false; },
  };

  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      return () => undefined;
    },
    set(obj, prop, value) {
      obj[prop] = value;
      return true;
    },
  });
}

function makeCanvas() {
  const ctx = makeCtx();
  const canvas = {
    width: GAME.BASE_WIDTH,
    height: GAME.BASE_HEIGHT,
    getContext() { return ctx; },
    getBoundingClientRect() {
      return { width: GAME.BASE_WIDTH, height: GAME.BASE_HEIGHT };
    },
  };
  ctx.canvas = canvas;
  return canvas;
}

function makeReadyImage(width = 160, height = 160) {
  return { complete: true, naturalWidth: width, naturalHeight: height, width, height };
}

function makeObstacle() {
  const o = new ObstaclePair();
  o.spawn({
    x: SPAWN.SPAWN_X ?? GAME.BASE_WIDTH + 40,
    topH: 220,
    gap: OBSTACLE.MIN_GAP,
    speed: OBSTACLE.BASE_SPEED,
  });
  return o;
}

test("runtime renderer: helper draw calls referenced by renderer.js are defined", () => {
  const rendererPath = path.join(ROOT, "src", "render", "renderer.js");
  const source = fs.readFileSync(rendererPath, "utf8");
  const declared = new Set([...source.matchAll(/function\s+(draw[A-Z]\w*)\s*\(/g)].map((m) => m[1]));
  const called = new Set([...source.matchAll(/(?<!\.)\b(draw[A-Z]\w*)\s*\(/g)].map((m) => m[1]));

  const missing = [...called].filter((name) => !declared.has(name));
  assert.deepEqual(missing, [], `missing renderer helper(s): ${missing.join(", ")}`);
});

test("runtime renderer: production bundle has no unresolved draw helper calls", () => {
  const bundlePath = path.join(ROOT, "web", "game.js");
  assert.ok(fs.existsSync(bundlePath), "web/game.js missing; run npm run build first");
  const bundle = fs.readFileSync(bundlePath, "utf8");

  const declared = new Set([...bundle.matchAll(/function\s+(draw[A-Z]\w*)\s*\(/g)].map((m) => m[1]));
  const called = new Set([...bundle.matchAll(/(?<!\.)\b(draw[A-Z]\w*)\s*\(/g)].map((m) => m[1]));
  const missing = [...called].filter((name) => !declared.has(name));

  assert.deepEqual(missing, [], `production bundle missing draw helper(s): ${missing.join(", ")}`);
});

test("runtime renderer: a normal frame renders with sprite arrays and no browser canvas implementation", () => {
  const renderer = new Renderer(makeCanvas());
  renderer.setOwlFrames(makeReadyImage(), makeReadyImage(), makeReadyImage());
  renderer.setGlideOwlFrames(makeReadyImage(), makeReadyImage(), makeReadyImage());
  renderer.setRewardSprite(makeReadyImage(286, 234));
  renderer.setObstacleSprites({
    clouds: Array.from({ length: 6 }, () => makeReadyImage(140, 210)),
    buildings: Array.from({ length: 13 }, () => makeReadyImage(213, 320)),
  });

  const state = {
    mode: "playing",
    paused: false,
    settings: { reducedMotion: true },
    owl: { x: OWL.X, y: GAME.BASE_HEIGHT / 2, rot: 0 },
    spawner: { active: [makeObstacle()] },
    rewards: [{ active: true, x: 260, y: 360, r: 14 }],
    playPhase: "glide",
    fractureProgress: 1,
    glideTimer: 3.4,
    reentryTimer: 0,
    theme: "night",
  };

  assert.doesNotThrow(() => renderer.render(state));
});
