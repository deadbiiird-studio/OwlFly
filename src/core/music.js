// src/core/music.js
// Lightweight procedural background music (WebAudio).
// - Original, simple, upbeat loop (no copyrighted melody)
// - Starts only after user gesture (call start after AudioContext is primed)
// - Theme-aware key/tempo

export class MusicLoop {
  constructor({ ctx, destination, volume = 0.25, enabled = true } = {}) {
    this._ctx = ctx || null;
    this._dest = destination || null;

    this._enabled = !!enabled;
    this._baseVol = clamp01(volume);

    this._gain = null;
    this._filter = null;

    this._timer = 0;
    this._running = false;

    this._tempo = 104;
    this._mode = "minor";
    this._rootMidi = 57; // A3

    this._nextTime = 0;
    this._step = 0;

    this._duck = { amount: 0, until: 0 };

    this._pattern = buildPattern();
  }

  attach({ ctx, destination } = {}) {
    if (ctx) this._ctx = ctx;
    if (destination) this._dest = destination;

    if (!this._ctx || !this._dest) return;

    if (!this._gain) {
      this._gain = this._ctx.createGain();
      this._gain.gain.value = 0;

      // gentle tone shaping
      this._filter = this._ctx.createBiquadFilter();
      this._filter.type = "lowpass";
      this._filter.frequency.value = 2800;
      this._filter.Q.value = 0.7;

      this._gain.connect(this._filter);
      this._filter.connect(this._dest);

      this._applyGain(0.0);
    }
  }

  setEnabled(v) {
    this._enabled = !!v;
    if (!this._enabled) this.stop();
    else if (this._enabled && this._ctx && this._dest && this._running) this._applyGain(1);
  }

  setVolume(v01) {
    this._baseVol = clamp01(v01);
    if (this._running) this._applyGain(1);
  }

  setTheme(themeId) {
    const t = String(themeId || "night");
    // Small variations per theme.
    // NOTE: these are *not* copyrighted melodies; only key/tempo/timbre changes.
    if (t === "sunrise") {
      this._rootMidi = 60; // C4
      this._mode = "major";
      this._tempo = 112;
      this._setFilter(3200);
      return;
    }
    if (t === "dusk") {
      this._rootMidi = 62; // D4
      this._mode = "minor";
      this._tempo = 106;
      this._setFilter(3000);
      return;
    }
    if (t === "haunted") {
      this._rootMidi = 64; // E4
      this._mode = "minor";
      this._tempo = 96;
      this._setFilter(2400);
      return;
    }
    if (t === "neon") {
      this._rootMidi = 66; // F#4
      this._mode = "minor";
      this._tempo = 118;
      this._setFilter(3600);
      return;
    }

    // night default
    this._rootMidi = 57; // A3
    this._mode = "minor";
    this._tempo = 104;
    this._setFilter(2800);
  }

  start({ themeId } = {}) {
    if (!this._enabled) return;
    if (!this._ctx || !this._dest) return;

    this.attach({ ctx: this._ctx, destination: this._dest });
    this.setTheme(themeId);

    if (this._running) return;

    this._running = true;
    this._step = 0;
    this._nextTime = this._ctx.currentTime + 0.05;

    // Scheduler tick (lightweight)
    this._timer = window.setInterval(() => this._tick(), 25);

    // fade in
    this._applyGain(1);
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    if (this._timer) window.clearInterval(this._timer);
    this._timer = 0;
    this._applyGain(0);
  }

  // Briefly reduce music volume when SFX plays (feels more "premium")
  duck(amount = 0.35, holdMs = 90) {
    if (!this._running) return;
    const a = clamp01(amount);
    this._duck.amount = Math.max(this._duck.amount, a);
    this._duck.until = Math.max(this._duck.until, performance.now() + Math.max(20, holdMs));
    this._applyGain(1);
  }

  _tick() {
    if (!this._running || !this._ctx) return;

    const now = this._ctx.currentTime;
    const ahead = 0.35;

    while (this._nextTime < now + ahead) {
      this._scheduleStep(this._step, this._nextTime);
      this._step = (this._step + 1) % this._pattern.steps;
      this._nextTime += this._secPerStep();
    }

    // decay duck amount
    if (performance.now() > this._duck.until) {
      this._duck.amount = 0;
    }

    this._applyGain(1);
  }

