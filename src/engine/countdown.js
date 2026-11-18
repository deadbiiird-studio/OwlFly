// Fixed-step safe launch; no physics, collisions, scoring, or spawns before GO.
export const ROUND_COUNTDOWN_SECONDS = 3;
export class RoundCountdown {
  constructor() { this.reset(); }
  reset() { this.remaining = ROUND_COUNTDOWN_SECONDS; this.nextCue = 3; this.finished = false; }
  advance(dt) {
    if (this.finished || dt <= 0) return null;
    this.remaining = Math.max(0, this.remaining - dt);
    const cue = Math.ceil(this.remaining);
    if (cue < this.nextCue) {
      this.nextCue = cue;
      if (cue === 0) this.finished = true;
      return cue;
    }
    return null;
  }
  get label() { return this.finished ? "GO!" : String(Math.ceil(this.remaining)); }
}
