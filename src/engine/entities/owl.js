import { GAME, OWL } from "../../core/constants.js";
import { applyGravity, jumpImpulse, rotationForVelocity } from "../physics.js";

const DEFAULT_FLIGHT_PROFILE = {
  gravityScale: 1,
  jumpScale: 1,
  maxFallScale: 1,
  rotUpScale: 1,
  rotDownScale: 1,
};

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
    this.flightProfile = { ...DEFAULT_FLIGHT_PROFILE };
    this.flightMode = "normal";

    this.animT = 0;
    this.flapT = 0;
    this.hurtT = 0;
  }

  setFlightProfile(profile = {}, mode = "normal") {
    this.flightProfile = {
      ...DEFAULT_FLIGHT_PROFILE,
      ...(profile || {}),
    };
    this.flightMode = String(mode || "normal");
  }

  clearFlightProfile() {
    this.flightProfile = { ...DEFAULT_FLIGHT_PROFILE };
    this.flightMode = "normal";
  }

  flap() {
    if (!this.alive) return;
    this.vy = jumpImpulse(this.flightProfile.jumpScale);
    this._blink = 0.08;
    this.flapT = this.isGliding ? 0.18 : 0.12;
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
      this.vy = applyGravity(
        this.vy,
        dt,
        this.flightProfile.gravityScale,
        this.flightProfile.maxFallScale
      );
      this.y += this.vy * dt;
      this.rot = rotationForVelocity(
        this.vy,
        this.flightProfile.rotUpScale,
        this.flightProfile.rotDownScale
      );
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

  get isGliding() {
    return this.flightMode === "glide";
  }

  get wingAngle() {
    const cadence = this.isGliding ? 10 : 18;
    const amplitude = this.isGliding ? 0.3 : 0.55;
    const base = Math.sin(this.animT * cadence) * amplitude;
    const kickWindow = this.isGliding ? 0.18 : 0.12;
    const kickMax = this.isGliding ? 0.45 : 0.85;
    const kick = this.flapT > 0 ? (this.flapT / kickWindow) * kickMax : 0;

    return base + kick;
  }
}
