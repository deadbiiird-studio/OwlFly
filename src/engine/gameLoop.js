import { GAME } from "../core/constants.js";

export class GameLoop {
  constructor(stepFn, renderFn) {
    this.stepFn = stepFn;
    this.renderFn = renderFn;

    this._running = false;
    this._paused = false;

    this._accum = 0;
    this._last = 0;

    this._raf = 0;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this._accum = 0;
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._tick);
  }

  stop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
  }

  setPaused(paused) {
    this._paused = !!paused;
  }

  get paused() {
    return this._paused;
  }

  _tick = (now) => {
    if (!this._running) return;

    const dtSec = Math.min(0.25, (now - this._last) / 1000);
    this._last = now;

    if (!this._paused) {
      this._accum += dtSec;
      let steps = 0;

      while (this._accum >= GAME.FIXED_DT && steps < GAME.MAX_CATCHUP_STEPS) {
        this.stepFn(GAME.FIXED_DT);
        this._accum -= GAME.FIXED_DT;
        steps++;
      }
    }

    this.renderFn();
    this._raf = requestAnimationFrame(this._tick);
  };
}
