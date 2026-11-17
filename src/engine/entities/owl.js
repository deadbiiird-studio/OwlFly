import { GAME, OWL } from "../../core/constants.js";
import { applyGravity, jumpImpulse, rotationForVelocity } from "../physics.js";

const DEFAULT_FLIGHT_PROFILE = {
  gravityScale: 1,
  jumpScale: 1,
  maxFallScale: 1,
  rotUpScale: 1,
  rotDownScale: 1,
};

export const OWL_PRESENTATION = Object.freeze({
  normalFlapWindow: 0.12,
  glideFlapWindow: 0.18,
  normalPitchKick: 0.14,
  glidePitchKick: 0.07,
  hurtWindow: 0.35,
  maxPresentationPitch: 0.16,
});

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

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
    this.flapT = this.isGliding
      ? OWL_PRESENTATION.glideFlapWindow
      : OWL_PRESENTATION.normalFlapWindow;
  }

  kill() {
    this.alive = false;
    this.hurtT = OWL_PRESENTATION.hurtWindow;
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

      const physicsRot = rotationForVelocity(
        this.vy,
        this.flightProfile.rotUpScale,
        this.flightProfile.rotDownScale
      );
      this.rot = physicsRot + this.presentationPitchKick;
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

  get flapPulse() {
    const window = this.isGliding
      ? OWL_PRESENTATION.glideFlapWindow
      : OWL_PRESENTATION.normalFlapWindow;
    if (window <= 0 || this.flapT <= 0) return 0;
    return clamp01(this.flapT / window);
  }

  get hurtPulse() {
    if (OWL_PRESENTATION.hurtWindow <= 0 || this.hurtT <= 0) return 0;
    return clamp01(this.hurtT / OWL_PRESENTATION.hurtWindow);
  }

  get presentationPitchKick() {
    const maxKick = this.isGliding
      ? OWL_PRESENTATION.glidePitchKick
      : OWL_PRESENTATION.normalPitchKick;
    const kick = -maxKick * easeOutCubic(this.flapPulse);
    return Math.max(-OWL_PRESENTATION.maxPresentationPitch, Math.min(0, kick));
  }

  get wingAngle() {
    const cadence = this.isGliding ? 10 : 18;
    const amplitude = this.isGliding ? 0.3 : 0.55;
    const base = Math.sin(this.animT * cadence) * amplitude;
    const kickMax = this.isGliding ? 0.45 : 0.85;
    const kick = easeOutCubic(this.flapPulse) * kickMax;

    return base + kick;
  }
}