  _scheduleStep(step, t) {
    const pat = this._pattern;
    const entry = pat.events.get(step);
    if (!entry) return;

    // Resolve scale degrees to midi notes in current key/mode.
    const scale = this._mode === "major" ? MAJOR : MINOR;

    // Bass (short pluck)
    if (entry.bass !== null) {
      const midi = this._rootMidi + (scale[wrap(entry.bass, 0, 6)] || 0) - 12;
      this._note({ midi, t, dur: this._secPerStep() * 1.85, type: "triangle", vol: 0.18 });
    }

    // Melody (soft square)
    if (entry.mel !== null) {
      const midi = this._rootMidi + (scale[wrap(entry.mel.degree, 0, 6)] || 0) + 12 * (entry.mel.oct || 1);
      this._note({ midi, t, dur: this._secPerStep() * entry.mel.len, type: "square", vol: 0.12 });
    }

    // Light "click" percussion (noise burst) every beat
    if (entry.tick) {
      this._noise({ t, dur: 0.018, vol: 0.04 });
    }
  }

  _note({ midi, t, dur, type, vol }) {
    if (!this._ctx || !this._gain) return;

    const osc = this._ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = midiToHz(midi);

    const g = this._ctx.createGain();
    const a = clamp01(vol);

    // envelope
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.02, dur));

    // subtle detune variance to avoid harshness
    osc.detune.value = (Math.random() * 8 - 4) * 1.0;

    osc.connect(g);
    g.connect(this._gain);

    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  _noise({ t, dur, vol }) {
    if (!this._ctx || !this._gain) return;

    const len = Math.max(1, Math.floor(this._ctx.sampleRate * dur));
    const buf = this._ctx.createBuffer(1, len, this._ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.4;

    const src = this._ctx.createBufferSource();
    src.buffer = buf;

    const f = this._ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1800;

    const g = this._ctx.createGain();
    const a = clamp01(vol);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(a, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.01, dur));

    src.connect(f);
    f.connect(g);
    g.connect(this._gain);

    src.start(t);
    src.stop(t + dur + 0.01);
  }

  _secPerStep() {
    // pattern is 8th-note grid
    const beat = 60 / Math.max(40, this._tempo);
    return beat / 2;
  }

  _setFilter(freq) {
    if (this._filter) {
      this._filter.frequency.value = Math.max(800, Math.min(8000, Number(freq) || 2800));
    }
  }

  _applyGain(on) {
    if (!this._gain) return;

    // base: music volume * master * (duck)
    const duck = 1 - clamp01(this._duck.amount);
    const target = (on ? 1 : 0) * this._baseVol * duck;

    const now = this._ctx ? this._ctx.currentTime : 0;
    try {
      this._gain.gain.cancelScheduledValues(now);
      this._gain.gain.setValueAtTime(this._gain.gain.value || 0.0001, now);
      // quick but smooth
      this._gain.gain.linearRampToValueAtTime(target, now + 0.08);
    } catch {
      this._gain.gain.value = target;
    }
  }
}

// 64 steps = 8 bars of 4/4 at 8th-note resolution.
// A simple, upbeat, original loop.
function buildPattern() {
  const steps = 64;
  const events = new Map();

  // Bass hits on beats (every 2 steps)
  // Progression degrees (scale degree indices): i - VI - III - VII (minor-ish pop)
  const bassBars = [0, 5, 2, 6, 0, 5, 3, 6];

  for (let s = 0; s < steps; s++) {
    const beat = s % 2 === 0; // every beat (quarter note) gets a tick
    const bar = Math.floor(s / 8); // 8 steps per bar
    const bassDegree = beat ? bassBars[bar] : null;

    events.set(s, { bass: bassDegree, mel: null, tick: beat });
  }

  // Melody phrase (hand-authored, original)
  // Each entry: step -> {degree, oct, len(in steps)}
  const mel = [
    // bar 1
    [0, 2, 1], [2, 2, 1], [4, 2, 2], [2, 2, 1], [1, 2, 1], [0, 2, 2],
    // bar 2
    [2, 2, 1], [4, 2, 1], [6, 2, 2], [5, 2, 1], [4, 2, 1], [2, 2, 2],
    // bar 3
    [3, 2, 1], [5, 2, 1], [0, 3, 2], [6, 2, 1], [5, 2, 1], [4, 2, 2],
    // bar 4 (resolve)
    [2, 2, 1], [4, 2, 1], [5, 2, 2], [4, 2, 1], [2, 2, 1], [0, 2, 2],
  ];

  // place melody starting at bar 1 step 0, repeat at bar 5
  placeMelody(events, 0, mel);
  placeMelody(events, 32, mel);

  return { steps, events };
}

function placeMelody(events, startStep, entries) {
  let s = startStep;
  for (const [degree, oct, len] of entries) {
    if (s >= startStep + 32) break; // 4 bars per phrase
    const e = events.get(s);
    if (e) e.mel = { degree, oct, len: Math.max(1, len) };
    s += Math.max(1, len);
  }
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function wrap(n, lo, hi) {
  const span = hi - lo + 1;
  const x = ((n - lo) % span + span) % span + lo;
  return x;
}
