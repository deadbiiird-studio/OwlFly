export class HudUI {
  constructor(rootEl) {
    this.el = rootEl;
    this._pill = null;
    this._muteBtn = null;
    this._rmBtn = null;
    this._toastEl = null;
    this._toastTimer = 0;
    this._onToggleMute = null;
    this._onToggleRM = null;
  }

  show({ muted = false, reducedMotion = false, onToggleMute, onToggleRM } = {}) {
    this._onToggleMute = onToggleMute || null;
    this._onToggleRM = onToggleRM || null;

    this.el.classList.remove("hidden");
    this.el.innerHTML = `
      <div class="hudBar">
        <div class="hudScore">
          <span class="hudLabel">Score</span>
          <strong class="scorePill" id="scorePill">0</strong>
        </div>

        <div class="hudActions">
          <button type="button" class="hudIconBtn" id="muteBtn" aria-label="Toggle mute">
            ${muted ? "Muted" : "Sound"}
          </button>
          <button type="button" class="hudIconBtn" id="rmBtn" aria-label="Toggle reduced motion">
            ${reducedMotion ? "Slow" : "Motion"}
          </button>
        </div>
      </div>

      <div class="toast hidden" id="toast" role="status" aria-live="polite"></div>
    `;

    this._pill = this.el.querySelector("#scorePill");
    this._muteBtn = this.el.querySelector("#muteBtn");
    this._rmBtn = this.el.querySelector("#rmBtn");
    this._toastEl = this.el.querySelector("#toast");

    this._muteBtn?.addEventListener("click", () => this._onToggleMute?.());
    this._rmBtn?.addEventListener("click", () => this._onToggleRM?.());
  }

  setScore(score) {
    if (this._pill) this._pill.textContent = String(score);
  }

  setMuted(muted) {
    if (this._muteBtn) this._muteBtn.textContent = muted ? "Muted" : "Sound";
  }

  setReducedMotion(reducedMotion) {
    if (this._rmBtn) this._rmBtn.textContent = reducedMotion ? "Slow" : "Motion";
  }

  toast(message, ms = 1700) {
    if (!this._toastEl) return;

    const text = String(message || "").trim();
    if (!text) return;

    this._toastEl.textContent = text;
    this._toastEl.classList.remove("hidden");
    this._toastEl.classList.add("show");

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      if (!this._toastEl) return;
      this._toastEl.classList.remove("show");
      setTimeout(() => this._toastEl?.classList.add("hidden"), 220);
    }, Math.max(600, ms));
  }

  hide() {
    this.el.classList.add("hidden");
    this.el.innerHTML = "";

    this._pill = null;
    this._muteBtn = null;
    this._rmBtn = null;
    this._toastEl = null;
    clearTimeout(this._toastTimer);
    this._toastTimer = 0;
    this._onToggleMute = null;
    this._onToggleRM = null;
  }
}

