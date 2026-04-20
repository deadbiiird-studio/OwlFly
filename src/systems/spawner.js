import { GAME, OBSTACLE, SPAWN } from "../core/constants.js";
import { ObstaclePair } from "../engine/entities/obstaclePair.js";

export class Spawner {
  constructor(rng, difficulty) {
    this.rng = rng;
    this.difficulty = difficulty;

    this.pool = [];
    this.active = [];

    this._spawnTimer = 0;
    this._spawnCount = 0;
    this._easyRemaining = 0;
    this._lastGapCenter = null;

    for (let i = 0; i < 8; i++) {
      this.pool.push(new ObstaclePair());
    }
  }

  reset() {
    for (const o of this.active) o.despawn();

    this.active.length = 0;
    this._spawnTimer = 0;
    this._spawnCount = 0;
    this._easyRemaining = 0;
    this._lastGapCenter = null;
  }

  update(dt) {
    this._spawnTimer += dt;

    for (const o of this.active) {
      o.update(dt);
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const o = this.active[i];
      if (!o.active) {
        this.active.splice(i, 1);
        this.pool.push(o);
      }
    }

    const interval = this.difficulty.spawnInterval;

    while (this._spawnTimer >= interval) {
      this._spawnTimer -= interval;
      this.spawnOne();
    }
  }

  spawnOne() {
    this._spawnCount++;

    if (this._spawnCount % (SPAWN.EASY_INJECTION_EVERY ?? 12) === 0) {
      this._easyRemaining = SPAWN.EASY_INJECTION_COUNT ?? 2;
    }

    const isEasy = this._easyRemaining > 0;
    if (isEasy) this._easyRemaining--;

    const inOpening = this._spawnCount <= (SPAWN.OPENING_OBSTACLES ?? 4);

    const { gap, speed } = this._computeGapAndSpeed({ isEasy, inOpening });

    const centerBounds = this._computeCenterBounds(gap);
    const center = this._pickGapCenter(centerBounds, { inOpening, isEasy });

    this._lastGapCenter = center;

    const halfGap = gap * 0.5;
    const minTop = OBSTACLE.MIN_TOP;
    const maxTop = GAME.BASE_HEIGHT - OBSTACLE.MIN_BOTTOM - gap;

    const topH = Math.floor(clamp(center - halfGap, minTop, maxTop));
    const variants = this._buildVariants({ inOpening, isEasy });
    const o = this.pool.length ? this.pool.pop() : new ObstaclePair();

    o.spawn({
      x: SPAWN.SPAWN_X ?? (GAME.BASE_WIDTH + 40),
      topH,
      gap,
      speed,
      ...variants,
    });

    this.active.push(o);
  }

  _computeGapAndSpeed({ isEasy, inOpening }) {
    let gap = clamp(
      this.difficulty.gap + (isEasy ? (SPAWN.EASY_GAP_BONUS ?? 0) : 0),
      OBSTACLE.MIN_GAP,
      OBSTACLE.MAX_GAP + (SPAWN.EASY_GAP_BONUS ?? 0)
    );

    let speed = clamp(
      this.difficulty.speed - (isEasy ? (SPAWN.EASY_SPEED_PENALTY ?? 0) : 0),
      160,
      OBSTACLE.SPEED_MAX
    );

    if (inOpening) {
      gap = clamp(
        gap + (SPAWN.OPENING_GAP_BONUS ?? 35),
        OBSTACLE.MIN_GAP,
        OBSTACLE.MAX_GAP + (SPAWN.EASY_GAP_BONUS ?? 0)
      );

      speed = clamp(
        speed - (SPAWN.OPENING_SPEED_PENALTY ?? 35),
        160,
        OBSTACLE.SPEED_MAX
      );
    }

    return { gap, speed };
  }

  _computeCenterBounds(gap) {
    const minTop = OBSTACLE.MIN_TOP;
    const maxTop = GAME.BASE_HEIGHT - OBSTACLE.MIN_BOTTOM - gap;
    const halfGap = gap * 0.5;

    let minCenter = minTop + halfGap;
    let maxCenter = maxTop + halfGap;

    const edgeMargin = SPAWN.CENTER_EDGE_MARGIN_PX ?? 28;
    if (maxCenter > minCenter + edgeMargin * 2) {
      minCenter += edgeMargin;
      maxCenter -= edgeMargin;
    }

    return { minCenter, maxCenter };
  }

  _pickGapCenter({ minCenter, maxCenter }, { inOpening, isEasy }) {
    if (this._lastGapCenter == null) {
      return (minCenter + maxCenter) * 0.5;
    }

    const maxShift = SPAWN.MAX_CENTER_SHIFT_PX ?? 90;
    const openingShift = SPAWN.OPENING_CENTER_SHIFT_PX ?? Math.min(55, maxShift);
    const easyShift = SPAWN.EASY_CENTER_SHIFT_PX ?? Math.min(60, maxShift);
    const baseShiftCap = inOpening
      ? openingShift
      : isEasy
      ? easyShift
      : maxShift;

    let center = this._lastGapCenter + triangularStep(this.rng, baseShiftCap);

    const spiceChance = inOpening ? 0 : (SPAWN.SPICE_CHANCE ?? 0.04);
    if (this.rng.range(0, 1) < spiceChance) {
      const spiceStrength = SPAWN.SPICE_STRENGTH ?? 0.18;
      center += this.rng.range(-1, 1) * baseShiftCap * spiceStrength;
    }

    const fairnessCap = inOpening
      ? openingShift
      : isEasy
      ? easyShift
      : maxShift;

    center = clamp(
      center,
      this._lastGapCenter - fairnessCap,
      this._lastGapCenter + fairnessCap
    );

    return clamp(center, minCenter, maxCenter);
  }

  _buildVariants({ inOpening, isEasy }) {
    const variants = {
      cloudScale: 1,
      tornadoScale: 1,
      tornadoHitboxBonus: 0,
    };

    if (inOpening || isEasy) {
      return variants;
    }

    const surgeEvery = Math.max(0, SPAWN.TORNADO_SURGE_EVERY ?? 0);
    const swellEvery = Math.max(0, SPAWN.CLOUD_SWELL_EVERY ?? 0);

    const isTornadoSurge = surgeEvery > 0 && this._spawnCount % surgeEvery === 0;
    const isCloudSwell =
      !isTornadoSurge && swellEvery > 0 && this._spawnCount % swellEvery === 0;

    if (isTornadoSurge) {
      variants.tornadoScale = this.rng.range(
        OBSTACLE.TORNADO_SURGE_SCALE_MIN,
        OBSTACLE.TORNADO_SURGE_SCALE_MAX
      );
      variants.tornadoHitboxBonus = Math.round(
        this.rng.range(
          OBSTACLE.TORNADO_SURGE_HITBOX_BONUS_MIN,
          OBSTACLE.TORNADO_SURGE_HITBOX_BONUS_MAX
        )
      );
      return variants;
    }

    if (isCloudSwell) {
      variants.cloudScale = this.rng.range(
        OBSTACLE.CLOUD_SWELL_SCALE_MIN,
        OBSTACLE.CLOUD_SWELL_SCALE_MAX
      );
    }

    return variants;
  }
}

function triangularStep(rng, maxShift) {
  const a = rng.range(-1, 1);
  const b = rng.range(-1, 1);
  return ((a + b) * 0.5) * maxShift;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}