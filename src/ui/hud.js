export class HudUI {
  constructor(rootEl) {
    this.el = rootEl;
    this._pill = null;
    this._muteBtn = null;
    this._toastEl = null;
    this._toastTimer = 0;
    this._onToggleMute = null;
  }

  show({ muted = false, onToggleMute } = {}) {
    this._onToggleMute = onToggleMute || null;

    this.el.classList.remove("hidden");
    this.el.innerHTML = `
      <div class="hudBar">
        <div class="hudScore">
          <span class="hudLabel">Score</span>
          <strong class="scorePill" id="scorePill">0</strong>
        </div>

        <div class="hudActions">
          <button type="button" class="hudIconBtn" id="muteBtn" aria-label="Toggle mute">
            ${muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      <div class="toast hidden" id="toast" role="status" aria-live="polite"></div>
    `;

    this._pill = this.el.querySelector("#scorePill");
    this._muteBtn = this.el.querySelector("#muteBtn");
    this._toastEl = this.el.querySelector("#toast");

    this._muteBtn?.addEventListener("click", () => this._onToggleMute?.());
  }

  setScore(score) {
    if (this._pill) this._pill.textContent = String(score);
  }

  setMuted(muted) {
    if (this._muteBtn) this._muteBtn.textContent = muted ? "🔇" : "🔊";
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
    this._toastEl = null;
    clearTimeout(this._toastTimer);
    this._toastTimer = 0;
    this._onToggleMute = null;
  }
}