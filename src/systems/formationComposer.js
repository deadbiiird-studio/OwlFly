// SkyWeave: one deterministic sprite/size selection per obstacle.
// Designers can author each encounter independently; no new artwork or physics.
//
// "sprite" is 1-based to match filenames; "size" selects a common size preset.
// Adding entries below extends the deliberately taught opening sequence.
export const SKYWEAVE_SIZES = Object.freeze(["tiny", "small", "medium", "large", "massive"]);

export const AUTHORED_OPENING = Object.freeze([
  { intent: "read",     building: { sprite: 1,  size: "small" },   cloud: { sprite: 2, size: "medium" } },
  { intent: "climb",    building: { sprite: 3,  size: "large" },   cloud: { sprite: 5, size: "tiny" } },
  { intent: "descend",  building: { sprite: 5,  size: "tiny" },    cloud: { sprite: 1, size: "large" } },
  { intent: "recover",  building: { sprite: 7,  size: "medium" },  cloud: { sprite: 3, size: "small" } },
  { intent: "commit",   building: { sprite: 9,  size: "massive" }, cloud: { sprite: 4, size: "tiny" } },
  { intent: "duck",     building: { sprite: 11, size: "small" },   cloud: { sprite: 6, size: "massive" } },
  { intent: "thread",   building: { sprite: 12, size: "medium" },  cloud: { sprite: 2, size: "large" } },
  { intent: "recover",  building: { sprite: 13, size: "tiny" },    cloud: { sprite: 5, size: "small" } },
]);

const BUILDING_SPRITES = 13;
const CLOUD_SPRITES = 6;

function mix32(value) {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function select(seed, ordinal, salt, count) {
  return mix32((seed >>> 0) ^ Math.imul(ordinal >>> 0, 0x9e3779b1) ^ salt) % count;
}

function sizeIndex(name) {
  const index = SKYWEAVE_SIZES.indexOf(name);
  if (index < 0) throw new Error(`Unknown SkyWeave size: ${name}`);
  return index;
}

function spriteIndex(sprite, count) {
  if (!Number.isInteger(sprite) || sprite < 1 || sprite > count) {
    throw new Error(`SkyWeave sprite index must be between 1 and ${count}`);
  }
  return sprite - 1;
}

// Selection depends only on the run seed, obstacle number and optional previous
// descriptor. Never depends on a pooled object's identity or global randomness.
export function composeFormation({ seed = 0, ordinal, previous = null, towerHeight = null } = {}) {
  if (!Number.isInteger(ordinal) || ordinal < 1) {
    throw new Error("SkyWeave requires a positive integer obstacle number");
  }

  const authored = AUTHORED_OPENING[ordinal - 1] || null;
  const openSky = towerHeight !== null && towerHeight !== undefined;
  let buildingSpriteIndex = authored
    ? spriteIndex(authored.building.sprite, BUILDING_SPRITES)
    : select(seed, ordinal, 0x7c159e37, BUILDING_SPRITES);
  const buildingSizeIndex = authored
    ? sizeIndex(authored.building.size)
    : select(seed, ordinal, 0x49abc3f1, SKYWEAVE_SIZES.length);
  const cloudSpriteIndex = openSky
    ? null
    : authored
      ? spriteIndex(authored.cloud.sprite, CLOUD_SPRITES)
      : select(seed, ordinal, 0x9b5d7603, CLOUD_SPRITES);
  const cloudSizeIndex = openSky
    ? null
    : authored
      ? sizeIndex(authored.cloud.size)
      : select(seed, ordinal, 0xd24147e9, SKYWEAVE_SIZES.length);

  // Variety is authored, not a source of unfair last-second trajectory changes.
  if (!authored && previous &&
      previous.buildingSpriteIndex === buildingSpriteIndex &&
      previous.buildingSizeIndex === buildingSizeIndex) {
    buildingSpriteIndex = (buildingSpriteIndex + 1) % BUILDING_SPRITES;
  }

  return {
    id: `skyweave-${String(ordinal).padStart(3, "0")}`,
    ordinal,
    intent: openSky ? "open-sky-rooftop" : (authored?.intent || "adaptive-pair"),
    kind: openSky ? "open-sky" : "cloud-building",
    buildingSpriteIndex,
    buildingSizeIndex,
    cloudSpriteIndex,
    cloudSizeIndex,
  };
}
