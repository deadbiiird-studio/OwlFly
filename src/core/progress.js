import { STORAGE_KEYS } from "./constants.js";

export const ACHIEVEMENTS = [
  {
    id: "first_flap",
    title: "First Flap",
    desc: "Flap once.",
    type: "flaps",
    target: 1,
    reward: null,
  },
  {
    id: "score_5",
    title: "Getting Air",
    desc: "Reach score 5.",
    type: "score",
    target: 5,
    reward: null,
  },
  {
    id: "score_10",
    title: "Sunrise Runner",
    desc: "Reach score 10.",
    type: "score",
    target: 10,
    reward: { theme: "sunrise" },
  },
  {
    id: "runs_10",
    title: "Ten Runs",
    desc: "Finish 10 runs.",
    type: "runs",
    target: 10,
    reward: { theme: "dusk" },
  },
  {
    id: "score_25",
    title: "Through the Fog",
    desc: "Reach score 25.",
    type: "score",
    target: 25,
    reward: { theme: "haunted" },
  },
  {
    id: "flaps_250",
    title: "Strong Wings",
    desc: "Flap 250 times total.",
    type: "flaps",
    target: 250,
    reward: null,
  },
  {
    id: "runs_25",
    title: "Still Here",
    desc: "Finish 25 runs.",
    type: "runs",
    target: 25,
    reward: null,
  },
  {
    id: "score_50",
    title: "Neon Legend",
    desc: "Reach score 50.",
    type: "score",
    target: 50,
    reward: { theme: "neon" },
  },
];

const DEFAULT_PROFILE = {
  v: 1,
  selectedTheme: "night",
  unlockedThemes: ["night"],
  achievements: {},
  stats: {
    runs: 0,
    flaps: 0,
    bestScore: 0,
    totalScore: 0,
  },
};

export function loadProfile() {
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!raw) return clone(DEFAULT_PROFILE);

  try {
    const obj = JSON.parse(raw);
    const p = mergeProfile(obj);
    return p;
  } catch {
    return clone(DEFAULT_PROFILE);
  }
}

export function saveProfile(profile) {
  const safe = mergeProfile(profile);
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(safe));
}

export function getUnlockedThemes(profile) {
  const arr = profile?.unlockedThemes;
  if (!Array.isArray(arr)) return ["night"];
  const out = [];
  for (const id of arr) {
    const s = String(id || "").trim();
    if (s && !out.includes(s)) out.push(s);
  }
  if (!out.includes("night")) out.unshift("night");
  return out;
}

export function isAchievementEarned(profile, id) {
  return !!profile?.achievements?.[id];
}

/**
 * Apply a gameplay event to profile.
 *
 * Returns:
 *  { profile, earned: Achievement[], unlockedThemes: string[] }
 */
export function applyProgressEvent(profile, evt) {
  const p = mergeProfile(profile);

  const earned = [];
  const unlockedThemes = [];

  const type = evt?.type;
  const score = numOr(evt?.score, 0);

  // Stats
  if (type === "flap") {
    p.stats.flaps += 1;
  }

  if (type === "score") {
    // best score is per-run score
    if (score > p.stats.bestScore) p.stats.bestScore = score;
  }

  if (type === "run_end") {
    p.stats.runs += 1;
    p.stats.totalScore += Math.max(0, Math.floor(score));
    if (score > p.stats.bestScore) p.stats.bestScore = Math.floor(score);
  }

  // Achievements
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue;

    if (a.type === "score") {
      if (type !== "score" && type !== "run_end") continue;
      if (score < a.target) continue;
    } else if (a.type === "runs") {
      if (type !== "run_end") continue;
      if (p.stats.runs < a.target) continue;
    } else if (a.type === "flaps") {
      if (type !== "flap" && type !== "run_end") continue;
      if (p.stats.flaps < a.target) continue;
    }

    // Earn
    p.achievements[a.id] = { earnedAt: Date.now() };
    earned.push(a);

    // Reward
    const theme = a.reward?.theme;
    if (theme) {
      const list = getUnlockedThemes(p);
      if (!list.includes(theme)) {
        list.push(theme);
        p.unlockedThemes = list;
        unlockedThemes.push(theme);
      }
    }
  }

  // Ensure selectedTheme is valid
  const unlocked = getUnlockedThemes(p);
  if (!unlocked.includes(p.selectedTheme)) {
    p.selectedTheme = unlocked[0];
  }

  return { profile: p, earned, unlockedThemes };
}

export function getAchievementProgress(profile, achievementId) {
  const p = mergeProfile(profile);
  const a = ACHIEVEMENTS.find((x) => x.id === achievementId);
  if (!a) return { current: 0, target: 1, pct: 0, earned: false };

  const earned = !!p.achievements[a.id];
  if (earned) return { current: a.target, target: a.target, pct: 1, earned: true };

  let current = 0;
  if (a.type === "runs") current = p.stats.runs;
  if (a.type === "flaps") current = p.stats.flaps;
  if (a.type === "score") current = p.stats.bestScore;

  const pct = a.target <= 0 ? 0 : clamp01(current / a.target);
  return { current: Math.max(0, current), target: a.target, pct, earned: false };
}

/* ---------------- helpers ---------------- */

function mergeProfile(obj) {
  const out = clone(DEFAULT_PROFILE);

  out.v = 1;

  out.selectedTheme = typeof obj?.selectedTheme === "string" ? obj.selectedTheme : out.selectedTheme;

  out.unlockedThemes = Array.isArray(obj?.unlockedThemes) ? obj.unlockedThemes.slice(0, 50) : out.unlockedThemes;

  // Achievements map
  out.achievements = typeof obj?.achievements === "object" && obj?.achievements ? obj.achievements : {};

  // Stats
  const s = obj?.stats || {};
  out.stats.runs = Math.max(0, Math.floor(numOr(s.runs, out.stats.runs)));
  out.stats.flaps = Math.max(0, Math.floor(numOr(s.flaps, out.stats.flaps)));
  out.stats.bestScore = Math.max(0, Math.floor(numOr(s.bestScore, out.stats.bestScore)));
  out.stats.totalScore = Math.max(0, Math.floor(numOr(s.totalScore, out.stats.totalScore)));

  // Normalize unlocked themes list
  out.unlockedThemes = getUnlockedThemes(out);

  return out;
}

function clone(x) {
  try {
    return structuredClone(x);
  } catch {
    return JSON.parse(JSON.stringify(x));
  }
}

function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
