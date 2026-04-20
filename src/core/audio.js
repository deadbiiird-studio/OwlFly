// src/core/audio.js
// Submission-safe hybrid audio:
// - primes on first gesture (mobile policy)
// - WebAudio for low-latency SFX when available
// - HTMLAudio pool fallback (covers slow decode + older WebViews)

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

  async prime() {
    if (this._primed) return;
    this._primed = true;

    // 1) Touch HTMLAudio pools (permission unlock in gesture)
    for (const pool of Object.values(this._pools)) {
      for (const a of pool) touchAudio(a);
    }

    // 2) WebAudio unlock (better latency + reliable)
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

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
      osc.connect(g).connect(this._ctx.destination);
      osc.start();
      osc.stop(this._ctx.currentTime + 0.01);

      if (this._ctx.state === "suspended") {
        await this._ctx.resume().catch(() => {});
      }

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
    if (this._muted) return;

    const gain = clamp01(opts.gain ?? 1);
    const mixTrim = clamp01(this._perSoundTrim(key));
    const finalGain = clamp01(gain * this._mix.master * this._mix.sfx * mixTrim);

    // Prefer WebAudio if buffer exists
    if (this._ctx && this._gainSfx) {
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
        p.catch(() => this._swapToFallback(key));
      }
    } catch {
      this._swapToFallback(key);
    }
  }

  _applyGains() {
    const master = this._muted ? 0 : clamp01(this._mix.master);
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
