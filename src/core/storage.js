import { AUDIO, STORAGE_KEYS } from "./constants.js";

export function loadHighScore() {
  const raw = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function saveHighScore(score) {
  const n = Math.max(0, Math.floor(score));
  localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(n));
}

const DEFAULT_SETTINGS = {
  muted: false,
  reducedMotion: false,
  musicEnabled: true,
  audio: {
    master: AUDIO.MASTER,
    sfx: AUDIO.SFX,
    music: AUDIO.MUSIC,
    flap: AUDIO.FLAP,
    score: AUDIO.SCORE,
    hit: AUDIO.HIT,
  },
};

export function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) return structuredCloneFallback(DEFAULT_SETTINGS);

  try {
    const obj = JSON.parse(raw);

    const out = structuredCloneFallback(DEFAULT_SETTINGS);

    out.muted = !!obj.muted;
    out.reducedMotion = !!obj.reducedMotion;
    out.musicEnabled = obj.musicEnabled !== false;


    // Audio (optional)
    const a = obj.audio || {};
    out.audio.master = clamp01(numOr(a.master, out.audio.master));
    out.audio.sfx = clamp01(numOr(a.sfx, out.audio.sfx));
    out.audio.music = clamp01(numOr(a.music, out.audio.music));
    out.audio.flap = clamp01(numOr(a.flap, out.audio.flap));
    out.audio.score = clamp01(numOr(a.score, out.audio.score));
    out.audio.hit = clamp01(numOr(a.hit, out.audio.hit));

    return out;
  } catch {
    return structuredCloneFallback(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  const safe = {
    muted: !!settings?.muted,
    reducedMotion: !!settings?.reducedMotion,
    musicEnabled: settings?.musicEnabled !== false,
    audio: {
      master: clamp01(numOr(settings?.audio?.master, DEFAULT_SETTINGS.audio.master)),
      sfx: clamp01(numOr(settings?.audio?.sfx, DEFAULT_SETTINGS.audio.sfx)),
      music: clamp01(numOr(settings?.audio?.music, DEFAULT_SETTINGS.audio.music)),
      flap: clamp01(numOr(settings?.audio?.flap, DEFAULT_SETTINGS.audio.flap)),
      score: clamp01(numOr(settings?.audio?.score, DEFAULT_SETTINGS.audio.score)),
      hit: clamp01(numOr(settings?.audio?.hit, DEFAULT_SETTINGS.audio.hit)),
    },
  };

  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(safe));
}

function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function structuredCloneFallback(x) {
  // Some older WebViews don’t support structuredClone.
  try {
    return structuredClone(x);
  } catch {
    return JSON.parse(JSON.stringify(x));
  }
}
