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
    best,
    muted,
    reducedMotion,
    musicEnabled,
    audio,
    themes,
    selectedTheme,
    unlockedThemes,
    achievements,
    stats,
    onStart,
    onToggleMute,
    onToggleRM,
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

    this.el.innerHTML = `
      <div class="panel menuPanel sacredMenu">
        <div class="menuHero">
          <div class="eyebrow">Sacred Portal</div>
          <h1 class="title">OwlFly</h1>
          <p class="sub">Fly clean. Break through. Touch the hidden sky.</p>
        </div>

        <div class="statChips">
          <span class="badge strong">Best <strong>${best}</strong></span>
          <span class="badge">Runs ${runs}</span>
          <span class="badge">Flaps ${flaps}</span>
        </div>

        <div class="row startRow wideRow">
          <button class="primary big wideBtn" id="startBtn">Start Flight</button>
        </div>

        <details class="menuSection" open>
          <summary>Flight Controls</summary>
          <div class="sectionBody">
            <div class="row wideRow wrapRow">
              <button id="muteBtn">${muted ? "Unmute" : "Mute"}</button>
              <button id="rmBtn">${reducedMotion ? "Motion: Low" : "Motion: Full"}</button>
              <button id="musicBtn">Music: ${musicEnabled === false ? "Off" : "On"}</button>
            </div>

            <div class="settings compact">
              <div class="settingsTitle">Audio mix</div>
              ${sliderRow("Master", "master", a.master)}
              ${sliderRow("SFX", "sfx", a.sfx)}
              ${sliderRow("Music", "music", a.music)}
              ${sliderRow("Flap", "flap", a.flap)}
              ${sliderRow("Score", "score", a.score)}

              <div class="row compact wideRow">
                <button id="resetAudioBtn">Reset audio</button>
              </div>
            </div>
          </div>
        </details>

        <details class="menuSection">
          <summary>Sky Themes</summary>
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

        <details class="menuSection">
          <summary>Achievements <span class="badge">${earnedCount}/${achList.length}</span></summary>
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

        <p class="footer"><small>Enter / Space starts a run • Esc pauses during play</small></p>
      </div>
    `;

    const startBtn = this.el.querySelector("#startBtn");
    startBtn?.addEventListener("click", onStart);

    this._attachStartHotkeys(onStart);
    setTimeout(() => startBtn?.focus?.(), 0);

    this.el.querySelector("#muteBtn")?.addEventListener("click", onToggleMute);
    this.el.querySelector("#rmBtn")?.addEventListener("click", onToggleRM);
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
      e.preventDefault();
      e.stopImmediatePropagation();
      onStart?.();
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
