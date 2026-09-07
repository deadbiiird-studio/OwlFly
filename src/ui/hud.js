export class HudUI {
  constructor(rootEl) {
    this.el = rootEl;
    this._pill = null;
    this._muteBtn = null;
    this._rmBtn = null;
    this._toastEl = null;
    this._toastTimer = 0;
    this._scorePulseTimer = 0;
    this._score = 0;
    this._onToggleMute = null;
    this._onToggleRM = null;
  }

  show({ muted = false, reducedMotion = false, onToggleMute, onToggleRM } = {}) {
    this._onToggleMute = onToggleMute || null;
    this._onToggleRM = onToggleRM || null;
    this._score = 0;

    this.el.classList.remove("hidden");
    this.el.innerHTML = `
      <div class="hudBar" role="group" aria-label="Flight status and controls">
        <div class="hudScore" aria-label="Current flight score">
          <span class="hudLabel">Flight</span>
          <strong
            class="scorePill"
            id="scorePill"
            aria-live="polite"
            aria-atomic="true"
            aria-label="Score 0"
          >0</strong>
        </div>

        <div class="hudActions" role="group" aria-label="Quick settings">
          <button
            type="button"
            class="hudIconBtn"
            id="muteBtn"
            aria-label="Mute sound"
            aria-pressed="${muted ? "true" : "false"}"
            title="${muted ? "Unmute sound" : "Mute sound"}"
          >
            <span class="hudControlIcon" aria-hidden="true">${muted ? "🔇" : "🔊"}</span>
          </button>
          <button
            type="button"
            class="hudIconBtn"
            id="rmBtn"
            aria-label="Reduce motion"
            aria-pressed="${reducedMotion ? "true" : "false"}"
            title="${reducedMotion ? "Use full motion" : "Reduce motion"}"
          >
            <span class="hudControlIcon" aria-hidden="true">${reducedMotion ? "🐢" : "✨"}</span>
          </button>
        </div>
      </div>

      <div class="toast hidden" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>
    `;

    this._pill = this.el.querySelector("#scorePill");
    this._muteBtn = this.el.querySelector("#muteBtn");
    this._rmBtn = this.el.querySelector("#rmBtn");
    this._toastEl = this.el.querySelector("#toast");

    this._muteBtn?.addEventListener("click", () => this._onToggleMute?.());
    this._rmBtn?.addEventListener("click", () => this._onToggleRM?.());
  }

  setScore(score) {
    const next = Number.isFinite(Number(score)) ? Number(score) : 0;
    const changed = next !== this._score;
    const increased = next > this._score;
    this._score = next;

    if (!this._pill) return;

    this._pill.textContent = String(next);
    this._pill.setAttribute("aria-label", `Score ${next}`);

    if (changed && increased) {
      this._pill.classList.remove("scorePill--pulse");
      void this._pill.offsetWidth;
      this._pill.classList.add("scorePill--pulse");
      clearTimeout(this._scorePulseTimer);
      this._scorePulseTimer = setTimeout(() => {
        this._pill?.classList.remove("scorePill--pulse");
      }, 220);
    }
  }

  setMuted(muted) {
    if (!this._muteBtn) return;

    const on = !!muted;
    this._muteBtn.setAttribute("aria-pressed", on ? "true" : "false");
    this._muteBtn.setAttribute("aria-label", on ? "Unmute sound" : "Mute sound");
    this._muteBtn.title = on ? "Unmute sound" : "Mute sound";

    const icon = this._muteBtn.querySelector(".hudControlIcon");
    if (icon) icon.textContent = on ? "🔇" : "🔊";
  }

  setReducedMotion(reducedMotion) {
    if (!this._rmBtn) return;

    const on = !!reducedMotion;
    this._rmBtn.setAttribute("aria-pressed", on ? "true" : "false");
    this._rmBtn.setAttribute("aria-label", on ? "Use full motion" : "Reduce motion");
    this._rmBtn.title = on ? "Use full motion" : "Reduce motion";

    const icon = this._rmBtn.querySelector(".hudControlIcon");
    if (icon) icon.textContent = on ? "🐢" : "✨";
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
    clearTimeout(this._scorePulseTimer);
    this._toastTimer = 0;
    this._scorePulseTimer = 0;
    this._score = 0;
    this._onToggleMute = null;
    this._onToggleRM = null;
  }
}
