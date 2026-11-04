export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this._press = false;
    this._release = false;
    this._held = false;
    this._pause = false;

    this._onKeyDown = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        if (e.code === "Space") e.preventDefault();
        this._beginHold();
      }
      if (e.code === "Escape") this._pause = true;
    };
    this._onKeyUp = (e) => {
      if (e.code === "Space" || e.code === "Enter") this._endHold();
    };

    this._onPointerDown = (e) => {
      e.preventDefault();
      this._beginHold();
    };
    this._onPointerUp = () => this._endHold();
    this._onCancel = () => this._endHold();

    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("blur", this._onCancel);
    canvas.addEventListener("pointerdown", this._onPointerDown, { passive: false });
    window.addEventListener("pointerup", this._onPointerUp);
    canvas.addEventListener("pointercancel", this._onCancel);
    canvas.addEventListener("pointerleave", this._onCancel);
  }

  _beginHold() {
    if (this._held) return;
    this._held = true;
    this._press = true;
  }

  _endHold() {
    if (!this._held) return;
    this._held = false;
    this._release = true;
  }

  consumePress() {
    const value = this._press;
    this._press = false;
    return value;
  }

  consumeRelease() {
    const value = this._release;
    this._release = false;
    return value;
  }

  isHeld() {
    return this._held;
  }

  consumePause() {
    const v = this._pause;
    this._pause = false;
    return v;
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("blur", this._onCancel);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    window.removeEventListener("pointerup", this._onPointerUp);
    this.canvas.removeEventListener("pointercancel", this._onCancel);
    this.canvas.removeEventListener("pointerleave", this._onCancel);
  }
}
