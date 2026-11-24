// src/core/audio.js
// Submission-safe hybrid audio:
// - primes on first gesture (mobile policy)
// - WebAudio for low-latency SFX when available
// - HTMLAudio pool fallback (covers slow decode + older WebViews)

// Offline, deterministic three-note studio cue. A separate media element is
// explicitly stopped on skip, background, or completion; no music loop.
export function makeBrandIntroWave() {
  const rate = 24000, length = Math.round(rate * 1.1);
  const wave = new ArrayBuffer(44 + length * 2);
  const view = new DataView(wave);
  const tag = (at, s) => { for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i)); };
  tag(0, "RIFF"); view.setUint32(4, 36 + length * 2, true);
  tag(8, "WAVE"); tag(12, "fmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  tag(36, "data"); view.setUint32(40, length * 2, true);
  const notes = [[0.04, 523.25], [0.25, 659.25], [0.46, 783.99]];
  for (let i = 0; i < length; i++) {
    const time = i / rate;
    let sample = 0;
    for (const [start, freq] of notes) {
      const t = time - start;
      if (t < 0 || t > 0.60) continue;
      const env = Math.min(1, t / 0.025) * Math.exp(-5.5 * t) * Math.min(1, (0.60 - t) / 0.08);
      sample += 0.22 * env * (Math.sin(2 * Math.PI * freq * t) + 0.18 * Math.sin(2 * Math.PI * freq * 2.01 * t));
    }
    view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true);
  }
  return wave;
}

export class BrandIntroSound {
  constructor({ createMedia = () => new Audio(), createURL = (wave) => URL.createObjectURL(new Blob([wave], { type: "audio/wav" })), revokeURL = (url) => URL.revokeObjectURL(url) } = {}) {
    this.createMedia = createMedia;
    this.createURL = createURL;
    this.revokeURL = revokeURL;
    this.attempted = false;
    this.media = null;
    this.url = null;
  }
  play(settings) {
    if (this.attempted) return false;
    this.attempted = true;
    const volume = clamp01((settings.audio?.master ?? 1) * (settings.audio?.sfx ?? 1) * 0.65);
    if (settings.muted || volume === 0) return false;
    try {
      this.url = this.createURL(makeBrandIntroWave());
      this.media = this.createMedia();
      this.media.src = this.url;
      this.media.volume = volume;
      this.media.loop = false;
      const pending = this.media.play();
      pending?.catch(() => this.stop()); // browsers may disallow autoplay
      return true;
    } catch { this.stop(); return false; }
  }
  stop() {
    if (this.media) {
      try { this.media.pause(); this.media.currentTime = 0; this.media.removeAttribute("src"); this.media.load(); } catch {}
      this.media = null;
    }
    if (this.url) { this.revokeURL(this.url); this.url = null; }
  }
}

export class AudioBank {
  constructor(map, mix = {}) {
    this._map = map || {};

    this._ctx = null;
    this._gainMaster = null;
    this._gainSfx = null;

    this._buffers = new Map();
    this._loading = new Map();

    this._muted = false;
    this._primed = false;
    this._active = true;
    this._voices = new Set();

    this._mix = {
      master: clamp01(mix.master ?? 1),
      sfx: clamp01(mix.sfx ?? 1),
      flap: clamp01(mix.flap ?? 1),
      score: clamp01(mix.score ?? 1),
      hit: clamp01(mix.hit ?? 1),
    };

    const test = document.createElement("audio");
    const wavOk = test.canPlayType('audio/wav; codecs="1"') || test.canPlayType("audio/wav") || "";
    const mp3Ok = test.canPlayType("audio/mpeg") || "";
    this._canWav = wavOk !== "";
    this._canMp3 = mp3Ok !== "";

    // HTMLAudio pools (always available as fallback)
    this._pools = {};
    this._chosen = {};

    const base = new URL(".", window.location.href);
    for (const [k, urls] of Object.entries(this._map)) {
      const list = Array.isArray(urls) ? urls : [urls];
      const picked = pickUrl(list, this._canWav, this._canMp3);
      const absPicked = new URL(picked, base).toString();
      const absAll = list.map((u) => new URL(u, base).toString());

      this._chosen[k] = { primary: absPicked, fallbacks: absAll };
      this._pools[k] = makePool(absPicked, 6);
    }
  }

