import { loadHighScore, saveHighScore } from "../core/storage.js";

export class Scoring {
  constructor() {
    this.best = loadHighScore();
    this.runs = 0;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.lastPassAt = 0;
    this.lastAward = 0;
    this.newBestThisRun = false;
  }

  resetAll() {
    this.best = loadHighScore();
    this.runs = 0;
    this.reset();
  }

  startRun(now = performance.now()) {
    this.reset();
    this.lastPassAt = now;
  }

  onPassObstacle(mult = 1, now = performance.now()) {
    const safeMult = Number.isFinite(mult) ? mult : 1;

    const sinceLast = Math.max(0, now - this.lastPassAt);
    this.lastPassAt = now;

    if (sinceLast <= 900) {
      this.combo += 1;
    } else {
      this.combo = 1;
    }

    const comboBonus = this.combo >= 6 ? 2 : this.combo >= 3 ? 1 : 0;
    const pts = Math.max(1, Math.round(1 * safeMult) + comboBonus);

    this.lastAward = pts;
    this.score += pts;
    this._syncBest();

    return {
      points: pts,
      combo: this.combo,
      newBest: this.newBestThisRun,
    };
  }

  onCollectReward(points = 1) {
    const pts = Math.max(1, Math.round(Number.isFinite(points) ? points : 1));
    this.lastAward = pts;
    this.score += pts;
    this._syncBest();
    return {
      points: pts,
      combo: this.combo,
      newBest: this.newBestThisRun,
    };
  }

  onCrash() {
    this.combo = 0;
    this.lastAward = 0;
    this.runs += 1;
  }

  _syncBest() {
    if (this.score > this.best) {
      this.best = this.score;
      this.newBestThisRun = true;
      saveHighScore(this.best);
    }
  }
}
