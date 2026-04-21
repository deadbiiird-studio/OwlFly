import { FRACTURE, GAME } from "../core/constants.js";
import { AudioBank } from "../core/audio.js";
import { MusicLoop } from "../core/music.js";
import { RNG } from "../core/rng.js";
import { loadSettings, saveSettings } from "../core/storage.js";
import {
  ACHIEVEMENTS,
  applyProgressEvent,
  getAchievementProgress,
  getUnlockedThemes,
  loadProfile,
  saveProfile,
} from "../core/progress.js";
import { THEMES, getTheme } from "../core/themes.js";
import { circleAabbIntersect } from "../engine/collision.js";
import { Input } from "../engine/input.js";
import { GameLoop } from "../engine/gameLoop.js";
import { Difficulty } from "../engine/difficulty.js";
import { Owl } from "../engine/entities/owl.js";
import { Spawner } from "../systems/spawner.js";
import { Scoring } from "../systems/scoring.js";
import { Renderer } from "../render/renderer.js";
import { MenuUI } from "../ui/menu.js";
import { HudUI } from "../ui/hud.js";
import { GameOverUI } from "../ui/gameOver.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function isLocalDev() {
  return (
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.protocol === "file:"
  );
}

function assetCandidates(path) {
  const clean = String(path || "").trim();
  if (!clean) return [];

  const withoutDot = clean.replace(/^\.\//, "");
  const withoutSlash = withoutDot.replace(/^\/+/, "");

  return unique([`/${withoutSlash}`, `./${withoutSlash}`]);
}

function audioCandidates(wavName, mp3Name) {
  return unique([
    ...assetCandidates(`assets/audio/${wavName}`),
    ...assetCandidates(`assets/audio/${mp3Name}`),
  ]);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function loadFirstImage(candidates) {
  let lastError = null;

  for (const src of unique(candidates)) {
    try {
      return await loadImage(src);
    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(`Failed to load image from candidates: ${unique(candidates).join(", ")}`)
  );
}

async function loadOptionalImage(candidates) {
  try {
    return await loadFirstImage(candidates);
  } catch {
    return null;
  }
}

async function configureServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (isLocalDev()) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    } catch (error) {
      console.warn("Failed to unregister service workers in local dev:", error);
    }

    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.warn("Failed to clear cache storage in local dev:", error);
    }

    return;
  }

  await navigator.serviceWorker.register("./sw.js");
}

function getDefaultProfile() {
  return {
    selectedTheme: "night",
    achievements: {},
    stats: {
      runs: 0,
      totalScore: 0,
      bestScore: 0,
      totalFlaps: 0,
    },
    unlocks: {
      themes: ["night"],
    },
  };
}

function getSafeProfile() {
  try {
    if (typeof loadProfile === "function") {
      const loaded = loadProfile();
      if (loaded && typeof loaded === "object") {
        const base = getDefaultProfile();
        return {
          ...base,
          ...loaded,
          stats: {
            ...base.stats,
            ...(loaded.stats || {}),
          },
          unlocks: {
            ...base.unlocks,
            ...(loaded.unlocks || {}),
          },
          achievements: {
            ...base.achievements,
            ...(loaded.achievements || {}),
          },
        };
      }
    }
  } catch (error) {
    console.warn("loadProfile() failed. Falling back to default profile.", error);
  }

  return getDefaultProfile();
}

function applyThemeToDOM(theme) {
  const th = theme || getTheme("night");
  const accent = th?.ui?.accent || "#7ef3d2";
  document.documentElement.style.setProperty("--accent", accent);

  const bodyBg = th?.sky?.bg || null;
  if (bodyBg) {
    document.body.style.background = bodyBg;
  }
}

function cloudFrameCandidates(index) {
  return unique([
    ...assetCandidates(`assets/obstacles/clouds/cloud_${index}.png`),
    ...assetCandidates(`assets/obstacles/cloud_${index}.png`),
  ]);
}