  setMuted(v) {
    this._muted = !!v;
    this._applyGains();
  }

  setMix(partial) {
    if (!partial) return;
    for (const k of Object.keys(this._mix)) {
      if (k in partial) this._mix[k] = clamp01(partial[k]);
    }
    this._applyGains();
  }

  getMix() {
    return { ...this._mix };
  }

  setActive(active) {
    this._active = !!active;
    this._applyGains();
    if (this._active) return;
    for (const pool of Object.values(this._pools)) {
      for (const a of pool) {
        try { a.pause(); a.currentTime = 0; } catch {}
      }
    }
    for (const source of this._voices) {
      try { source.stop(); } catch {}
      try { source.disconnect(); } catch {}
    }
    this._voices.clear();
    if (this._ctx) this._ctx.suspend().catch(() => {});
  }

  _trackVoice(source) {
    this._voices.add(source);
    source.onended = () => {
      this._voices.delete(source);
      try { source.disconnect(); } catch {}
    };
  }

  async prime() {
    if (!this._active) return;
    // Revisit audio activation on each explicit Start/Restart gesture.
    // Mobile browsers may suspend WebAudio after a background/tab interruption.
    if (this._ctx) {
      if (this._ctx.state === "suspended" || this._ctx.state === "interrupted") {
        await this._ctx.resume().catch(() => {});
      }
      if (!this._active) this.setActive(false);
      return;
    }
    if (this._primed) return;
    this._primed = true;

    // 1) Touch HTMLAudio pools (permission unlock in gesture)
    for (const pool of Object.values(this._pools)) {
      for (const a of pool) touchAudio(a);
    }

    // 2) WebAudio unlock (better latency + reliable)
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      this._primed = false;
      return;
    }

