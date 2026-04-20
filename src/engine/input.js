export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this._jump = false;
    this._pause = false;

    this._onKeyDown = (e) => {
      if (e.code === "Space") { e.preventDefault(); this._jump = true; }
      if (e.code === "Enter") this._jump = true;
      if (e.code === "Escape") this._pause = true;
    };

    this._onPointerDown = (e) => {
      e.preventDefault();
      this._jump = true;
    };

    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    canvas.addEventListener("pointerdown", this._onPointerDown, { passive: false });
  }

  consumeJump() {
    const v = this._jump;
    this._jump = false;
    return v;
  }

  consumePause() {
    const v = this._pause;
    this._pause = false;
    return v;
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
  }
}
