import { getTheme, getThemePreview } from "../core/themes.js";

export class MenuUI {
  constructor(rootEl) {
    this.el = rootEl;
    this.el.innerHTML = "";

    this._ranges = null;
    this._vals = null;
    this._onAudioChange = null;
    this._onSelectTheme = null;

    this._toastEl = null;
    this._toastTimer = 0;

    this._startHotkeys = null;
  }

  show({
    optionsOnly = false,
    muted,
    musicEnabled,
    audio,
    themes,
    selectedTheme,
    unlockedThemes,
    achievements,
    stats,
    onStart,
    onBack,
    onToggleMute,
    onToggleMusic,
    onAudioChange,
    onResetAudio,
    onSelectTheme,
  }) {
    this._onAudioChange = onAudioChange || null;
    this._onSelectTheme = onSelectTheme || null;

    const a = audio || {
      master: 1,
      sfx: 1,
      music: 0.25,
      flap: 1,
      score: 1,
      hit: 1,
    };

    this.el.classList.remove("hidden");

    const themeList = Array.isArray(themes) ? themes : [];
    const unlocked = new Set(Array.isArray(unlockedThemes) ? unlockedThemes : ["night"]);
    const sel = String(selectedTheme || "night");

    const achList = Array.isArray(achievements) ? achievements : [];
    const earnedCount = achList.filter((x) => !!x.earned).length;
    const runs = Math.max(0, stats?.runs || 0);
    const flaps = Math.max(0, stats?.flaps || 0);

    // Preserve disclosure state across sound/theme changes, not across flights.
    const openSections = new Set([...this.el.querySelectorAll("details[open]")].map(el => el.id));
    const oldPanel = this.el.querySelector(".menuPanel");
    const scrollTop = oldPanel?.scrollTop || 0;
    const focused = this.el.contains(document.activeElement) ? document.activeElement : null;
    const focusId = focused?.id;
    const focusTheme = focused?.getAttribute("data-theme");

    this.el.innerHTML = `
      <div class="panel menuPanel minimalMenu">
        ${!optionsOnly ? `
          <div class="menuHero"><h1 class="title">OwlFly</h1></div>
          <div class="row startRow wideRow">
            <button type="button" class="primary big wideBtn" id="startBtn">Fly</button>
          </div>
        ` : `
          <div class="menuHero"><h1 class="title optionsTitle">Options</h1></div>
          <button type="button" id="optionsBack" class="wideBtn">Back</button>
          <div class="moreBody">
            <div class="statChips">
              <span class="badge">Runs ${runs}</span>
              <span class="badge">Flaps ${flaps}</span>
            </div>
        <details class="menuSection" id="audioSection">
          <summary id="audioSummary">Audio</summary>
          <div class="sectionBody">
            <div class="row wideRow wrapRow">
              <button id="muteBtn">${muted ? "Unmute" : "Mute"}</button>
              <button id="musicBtn">Music: ${musicEnabled === false ? "Off" : "On"}</button>
            </div>

          </div>
        </details>

        <details class="menuSection" id="themeSection">
          <summary id="themeSummary">Sky Themes</summary>
          <div class="sectionBody">
            <div class="themeGrid">
              ${themeList
                .map((t) => {
                  const prev = getThemePreview(t);
                  const isUnlocked = unlocked.has(t.id);
                  const isSelected = t.id === sel;

                  const sub = isSelected
                    ? "Active"
                    : isUnlocked
                      ? "Tap to activate"
                      : `Locked • ${t.unlock?.text || "Keep flying"}`;

                  return `
                    <button class="themeCard ${isUnlocked ? "" : "locked"} ${
                      isSelected ? "selected" : ""
                    }" data-theme="${t.id}" type="button">
                      <div class="themeSwatch" style="--a:${prev.a};--b:${prev.b};--c:${prev.c};--accent:${prev.accent}"></div>
                      <div class="themeInfo">
                        <div class="themeName">${t.name}</div>
                        <div class="themeSub">${sub}</div>
                      </div>
                      <div class="themeMark">${isSelected ? "✓" : isUnlocked ? "" : "🔒"}</div>
                    </button>
                  `;
                })
                .join("")}
            </div>

            <div class="menuToast hidden" id="menuToast" role="status" aria-live="polite"></div>
          </div>
        </details>

        <details class="menuSection" id="achievementSection">
          <summary id="achievementSummary">Achievements <span class="badge">${earnedCount}/${achList.length}</span></summary>
          <div class="sectionBody">
            <div class="achList">
              ${achList
                .map((a) => {
                  const p = a.progress || { current: 0, target: 1, earned: false };
                  const pct01 = clamp01(Number(p.pct || 0));
                  const right = a.earned ? "✓" : `${Math.min(p.current, p.target)}/${p.target}`;
                  const rewardTheme = a.reward?.theme ? getTheme(a.reward.theme) : null;
                  const reward = rewardTheme ? `• Unlocks <strong>${rewardTheme.name}</strong>` : "";

                  return `
                    <div class="achRow ${a.earned ? "earned" : ""}">
                      <div class="achMain">
                        <div class="achTitle">${a.earned ? "🏆" : "☆"} ${a.title}</div>
                        <div class="achDesc">${a.desc} ${reward}</div>
                        <div class="achBar"><div class="achFill" style="width:${Math.round(
                          pct01 * 100
                        )}%"></div></div>
                      </div>
                      <div class="achMeta">${right}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </details>

        <p class="footer"><a class="privacyLink" id="privacyLink" href="./privacy.html">Privacy Policy</a></p>
          </div>
        `}
      </div>
    `;

    const startBtn = this.el.querySelector("#startBtn");
    startBtn?.addEventListener("click", onStart);

    this.el.querySelector("#optionsBack")?.addEventListener("click", onBack);
    this._attachStartHotkeys(optionsOnly ? null : onStart);
    for (const details of this.el.querySelectorAll("details")) {
      details.open = openSections.has(details.id);
    }
    const panel = this.el.querySelector(".menuPanel");
    if (panel) panel.scrollTop = scrollTop;
    const restored = focusId ? this.el.querySelector("#" + focusId) :
      [...this.el.querySelectorAll("[data-theme]")].find(el => el.getAttribute("data-theme") === focusTheme);
    if (restored) restored.focus?.({ preventScroll: true });

    this.el.querySelector("#muteBtn")?.addEventListener("click", onToggleMute);
    this.el.querySelector("#musicBtn")?.addEventListener("click", onToggleMusic);
    this.el.querySelector("#resetAudioBtn")?.addEventListener("click", onResetAudio);

    this.el.querySelectorAll("[data-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-theme");
        if (btn.classList.contains("locked")) {
          const label = btn.querySelector(".themeName")?.textContent || "Theme";
          const sub = btn.querySelector(".themeSub")?.textContent || "Locked";
          this.toast(`🔒 ${label} — ${sub}`);
          return;
        }
        this._onSelectTheme?.(id);
      });
    });

    this._toastEl = this.el.querySelector("#menuToast");

    this._ranges = {
      master: this.el.querySelector("#range_master"),
      sfx: this.el.querySelector("#range_sfx"),
      music: this.el.querySelector("#range_music"),
      flap: this.el.querySelector("#range_flap"),
      score: this.el.querySelector("#range_score"),
    };

    this._vals = {
      master: this.el.querySelector("#val_master"),
      sfx: this.el.querySelector("#val_sfx"),
      music: this.el.querySelector("#val_music"),
      flap: this.el.querySelector("#val_flap"),
      score: this.el.querySelector("#val_score"),
    };

    for (const k of Object.keys(this._ranges)) {
      const r = this._ranges[k];
      if (!r) continue;
      r.addEventListener("input", () => {
        const v = clamp01(Number(r.value) / 100);
        if (this._vals[k]) this._vals[k].textContent = pct(v);
        this._onAudioChange?.({ [k]: v });
      });
    }

    this.setAudio(a);
  }

  _attachStartHotkeys(onStart) {
    this._detachStartHotkeys();

    this._startHotkeys = (e) => {
      if (e.code !== "Enter" && e.code !== "Space") return;
      // The game input listener otherwise consumes Space/Enter before native
      // keyboard activation. Keep menu controls operable without starting a run.
      const control = e.target?.closest?.("a, button, summary, input, select, textarea, [contenteditable='true']");
      if (control && this.el.contains(control)) {
        e.stopImmediatePropagation();
        if (control.matches("button, summary") || (control.matches("a") && e.code === "Enter")) {
          e.preventDefault();
          if (!e.repeat) control.click();
        }
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) onStart?.();
    };

    window.addEventListener("keydown", this._startHotkeys, { capture: true });
  }

  _detachStartHotkeys() {
    if (!this._startHotkeys) return;
    window.removeEventListener("keydown", this._startHotkeys, { capture: true });
    this._startHotkeys = null;
  }

  setAudio(audio) {
    if (!this._ranges || !this._vals) return;

    const a = audio || {};
    for (const k of Object.keys(this._ranges)) {
      const r = this._ranges[k];
      const v = clamp01(Number(a[k]));
      if (r) r.value = String(Math.round(v * 100));
      if (this._vals[k]) this._vals[k].textContent = pct(v);
    }
  }

  hide() {
    this._detachStartHotkeys();

    this.el.classList.add("hidden");
    this.el.innerHTML = "";
    this._ranges = null;
    this._vals = null;
    this._onAudioChange = null;
    this._onSelectTheme = null;
    this._toastEl = null;
    clearTimeout(this._toastTimer);
    this._toastTimer = 0;
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
}

function sliderRow(label, key, value01) {
  const v = clamp01(Number(value01));
  return `
    <div class="settingRow">
      <div class="settingLabel">${label}</div>
      <input class="range" id="range_${key}" type="range" min="0" max="100" value="${Math.round(
    v * 100
  )}" />
      <div class="settingVal" id="val_${key}">${pct(v)}</div>
    </div>
  `;
}

function pct(v) {
  return `${Math.round(clamp01(v) * 100)}%`;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