function buildingFrameCandidates(index) {
  const padded = String(index).padStart(2, "0");
  return unique([
    ...assetCandidates(`assets/obstacles/buildings/building_${index}.png`),
    ...assetCandidates(`assets/obstacles/buildings/building_${padded}.png`),
    ...assetCandidates(`assets/obstacles/building_${index}.png`),
    ...assetCandidates(`assets/obstacles/building_${padded}.png`),
  ]);
}

function glideOwlFrameCandidates(index) {
  return unique([
    ...assetCandidates(`assets/sprites/owl_glide_frame_${index}.png`),
    ...assetCandidates(`assets/sprites/owl_glide_${index}.png`),
    ...assetCandidates(`assets/sprites/glide/owl_glide_${index}.png`),
  ]);
}

function rewardSpriteCandidates() {
  return unique([
    ...assetCandidates("assets/rewards/shard.png"),
    ...assetCandidates("assets/rewards/reward.png"),
    ...assetCandidates("assets/sprites/reward_shard.png"),
  ]);
}

async function loadFrameSet(count, candidateFactory, label) {
  const frames = [];

  for (let i = 1; i <= count; i += 1) {
    const frame = await loadOptionalImage(candidateFactory(i));
    if (frame) {
      frames.push(frame);
      continue;
    }

    console.warn(`${label} sprite ${i} missing. Checked:`, candidateFactory(i));
  }

  return frames;
}

async function preloadSprites(renderer) {
  const [f0, f1, f2] = await Promise.all([
    loadFirstImage(assetCandidates("assets/sprites/owl_frame_0.png")),
    loadFirstImage(assetCandidates("assets/sprites/owl_frame_1.png")),
    loadFirstImage(assetCandidates("assets/sprites/owl_frame_2.png")),
  ]);

  renderer.setOwlFrames(f0, f1, f2);

  const [g0, g1, g2, rewardSprite] = await Promise.all([
    loadOptionalImage(glideOwlFrameCandidates(0)),
    loadOptionalImage(glideOwlFrameCandidates(1)),
    loadOptionalImage(glideOwlFrameCandidates(2)),
    loadOptionalImage(rewardSpriteCandidates()),
  ]);

  renderer.setGlideOwlFrames(g0 || f0, g1 || f1, g2 || f2);
  renderer.setRewardSprite(rewardSprite);

  const clouds = await loadFrameSet(6, cloudFrameCandidates, "Cloud");
  const buildings = await loadFrameSet(13, buildingFrameCandidates, "Building");

  renderer.setObstacleSprites({ clouds, buildings });
}