    try {
      this._ctx = new Ctx();

      this._gainMaster = this._ctx.createGain();
      this._gainSfx = this._ctx.createGain();
      this._gainSfx.connect(this._gainMaster);
      this._gainMaster.connect(this._ctx.destination);

      // iOS/Safari: play a tiny silent tick
      const osc = this._ctx.createOscillator();
      const g = this._ctx.createGain();
      g.gain.value = 0.0001;
      osc.connect(g).connect(this._gainMaster);
      this._trackVoice(osc);
      osc.start();
      osc.stop(this._ctx.currentTime + 0.01);

      if (this._ctx.state === "suspended") {
        await this._ctx.resume().catch(() => {});
      }

      if (!this._active) this.setActive(false);
      this._applyGains();

      // Fire-and-forget load (decode in background)
      for (const k of Object.keys(this._chosen)) {
        this._ensureLoaded(k);
      }
    } catch {
      // fail open; HTMLAudio fallback still works
      this._ctx = null;
      this._gainMaster = null;
      this._gainSfx = null;
      this._primed = false;
    }
  }

  // Expose WebAudio context + master gain so background music can share the same output chain.
  getContext() {
    return this._ctx;
  }

  getMasterGain() {
    return this._gainMaster;
  }

  play(key, opts = {}) {
    if (this._muted || !this._active) return;

    const gain = clamp01(opts.gain ?? 1);
    const mixTrim = clamp01(this._perSoundTrim(key));
    const finalGain = clamp01(gain * this._mix.master * this._mix.sfx * mixTrim);

    // Prefer WebAudio if buffer exists
    if (this._ctx?.state === "running" && this._gainSfx) {
      const buf = this._buffers.get(key);
      if (buf) {
        const src = this._ctx.createBufferSource();
        src.buffer = buf;

        if (opts.jitterRate) {
          src.playbackRate.value = 0.95 + Math.random() * 0.1;
        } else if (typeof opts.rate === "number") {
          src.playbackRate.value = opts.rate;
        }

        const g = this._ctx.createGain();
        g.gain.value = finalGain;

        src.connect(g).connect(this._gainSfx);
        this._trackVoice(src);
        src.start();
        return;
      }

      // If not yet loaded, start load in background
      this._ensureLoaded(key);
    }

    // Fallback: HTMLAudio pool
    const pool = this._pools[key];
    if (!pool || pool.length === 0) return;

    let a = pool.find((n) => n.paused || n.ended);
    if (!a) a = pool[0];

    try {
      a.currentTime = 0;
      a.volume = finalGain;

      if (opts.jitterRate) {
        a.playbackRate = 0.95 + Math.random() * 0.1;
      } else {
        a.playbackRate = 1.0;
      }

      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => { if (this._active) this._swapToFallback(key); });
      }
    } catch {
      this._swapToFallback(key);
    }
  }

  playCountdownTone(number) {
    if (this._muted || !this._active || !this._ctx || !this._gainSfx) return false;
    if (this._ctx.state !== "running") {
      this._ctx.resume?.().catch(() => {});
      return false;
    }
    try {
      const go = number === 0;
      const freq = go ? 880 : ({ 3: 440, 2: 554, 1: 659 }[number] || 440);
      const duration = go ? 0.28 : 0.14;
      const at = this._ctx.currentTime;
      const oscillator = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      oscillator.type = go ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(freq, at);
      if (go) oscillator.frequency.linearRampToValueAtTime(1175, at + duration);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(go ? 0.20 : 0.15, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(gain).connect(this._gainSfx);
      this._trackVoice(oscillator);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.015);
      return true;
    } catch { return false; }
  }

  _applyGains() {
    const master = this._muted || !this._active ? 0 : clamp01(this._mix.master);
    if (this._gainMaster) this._gainMaster.gain.value = master;

    // SFX gain is separate so future music can be added cleanly.
    if (this._gainSfx) this._gainSfx.gain.value = clamp01(this._mix.sfx);
  }

  _perSoundTrim(key) {
    // Map keys to trims without requiring callers to know mix shape.
    if (key === "jump" || key === "flap") return this._mix.flap;
    if (key === "score") return this._mix.score;
    if (key === "hit") return this._mix.hit;
    return 1;
  }

  _swapToFallback(key) {
    const info = this._chosen[key];
    if (!info) return;

    // Find first URL different from current
    const next = info.fallbacks.find((u) => u !== info.primary);
    if (!next) return;

    for (const a of this._pools[key] || []) {
      try { a.pause(); a.currentTime = 0; } catch {}
    }
    info.primary = next;
    this._pools[key] = makePool(next, 6);

    // Also reset WebAudio buffer attempt
    this._buffers.delete(key);
    this._loading.delete(key);
    if (this._ctx) this._ensureLoaded(key);
  }

  _ensureLoaded(key) {
    if (!this._ctx) return;
    if (this._buffers.has(key)) return;
    if (this._loading.has(key)) return;

    const info = this._chosen[key];
    if (!info) return;

    const p = this._loadAny(key, info.fallbacks);
    this._loading.set(key, p);
    p.finally(() => this._loading.delete(key));
  }

  async _loadAny(key, urls) {
    if (!this._ctx) return;

    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (!res.ok) continue;

        const arr = await res.arrayBuffer();
        const buf = await this._ctx.decodeAudioData(arr);
        this._buffers.set(key, buf);
        return;
      } catch {
        // try next
      }
    }
  }
}

function pickUrl(list, canWav, canMp3) {
  for (const u of list) {
    const lower = String(u).toLowerCase();
    if (lower.endsWith(".wav") && canWav) return u;
    if (lower.endsWith(".mp3") && canMp3) return u;
  }
  return list[0];
}

function makePool(absUrl, size = 6) {
  const pool = [];
  for (let i = 0; i < size; i++) {
    const a = new Audio(absUrl);
    a.preload = "auto";
    pool.push(a);
  }
  return pool;
}

function touchAudio(a) {
  try {
    const prevVol = a.volume;
    a.volume = 0;
    a.muted = true;

    const p = a.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
        a.volume = prevVol;
      }).catch(() => {
        a.muted = false;
        a.volume = prevVol;
      });
    } else {
      a.muted = false;
      a.volume = prevVol;
    }
  } catch {
    // ignore
  }
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
