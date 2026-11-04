import { GAME, OWL } from "../../core/constants.js";
import { applyGravity, jumpImpulse, rotationForVelocity } from "../physics.js";

const DART_DURATION = 0.58;
const DART_START_VELOCITY = -430;
const DART_END_VELOCITY = 80;

export class Owl {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = OWL.X;
    this.y = GAME.BASE_HEIGHT * 0.45;
    this.vy = 0;
    this.rot = 0;
    this.alive = true;

    this._blink = 0;

    this.animT = 0;
    this.flapT = 0;
    this.hurtT = 0;
    this.movementState = "NORMAL";
    this.dartElapsed = 0;
  }

  flap() {
    if (!this.alive) return;
    this.vy = jumpImpulse();
    this._blink = 0.08;
    this.flapT = 0.12;
  }

  startDart() {
    if (!this.alive || this.movementState !== "NORMAL") return false;
    this.movementState = "DART";
    this.dartElapsed = 0;
    this.vy = DART_START_VELOCITY;
    return true;
  }

  releaseDart() {
    if (this.movementState !== "DART") return false;
    this.movementState = "NORMAL";
    this.dartElapsed = 0;
    return true;
  }

  kill() {
    this.alive = false;
    this.hurtT = 0.35;
  }

  update(dt) {
    this.animT += dt;
    this.flapT = Math.max(0, this.flapT - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);

    if (this.alive) {
      if (this.movementState === "DART") {
        this.dartElapsed = Math.min(DART_DURATION, this.dartElapsed + dt);
        const progress = this.dartElapsed / DART_DURATION;
        this.vy = DART_START_VELOCITY +
          (DART_END_VELOCITY - DART_START_VELOCITY) * progress;
        if (this.dartElapsed >= DART_DURATION) this.releaseDart();
      } else {
        this.vy = applyGravity(this.vy, dt);
      }
      this.y += this.vy * dt;
      this.rot = rotationForVelocity(this.vy);
      this._blink = Math.max(0, this._blink - dt);
    } else {
      this.vy = applyGravity(this.vy, dt);
      this.y += this.vy * dt;
      this.rot = Math.min(1.6, this.rot + dt * 2.2);
    }
  }

  getCircle() {
    const scale = Number.isFinite(OWL.HIT_RADIUS_SCALE) ? OWL.HIT_RADIUS_SCALE : 0.8;
    return { cx: this.x, cy: this.y + 1, r: OWL.RADIUS * scale };
  }

  get blink() {
    return this._blink > 0;
  }

  get hurt() {
    return this.hurtT > 0;
  }

  get wingAngle() {
    const cadence = 18;
    const amplitude = 0.55;
    const base = Math.sin(this.animT * cadence) * amplitude;
    const kickWindow = 0.12;
    const kickMax = 0.85;
    const kick = this.flapT > 0 ? (this.flapT / kickWindow) * kickMax : 0;

    return base + kick;
  }
}