export function boot() {
  if (window.__owlfly_booted) return;
  window.__owlfly_booted = true;

  configureServiceWorker().catch((error) => {
    console.warn("Service worker setup failed:", error);
  });

  const canvas = document.getElementById("game");
  if (!canvas) {
    throw new Error("Missing canvas#game");
  }

  let uiRoot = document.getElementById("ui");
  if (!uiRoot) {
    uiRoot = document.createElement("div");
    uiRoot.id = "ui";
    document.body.appendChild(uiRoot);
  }

  const ensureUi = (id) => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      uiRoot.appendChild(el);
    }
    return el;
  };

  const menuEl = ensureUi("menu");
  const hudEl = ensureUi("hud");
  const gameOverEl = ensureUi("gameover");

  const renderer = new Renderer(canvas);

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  syncCanvasSize();
  window.addEventListener("resize", syncCanvasSize);
  window.addEventListener("orientationchange", syncCanvasSize);

  preloadSprites(renderer).catch((error) => {
    console.warn("Sprite preload failed:", error);
  });

  const input = new Input(canvas);
  const rng = new RNG();
  const difficulty = new Difficulty();
  const owl = new Owl();
  const scoring = new Scoring();
  const spawner = new Spawner(rng, difficulty);

  let settings = loadSettings();
  let profile = getSafeProfile();

  const audio = new AudioBank(
    {
      jump: audioCandidates("flap.wav", "jump.mp3"),
      score: audioCandidates("score.wav", "score.mp3"),
      hit: audioCandidates("hit.wav", "hit.mp3"),
    },
    settings.audio
  );
  audio.setMuted(settings.muted);

  const music = new MusicLoop({
    enabled: settings.musicEnabled !== false,
    volume: settings?.audio?.music ?? 0.25,
  });

  const uiMenu = new MenuUI(menuEl);
  const uiHud = new HudUI(hudEl);
  const uiOver = new GameOverUI(gameOverEl);

  const state = {
    mode: "menu",
    paused: false,
    playPhase: "normal",
    fractureTimer: 0,
    fractureProgress: 0,
    glideTimer: 0,
    reentryTimer: 0,
    invulnTimer: 0,
    passesSinceFracture: 0,
    rewardSpawnTimer: 0,
    rewards: [],
    owl,
    spawner,
    scoring,
    difficulty,
    settings,
    theme: getTheme(profile.selectedTheme),
    profile,
  };

  applyThemeToDOM(state.theme);
  music.setTheme(state.theme?.id);

  let runEarned = [];
  let runUnlockedThemes = [];
  let profileDirty = false;

  function applyMusicState() {
    const enabled =
      !settings.muted &&
      settings.musicEnabled !== false &&
      (settings?.audio?.music ?? 0) > 0;

    music.setEnabled(enabled);
    if (!enabled) return;

    const modeMult = state.mode === "playing" ? 1.0 : 0.85;
    music.setVolume(clamp01((settings?.audio?.music ?? 0.25) * modeMult));
    music.start({ themeId: state.theme?.id });
  }

  async function prime() {
    window.removeEventListener("pointerdown", prime);
    window.removeEventListener("keydown", prime);

    audio.setMix(settings.audio);
    await audio.prime();

    const ctx = audio.getContext();
    const dest = audio.getMasterGain() || ctx?.destination;
    if (ctx && dest) {
      music.attach({ ctx, destination: dest });
    }

    applyMusicState();
  }

  window.addEventListener("pointerdown", prime, { once: true });
  window.addEventListener("keydown", prime, { once: true });

  function handleProgress(evt) {
    const res = applyProgressEvent(profile, evt);
    profile = res.profile;
    state.profile = profile;
    profileDirty = true;

    if (res.earned.length || res.unlockedThemes.length) {
      for (const a of res.earned) {
        if (!runEarned.find((x) => x.id === a.id)) {
          runEarned.push(a);
        }
      }

      for (const id of res.unlockedThemes) {
        if (!runUnlockedThemes.includes(id)) {
          runUnlockedThemes.push(id);
        }
      }

      saveProfile(profile);
      profileDirty = false;

      if (state.mode === "playing") {
        for (const id of res.unlockedThemes) {
          uiHud.toast?.(`✨ Theme unlocked: ${getTheme(id).name}`);
        }
        for (const a of res.earned) {
          uiHud.toast?.(`🏆 ${a.title}`);
          break;
        }
      }
    }
  }

  function setTheme(themeId) {
    const th = getTheme(themeId);
    const unlocked = getUnlockedThemes(profile);

    if (!unlocked.includes(th.id)) {
      uiHud.toast?.(`🔒 ${th.name} locked — ${th.unlock?.text || "keep playing"}`);
      return;
    }

    profile.selectedTheme = th.id;
    state.theme = th;
    applyThemeToDOM(th);
    saveProfile(profile);

    music.setTheme(th.id);
    applyMusicState();

    if (state.mode === "menu") {
      toMenu();
    }
  }

  function resetPhaseState() {
    state.playPhase = "normal";
    state.fractureTimer = 0;
    state.fractureProgress = 0;
    state.glideTimer = 0;
    state.reentryTimer = 0;
    state.invulnTimer = 0;
    state.passesSinceFracture = 0;
    state.rewardSpawnTimer = 0;
    state.rewards.length = 0;
    owl.clearFlightProfile();
  }

  function hardResetRun() {
    difficulty.reset();
    owl.reset();
    spawner.reset();
    state.paused = false;
    resetPhaseState();
  }

  function startGame() {
    input.consumeJump();

    hardResetRun();
    scoring.reset();
    state.mode = "playing";

    runEarned = [];
    runUnlockedThemes = [];

    uiMenu.hide();
    uiOver.hide();

    uiHud.show({
      muted: settings.muted,
      reducedMotion: settings.reducedMotion,
      onToggleMute: () => toggleMute(),
      onToggleRM: () => toggleReducedMotion(),
    });
    uiHud.setScore(0);
    uiHud.toast?.("🦉 Fly clean. Break through.", 1300);

    applyMusicState();
  }

  function toMenu() {
    state.mode = "menu";
    state.paused = false;

    uiHud.hide();
    uiOver.hide();

    uiMenu.show({
      best: scoring.best,
      muted: settings.muted,
      reducedMotion: settings.reducedMotion,
      musicEnabled: settings.musicEnabled !== false,
      audio: settings.audio,
      themes: THEMES,
      selectedTheme: profile.selectedTheme,
      unlockedThemes: getUnlockedThemes(profile),
      achievements: ACHIEVEMENTS.map((a) => ({
        ...a,
        progress: getAchievementProgress(profile, a.id),
        earned: !!profile.achievements?.[a.id],
      })),
      stats: profile.stats,
      onStart: () => startGame(),
      onToggleMute: () => toggleMute(),
      onToggleRM: () => toggleReducedMotion(),
      onToggleMusic: () => toggleMusic(),
      onAudioChange: (partial) => updateAudio(partial),
      onResetAudio: () => resetAudio(),
      onSelectTheme: (id) => setTheme(id),
    });

    applyMusicState();
  }

  function gameOver() {
    state.mode = "gameover";
    uiHud.hide();

    uiOver.show({
      score: scoring.score,
      best: scoring.best,
      muted: settings.muted,
      reducedMotion: settings.reducedMotion,
      musicEnabled: settings.musicEnabled !== false,
      audio: settings.audio,
      earned: runEarned,
      unlockedThemes: runUnlockedThemes.map((id) => getTheme(id)),
      onRestart: () => startGame(),
      onMenu: () => toMenu(),
      onToggleMute: () => toggleMute(),
      onToggleRM: () => toggleReducedMotion(),
    });

    applyMusicState();
  }

  function toggleMute() {
    settings.muted = !settings.muted;
    audio.setMuted(settings.muted);
    saveSettings(settings);
    applyMusicState();

    if (state.mode === "menu") toMenu();
    if (state.mode === "gameover") gameOver();
  }

  function toggleReducedMotion() {
    settings.reducedMotion = !settings.reducedMotion;
    saveSettings(settings);

    if (state.mode === "menu") toMenu();
    if (state.mode === "gameover") gameOver();
  }

  function toggleMusic() {
    settings.musicEnabled = settings.musicEnabled === false;
    saveSettings(settings);
    applyMusicState();

    if (state.mode === "menu") toMenu();
    if (state.mode === "gameover") gameOver();
  }

  function updateAudio(partial) {
    settings.audio = { ...(settings.audio || {}), ...(partial || {}) };
    audio.setMix(settings.audio);
    music.setVolume(clamp01(settings.audio?.music ?? 0.25));
    saveSettings(settings);
    applyMusicState();
  }

  function resetAudio() {
    settings.audio = {
      master: 1.0,
      sfx: 0.9,
      music: 0.25,
      flap: 0.75,
      score: 0.35,
      hit: 0.95,
    };

    audio.setMix(settings.audio);
    music.setVolume(clamp01(settings.audio?.music ?? 0.25));
    saveSettings(settings);
    applyMusicState();

    if (state.mode === "menu") toMenu();
    if (state.mode === "gameover") gameOver();
  }

  function playSfx(key, opts = {}) {
    if (settings.muted) return;

    audio.play(key, {
      gain:
        clamp01((settings?.audio?.master ?? 1) * (settings?.audio?.sfx ?? 1)) *
        (opts.gain ?? 1),
      jitterRate: !!opts.jitterRate,
    });
  }

  function beginFracture() {
    if (state.playPhase !== "normal") return;

    state.playPhase = "fracture";
    state.fractureTimer = FRACTURE.TRANSITION_DURATION;
    state.glideTimer = FRACTURE.GLIDE_DURATION;
    state.invulnTimer = FRACTURE.TRANSITION_DURATION;
    state.fractureProgress = 0;
    state.rewardSpawnTimer = 0;
    state.rewards.length = 0;
    state.passesSinceFracture = 0;
    uiHud.toast?.("⚡ Fracture opening", 1100);
  }

  function enterGlide() {
    state.playPhase = "glide";
    state.fractureProgress = 1;
    state.rewardSpawnTimer = 0;
    state.rewards.length = 0;
    state.invulnTimer = 0;
    spawner.reset();
    owl.setFlightProfile(
      {
        gravityScale: FRACTURE.GLIDE_GRAVITY_SCALE,
        jumpScale: FRACTURE.GLIDE_JUMP_SCALE,
        maxFallScale: FRACTURE.GLIDE_MAX_FALL_SCALE,
        rotDownScale: FRACTURE.GLIDE_ROT_DOWN_SCALE,
      },
      "glide"
    );
    uiHud.toast?.("✨ Glide mode — touch down to reenter", 1500);
  }

  function beginReentry() {
    if (state.playPhase !== "glide") return;

    state.playPhase = "reentry";
    state.reentryTimer = FRACTURE.REENTRY_DURATION;
    state.invulnTimer = FRACTURE.REENTRY_INVULN;
    state.rewards.length = 0;
    state.rewardSpawnTimer = 0;
    state.fractureProgress = 0.35;
    owl.clearFlightProfile();
    spawner.reset();
    uiHud.toast?.("🌀 Reentry", 900);
  }

  function finishReentry() {
    state.playPhase = "normal";
    state.reentryTimer = 0;
    state.fractureProgress = 0;
    state.rewards.length = 0;
    state.glideTimer = 0;
  }

  function spawnReward() {
    const yMid = GAME.BASE_HEIGHT * 0.5;
    const wave = Math.sin((state.glideTimer * 2.4) + state.rewards.length * 0.65) * 110;
    const y = clamp(
      yMid + wave,
      FRACTURE.REWARD_TRACK_TOP,
      FRACTURE.REWARD_TRACK_BOTTOM
    );

    state.rewards.push({
      x: GAME.BASE_WIDTH + 38,
      y,
      r: FRACTURE.REWARD_RADIUS,
      active: true,
    });
  }

  function updateRewards(dt, circle) {
    state.rewardSpawnTimer += dt;
    while (state.rewardSpawnTimer >= FRACTURE.REWARD_INTERVAL) {
      state.rewardSpawnTimer -= FRACTURE.REWARD_INTERVAL;
      spawnReward();
    }

    for (let i = state.rewards.length - 1; i >= 0; i--) {
      const reward = state.rewards[i];
      reward.x -= FRACTURE.REWARD_SPEED * dt;

      const dx = reward.x - circle.cx;
      const dy = reward.y - circle.cy;
      const rr = (reward.r || FRACTURE.REWARD_RADIUS) + circle.r;

      if (dx * dx + dy * dy <= rr * rr) {
        state.rewards.splice(i, 1);
        scoring.onCollectReward(FRACTURE.REWARD_POINTS);
        uiHud.setScore(scoring.score);
        playSfx("score", { gain: 0.82 });
        continue;
      }

      if (reward.x < -40) {
        state.rewards.splice(i, 1);
      }
    }
  }

  function updatePhase(dt) {
    if (state.invulnTimer > 0) {
      state.invulnTimer = Math.max(0, state.invulnTimer - dt);
    }

    if (state.playPhase === "fracture") {
      state.fractureTimer = Math.max(0, state.fractureTimer - dt);
      const denom = Math.max(0.001, FRACTURE.TRANSITION_DURATION);
      state.fractureProgress = 1 - state.fractureTimer / denom;
      if (state.fractureTimer <= 0) {
        enterGlide();
      }
      return;
    }

    if (state.playPhase === "glide") {
      state.glideTimer = Math.max(0, state.glideTimer - dt);
      state.fractureProgress = 1;
      return;
    }

    if (state.playPhase === "reentry") {
      state.reentryTimer = Math.max(0, state.reentryTimer - dt);
      state.fractureProgress = state.reentryTimer / Math.max(0.001, FRACTURE.REENTRY_DURATION);
      if (state.reentryTimer <= 0) {
        finishReentry();
      }
    }
  }

  function maybeTriggerFracture() {
    return false;
  }

  function crash() {
    owl.kill();
    scoring.onCrash();
    playSfx("hit", { gain: 1.0 });

    handleProgress({ type: "run_end", score: scoring.score });

    if (profileDirty) {
      saveProfile(profile);
      profileDirty = false;
    }

    loop.setPaused(false);

    setTimeout(() => {
      if (state.mode === "playing") {
        state.mode = "gameover";
        gameOver();
      }
    }, 260);
  }

  function step(dt) {
    if (input.consumePause() && state.mode === "playing") {
      state.paused = !state.paused;
      loop.setPaused(state.paused);
    }

    if (state.mode !== "playing") {
      if (state.mode === "menu") {
        input.consumeJump();
        return;
      }
      if (state.mode === "gameover" && input.consumeJump()) {
        startGame();
      }
      return;
    }

    if (state.paused) return;

    if (input.consumeJump()) {
      owl.flap();
      playSfx("jump", { gain: 1.0, jitterRate: true });
      handleProgress({ type: "flap" });
    }

    difficulty.update(dt);
    owl.update(dt);
    updatePhase(dt);

    const c = owl.getCircle();

    if (state.playPhase === "glide") {
      updateRewards(dt, c);

      if (c.cy - c.r < 0) {
        owl.y = c.r + 2;
        owl.vy = Math.max(0, owl.vy * 0.25);
      } else if (c.cy + c.r > GAME.BASE_HEIGHT) {
        owl.y = GAME.BASE_HEIGHT - c.r - 2;
        owl.vy = 0;
        beginReentry();
      }
      return;
    }

    spawner.update(dt);

    if (c.cy - c.r < 0) {
      if (state.playPhase === "normal") {
        owl.y = c.r + 2;
        owl.vy = Math.max(0, owl.vy * 0.25);
        beginFracture();
        return;
      }

      if (state.invulnTimer <= 0) {
        crash();
        return;
      }

      owl.y = c.r + 4;
      owl.vy = Math.max(0, owl.vy * 0.35);
    } else if (c.cy + c.r > GAME.BASE_HEIGHT) {
      if (state.invulnTimer <= 0) {
        crash();
        return;
      }

      owl.y = GAME.BASE_HEIGHT - c.r - 4;
      owl.vy = Math.min(0, owl.vy * 0.35);
    }

    for (const o of spawner.active) {
      if (!o.active) continue;

      const { top, bottom } = o.getRects();

      if (state.invulnTimer <= 0) {
        if (
          circleAabbIntersect(c.cx, c.cy, c.r, top) ||
          circleAabbIntersect(c.cx, c.cy, c.r, bottom)
        ) {
          crash();
          return;
        }
      }

      if (!o.passed && o.x + top.w < c.cx - c.r) {
        o.passed = true;
        scoring.onPassObstacle();
        uiHud.setScore(scoring.score);
        playSfx("score", { gain: 1.0 });
        handleProgress({ type: "score", score: scoring.score });
      }
    }
  }

  function render() {
    renderer.render(state);
  }

  const loop = new GameLoop(step, render);
  loop.start();
  toMenu();
}

boot();
