// Atmosphere City A1/A3 — pure visual geometry for non-collision city depth.
// This module deliberately owns no gameplay truth. It produces deterministic
// background skyline geometry only; obstacles, collision, scoring and physics
// remain elsewhere.

export const ENVIRONMENT_LAYER_ORDER = Object.freeze(["far", "mid", "near"]);

// A3 replaces hash-random far-skyline proportions with one authored repeating
// city phrase. The phrase is intentionally quiet: it reuses the A2-approved
// roof vocabulary, preserves the existing far-layer bounds, and adds identity
// through rhythm rather than opacity, speed, clutter, or gameplay changes.
export const DISTANT_CITY_MOTIF = Object.freeze([
  Object.freeze({ height: 0.34, width: 0.42, roofType: 0 }),
  Object.freeze({ height: 0.48, width: 0.68, roofType: 1 }),
  Object.freeze({ height: 0.26, width: 0.36, roofType: 0 }),
  Object.freeze({ height: 0.64, width: 0.54, roofType: 2 }),
  Object.freeze({ height: 0.42, width: 0.88, roofType: 0 }),
  Object.freeze({ height: 0.82, width: 0.60, roofType: 1 }),
  Object.freeze({ height: 0.54, width: 0.44, roofType: 0 }),
  Object.freeze({ height: 0.30, width: 0.76, roofType: 0 }),
  Object.freeze({ height: 1.00, width: 0.50, roofType: 2 }),
  Object.freeze({ height: 0.58, width: 0.72, roofType: 1 }),
  Object.freeze({ height: 0.40, width: 0.48, roofType: 0 }),
  Object.freeze({ height: 0.72, width: 0.84, roofType: 1 }),
]);

export const ENVIRONMENT_LAYER_CONTRACT = Object.freeze({
  far: Object.freeze({
    id: "far",
    depth: 0.08,
    speedPxPerSec: 5,
    baseY: 630,
    minHeight: 48,
    maxHeight: 118,
    step: 34,
    widthMin: 20,
    widthMax: 29,
    alpha: 0.14,
  }),
  mid: Object.freeze({
    id: "mid",
    depth: 0.18,
    speedPxPerSec: 11,
    baseY: 710,
    minHeight: 70,
    maxHeight: 160,
    step: 46,
    widthMin: 29,
    widthMax: 39,
    alpha: 0.20,
  }),
  near: Object.freeze({
    id: "near",
    depth: 0.32,
    speedPxPerSec: 20,
    baseY: 775,
    minHeight: 80,
    maxHeight: 175,
    step: 58,
    widthMin: 39,
    widthMax: 49,
    alpha: 0.25,
  }),
});

export function getCityLayerSegments(
  layerId,
  t = 0,
  { reducedMotion = false, viewportWidth = 480 } = {}
) {
  const layer = ENVIRONMENT_LAYER_CONTRACT[layerId];
  if (!layer) return [];

  const width = Math.max(1, Number.isFinite(viewportWidth) ? viewportWidth : 480);
  const time = reducedMotion ? 0 : Math.max(0, Number.isFinite(t) ? t : 0);
  const distance = time * layer.speedPxPerSec;
  const firstIndex = Math.floor(distance / layer.step) - 2;
  const count = Math.ceil(width / layer.step) + 5;
  const segments = [];

  for (let j = 0; j < count; j += 1) {
    const worldIndex = firstIndex + j;
    const x = worldIndex * layer.step - distance;

    if (layerId === "far") {
      const motifIndex = wrapIndex(worldIndex, DISTANT_CITY_MOTIF.length);
      const motif = DISTANT_CITY_MOTIF[motifIndex];
      const w = lerp(layer.widthMin, layer.widthMax, motif.width);
      const h = lerp(layer.minHeight, layer.maxHeight, motif.height);

      segments.push({
        x,
        y: layer.baseY - h,
        w,
        h,
        roofType: motif.roofType,
        worldIndex,
        motifIndex,
      });
      continue;
    }

    const widthHash = environmentHash01(worldIndex, layerSalt(layerId, 1));
    const heightHash = environmentHash01(worldIndex, layerSalt(layerId, 2));
    const roofHash = environmentHash01(worldIndex, layerSalt(layerId, 3));
    const w = lerp(layer.widthMin, layer.widthMax, widthHash);
    const h = lerp(layer.minHeight, layer.maxHeight, heightHash);

    segments.push({
      x,
      y: layer.baseY - h,
      w,
      h,
      roofType: Math.min(2, Math.floor(roofHash * 3)),
      worldIndex,
    });
  }

  return segments;
}

export function getEnvironmentLayerSnapshot(
  t = 0,
  { reducedMotion = false, viewportWidth = 480 } = {}
) {
  const out = {};
  for (const id of ENVIRONMENT_LAYER_ORDER) {
    out[id] = getCityLayerSegments(id, t, { reducedMotion, viewportWidth });
  }
  return out;
}

function layerSalt(layerId, channel) {
  const base = layerId === "far" ? 19 : layerId === "mid" ? 43 : 71;
  return base + channel * 13;
}

function environmentHash01(value, salt = 0) {
  const x = Math.sin(value * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function wrapIndex(value, length) {
  return ((value % length) + length) % length;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
