import { WORLD } from "../core/constants.js";

/**
 * OwlFly physics tuning goals:
 * - flap should feel immediate and readable
 * - upward motion should have a short, satisfying lift
 * - falling should feel dangerous but not uncontrollable
 * - rotation should communicate state clearly
 */

const FLAP_GRAVITY_RECOVERY_BOOST = 1.12;
const FAST_FALL_EXTRA = 1.08;
const UPWARD_VELOCITY_SOFT_CAP = 1.18;

export function applyGravity(vy, dt, gravityScale = 1, maxFallScale = 1) {
  const s = Number.isFinite(gravityScale) ? gravityScale : 1;
  const fallCapScale = Number.isFinite(maxFallScale) ? maxFallScale : 1;

  let nextVy = vy;

  if (nextVy < 0) {
    nextVy += WORLD.GRAVITY * s * FLAP_GRAVITY_RECOVERY_BOOST * dt;
  } else {
    nextVy += WORLD.GRAVITY * s * FAST_FALL_EXTRA * dt;
  }

  const maxFall = Math.max(120, WORLD.MAX_FALL_SPEED * fallCapScale);
  if (nextVy > maxFall) nextVy = maxFall;

  return nextVy;
}

export function jumpImpulse(impulseScale = 1) {
  const s = Number.isFinite(impulseScale) ? impulseScale : 1;
  const raw = -WORLD.JUMP_IMPULSE * s;
  const riseCap = -WORLD.JUMP_IMPULSE * s * UPWARD_VELOCITY_SOFT_CAP;
  return Math.max(raw, riseCap);
}

export function rotationForVelocity(vy, upScale = 1, downScale = 1) {
  const safeUpScale = Number.isFinite(upScale) ? upScale : 1;
  const safeDownScale = Number.isFinite(downScale) ? downScale : 1;

  const riseRange = Math.max(1, WORLD.JUMP_IMPULSE * 1.25);
  const fallRange = Math.max(1, WORLD.MAX_FALL_SPEED);

  if (vy < 0) {
    const riseT = Math.min(1, Math.abs(vy) / riseRange);
    return WORLD.ROT_UP * safeUpScale * riseT;
  }

  const fallT = Math.min(1, vy / fallRange);
  return WORLD.ROT_DOWN * safeDownScale * Math.pow(fallT, 0.82);
}
