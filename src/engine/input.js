export const AUTO_FLAP_INTERVAL = 0.20;

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this._jump = false;
    this._pause = false;
    this._heldPointers = new Set();
    this._heldKeys = new Set();
    this._repeatTimer = 0;
    this._blockedUntilRelease = false;

    this._onKeyDown = (e) => {
      if (e.code === "Escape") { if (!e.repeat) this._pause = true; return; }
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      if (this._heldKeys.has(e.code)) return;
      this._heldKeys.add(e.code);
      if (!this._blockedUntilRelease) this._jump = true;
    };
    this._onKeyUp = (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      this._heldKeys.delete(e.code);
      this._releaseIfIdle();
    };
    this._onPointerDown = (e) => {
      e.preventDefault();
      if (e.pointerType === "mouse" && e.button !== 0) return;
      this._heldPointers.add(e.pointerId);
      try { canvas.setPointerCapture?.(e.pointerId); } catch {}
      if (!this._blockedUntilRelease) this._jump = true;
    };
    this._onPointerUp = (e) => {
      this._heldPointers.delete(e.pointerId);
      this._releaseIfIdle();
    };
    this._onBlur = () => {
      this._heldPointers.clear();
      this._heldKeys.clear();
      this._jump = false;
      this._repeatTimer = 0;
      this._blockedUntilRelease = false;
    };

    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    window.addEventListener("keyup", this._onKeyUp, { passive: false });
    canvas.addEventListener("pointerdown", this._onPointerDown, { passive: false });
    window.addEventListener("pointerup", this._onPointerUp);
    window.addEventListener("pointercancel", this._onPointerUp);
    canvas.addEventListener("lostpointercapture", this._onPointerUp);
    window.addEventListener("blur", this._onBlur);
  }
  _isHeld() { return this._heldPointers.size > 0 || this._heldKeys.size > 0; }
  _releaseIfIdle() {
    if (!this._isHeld()) {
      this._repeatTimer = 0;
      this._blockedUntilRelease = false;
    }
  }
  consumeJump() {
    const value = this._jump && !this._blockedUntilRelease;
    this._jump = false;
    return value;
  }
  consumeFlap(dt) {
    if (this._blockedUntilRelease) { this._jump = false; return false; }
    if (this.consumeJump()) { this._repeatTimer = 0; return true; }
    if (!this._isHeld() || dt <= 0) return false;
    this._repeatTimer += dt;
    if (this._repeatTimer >= AUTO_FLAP_INTERVAL) {
      this._repeatTimer -= AUTO_FLAP_INTERVAL;
      return true;
    }
    return false;
  }
  requireFreshPress() {
    this._jump = false;
    this._repeatTimer = 0;
    this._blockedUntilRelease = this._isHeld();
  }
  consumePause() {
    const value = this._pause;
    this._pause = false;
    return value;
  }
  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    window.removeEventListener("pointerup", this._onPointerUp);
    window.removeEventListener("pointercancel", this._onPointerUp);
    this.canvas.removeEventListener("lostpointercapture", this._onPointerUp);
    window.removeEventListener("blur", this._onBlur);
  }
}
