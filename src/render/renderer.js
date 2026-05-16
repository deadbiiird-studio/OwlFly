import { FRACTURE, GAME, OWL } from "../core/constants.js";
import { getTheme } from "../core/themes.js";

export const VISION_OBSTACLE_SCALE = {
  cloudMinHeight: 230,
  cloudMaxHeight: 360,
  cloudHeightFactor: 1.22,
  cloudWidthFactor: 2.9,

  buildingGroundInset: 8,
  buildingMinBoxWidth: 300,
  buildingMaxBoxWidth: 560,
  buildingWidthFactor: 3.3,
  buildingMinBoxHeight: 500,
  buildingMaxBoxHeight: 760,
  buildingHeightFactor: 2.25,
  buildingHeightOffset: 150,
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });

    this._time = 0;

    this.owlFrames = [null, null, null];
    this.glideOwlFrames = [null, null, null];
    this.rewardSprite = null;
    this.obstacleSprites = {
      clouds: [],
      buildings: [],
    };
  }

  dispose() {}

  setOwlFrames(frame0, frame1, frame2) {
    this.owlFrames = [frame0 || null, frame1 || null, frame2 || null];
  }

  setGlideOwlFrames(frame0, frame1, frame2) {
    this.glideOwlFrames = [frame0 || null, frame1 || null, frame2 || null];
  }

  setRewardSprite(sprite) {
    this.rewardSprite = sprite || null;
  }

  setObstacleSprites({ clouds = [], buildings = [] } = {}) {
    this.obstacleSprites = {
      clouds: Array.isArray(clouds) ? clouds.filter(Boolean) : [],
      buildings: Array.isArray(buildings) ? buildings.filter(Boolean) : [],
    };
  }

  setObstacleFrames({ cloudFrames = [], buildingFrames = [] } = {}) {
    this.setObstacleSprites({
      clouds: cloudFrames,
      buildings: buildingFrames,
    });
  }

  render(state) {
    const {
      owl,
      spawner,
      mode,
      paused,
      settings,
      rewards = [],
      playPhase = "normal",
      fractureProgress = 0,
      glideTimer = 0,
      reentryTimer = 0,
    } = state;
    const theme = getTheme(state?.theme?.id || state?.theme);
    const ctx = this.ctx;

    if (!ctx) return;

    const reducedMotion = !!settings?.reducedMotion;
    if (!reducedMotion) {
      this._time += 1 / 60;
    }

    const t = reducedMotion ? 0 : this._time;
    const sx = this.canvas.width / GAME.BASE_WIDTH;
    const sy = this.canvas.height / GAME.BASE_HEIGHT;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.scale(sx, sy);
    ctx.imageSmoothingEnabled = true;

    drawSky(ctx, t, theme);
    drawAmbientClouds(ctx, t, theme);
    drawFarGlow(ctx, theme);
    drawGround(ctx, t, theme);

    for (const obstacle of spawner.active) {
      if (!obstacle?.active) continue;
      drawObstaclePair(ctx, obstacle, this.obstacleSprites, t, reducedMotion, theme);
    }

    if (Array.isArray(rewards) && rewards.length) {
      drawRewards(ctx, rewards, this.rewardSprite, t, reducedMotion, theme, playPhase);
    }

    const owlFrames = playPhase === "glide" ? this.glideOwlFrames : this.owlFrames;
    drawOwl(ctx, owl, owlFrames, t, reducedMotion, theme, playPhase);

    if (playPhase !== "normal") {
      drawFractureOverlay(ctx, {
        theme,
        reducedMotion,
        playPhase,
        fractureProgress,
        glideTimer,
        reentryTimer,
        t,
      });
    }

    if (paused && mode === "playing") {
      drawPauseOverlay(ctx);
    }

    ctx.restore();
  }
}

function drawObstaclePair(ctx, obstacle, sprites, t, reducedMotion, theme) {
  const visual =
    typeof obstacle.getVisualBounds === "function"
      ? obstacle.getVisualBounds()
      : obstacle.getRects();

  if (!visual?.top || !visual?.bottom) return;

  const clouds = sprites?.clouds || [];
  const buildings = sprites?.buildings || [];

  drawTopCloudHazard(ctx, obstacle, visual.top, clouds, t, reducedMotion, theme);
  drawBottomBuildingHazard(ctx, obstacle, visual.bottom, buildings, theme);
}

function drawTopCloudHazard(ctx, obstacle, bounds, frames, t, reducedMotion, theme) {
  if (!bounds) return;

  const variant = ensureVisualVariant(obstacle, frames, "cloud", 6);
  const clusterScale = variant.scale ?? 1;
  const clusterH = Math.max(
    VISION_OBSTACLE_SCALE.cloudMinHeight,
    Math.min(
      VISION_OBSTACLE_SCALE.cloudMaxHeight,
      bounds.h * VISION_OBSTACLE_SCALE.cloudHeightFactor * clusterScale
    )
  );
  const y = Math.max(0, bounds.y + bounds.h - clusterH);
  const baseW =
    bounds.w * VISION_OBSTACLE_SCALE.cloudWidthFactor * (variant.widthScale ?? 1);
  const frame = pickIndexedFrame(frames, variant.frameIndex);

  if (isImgReady(frame)) {
    drawContainImage(ctx, frame, {
      x: bounds.x - bounds.w * 0.28,
      y: y + 10,
      w: baseW,
      h: clusterH,
    });

    drawContainImage(ctx, frame, {
      x: bounds.x - bounds.w * 0.04,
      y,
      w: baseW * 0.95,
      h: clusterH * 1.02,
    });

    drawContainImage(ctx, frame, {
      x: bounds.x + bounds.w * 0.22,
      y: y + 12,
      w: baseW * 0.9,
      h: clusterH * 0.96,
    });
  } else {
    drawFallbackCloudCluster(
      ctx,
      bounds.x + bounds.w * 0.5,
      y + clusterH * 0.56,
      baseW,
      clusterH,
      theme
    );
  }

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = theme?.clouds?.top || "rgba(255,255,255,0.22)";
  ctx.fillRect(bounds.x + 8, y + clusterH - 6, Math.max(18, bounds.w - 16), 6);
  ctx.restore();
}

function drawBottomBuildingHazard(ctx, obstacle, bounds, frames, theme) {
  if (!bounds) return;

  const variant = ensureVisualVariant(obstacle, frames, "building", 13);
  const frame = pickIndexedFrame(frames, variant.frameIndex);
  const groundAnchorY = GAME.BASE_HEIGHT - VISION_OBSTACLE_SCALE.buildingGroundInset;
  const spriteH = Math.max(
    VISION_OBSTACLE_SCALE.buildingMinBoxHeight,
    Math.min(
      VISION_OBSTACLE_SCALE.buildingMaxBoxHeight,
      bounds.h * (variant.heightScale ?? 1) * VISION_OBSTACLE_SCALE.buildingHeightFactor +
        VISION_OBSTACLE_SCALE.buildingHeightOffset
    )
  );
  const spriteW = Math.max(
    VISION_OBSTACLE_SCALE.buildingMinBoxWidth,
    Math.min(
      VISION_OBSTACLE_SCALE.buildingMaxBoxWidth,
      bounds.w * (variant.widthScale ?? 1) * VISION_OBSTACLE_SCALE.buildingWidthFactor
    )
  );
  const x = bounds.x + bounds.w * 0.5 - spriteW * 0.5;
  const y = groundAnchorY - spriteH;

  if (isImgReady(frame)) {
    drawImageContainBottom(ctx, frame, { x, y, w: spriteW, h: spriteH });
  } else {
    drawFallbackBuilding(ctx, x + spriteW * 0.5, y, spriteW, spriteH, theme);
  }

  drawBuildingGroundShadow(ctx, bounds, spriteW, theme);
  drawBuildingGroundCap(ctx, bounds, spriteW, groundAnchorY, theme);
}

function drawRewards(ctx, rewards, rewardSprite, t, reducedMotion, theme, playPhase) {
  for (const reward of rewards) {
    if (!reward?.active) continue;

    const pulse = reducedMotion ? 0 : Math.sin(t * 10 + reward.x * 0.02) * 0.5 + 0.5;
    const size = Math.max(18, (reward.r || 14) * 2.4 + pulse * 6);
    const x = reward.x;
    const y = reward.y;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = playPhase === "glide" ? 1 : 0.8;

    if (isImgReady(rewardSprite)) {
      drawContainImage(ctx, rewardSprite, {
        x: -size * 0.5,
        y: -size * 0.5,
        w: size,
        h: size,
      });
    } else {
      drawFallbackReward(ctx, size, theme, pulse);
    }

    ctx.restore();
  }
}

function drawFractureOverlay(ctx, { theme, reducedMotion, playPhase, fractureProgress, glideTimer, reentryTimer, t }) {
  const accent = theme?.ui?.accent || "#7ef3d2";
  const glow = hexToRgb(accent) || { r: 126, g: 243, b: 210 };
  const splitY = GAME.BASE_HEIGHT * (FRACTURE.VISUAL_SPLIT_Y || 0.48);
  const motion = reducedMotion ? 0 : Math.sin(t * 16) * 0.5 + 0.5;
  const shear = (FRACTURE.VISUAL_SHEAR_PX || 18) * (0.35 + fractureProgress * 0.65);

  ctx.save();

  if (playPhase === "fracture") {
    ctx.globalAlpha = 0.14 + fractureProgress * 0.16;
    ctx.fillStyle = `rgba(${glow.r},${glow.g},${glow.b},0.9)`;
    ctx.fillRect(0, splitY - 3, GAME.BASE_WIDTH, 6);
  }

  ctx.globalAlpha = playPhase === "glide" ? 0.18 : 0.12;
  ctx.strokeStyle = `rgba(${glow.r},${glow.g},${glow.b},0.9)`;
  ctx.lineWidth = playPhase === "glide" ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(-12, splitY - shear * 0.15);
  for (let x = 0; x <= GAME.BASE_WIDTH + 24; x += 26) {
    const amp = playPhase === "glide" ? 10 : 16;
    const yy = splitY + Math.sin((x * 0.04) + t * 8) * amp * (0.4 + motion * 0.6);
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(GAME.BASE_WIDTH + 12, splitY + shear * 0.15);
  ctx.stroke();

  if (playPhase === "glide") {
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = `rgba(${glow.r},${glow.g},${glow.b},1)`;
    ctx.fillRect(0, 0, GAME.BASE_WIDTH, GAME.BASE_HEIGHT);
    drawModeBanner(ctx, `GLIDE ${Math.ceil(Math.max(0, glideTimer))}`, accent, 78);
  } else if (playPhase === "reentry") {
    drawModeBanner(ctx, `REENTRY ${Math.max(0, reentryTimer).toFixed(1)}s`, accent, 78);
  }

  ctx.restore();
}

function drawModeBanner(ctx, text, accent, y) {
  const w = 184;
  const h = 34;
  const x = GAME.BASE_WIDTH * 0.5 - w * 0.5;

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(7,12,24,0.62)";
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 16);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "600 16px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, GAME.BASE_WIDTH * 0.5, y + h * 0.56);
  ctx.restore();
}

function drawOwl(ctx, owl, frames, t, reducedMotion, theme, playPhase) {
  if (!owl) return;

  const frame = pickOwlFrame(frames, owl, t, reducedMotion);
  const x = owl.x;
  const y = owl.y + (OWL.RENDER_Y_OFFSET || 0);
  const rot = typeof owl.rot === "number" ? owl.rot : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  if (isImgReady(frame)) {
    const aspect = frame.naturalHeight / Math.max(1, frame.naturalWidth);
    const w = OWL.RENDER_W * (playPhase === "glide" ? 1.08 : 1);
    const h = w * aspect;

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.ellipse(0, h * 0.34, w * 0.28, h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    const accent = theme?.ui?.accent || "#7ef3d2";
    const glow = hexToRgb(accent) || { r: 126, g: 243, b: 210 };

    ctx.globalAlpha = playPhase === "glide" ? 0.22 : 0.12;
    ctx.fillStyle = `rgba(${glow.r},${glow.g},${glow.b},0.9)`;
    ctx.beginPath();
    ctx.arc(0, 0, playPhase === "glide" ? 24 : 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.drawImage(frame, -w / 2, -h / 2, w, h);
  } else {
    drawFallbackOwl(ctx, theme, playPhase);
  }

  ctx.restore();
}

function drawSky(ctx, t, theme) {
  const sky = theme?.sky || {};
  const g = ctx.createLinearGradient(0, 0, 0, GAME.BASE_HEIGHT);
  g.addColorStop(0, sky.top || "#071427");
  g.addColorStop(0.5, sky.mid || "#112342");
  g.addColorStop(1, sky.bottom || "#050a12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME.BASE_WIDTH, GAME.BASE_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.12;
  const topBloom = ctx.createRadialGradient(
    GAME.BASE_WIDTH * 0.2,
    90,
    20,
    GAME.BASE_WIDTH * 0.2,
    90,
    320
  );
  topBloom.addColorStop(0, sky.topBloom || "rgba(180,230,255,0.55)");
  topBloom.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topBloom;
  ctx.fillRect(0, 0, GAME.BASE_WIDTH, GAME.BASE_HEIGHT);
  ctx.restore();

  drawStars(ctx, t, theme);
}

function drawStars(ctx, t, theme) {
  if (!theme?.stars?.enabled) return;

  const count = Math.max(40, Math.min(140, theme?.stars?.count || 90));
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = GAME.BASE_WIDTH * hash01(i, 1);
    const y = 320 * hash01(i, 2);
    const tw = 0.35 + 0.65 * Math.sin(t * (0.9 + hash01(i, 3) * 1.2) + i);
    const a = 0.06 + 0.13 * clamp01(tw);
    const s = 1 + ((hash01(i, 4) * 2) | 0);

    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}

function drawAmbientClouds(ctx, t, theme) {
  const clouds = theme?.clouds || {};
  if (clouds.enabled === false) return;

  ctx.save();
  ctx.globalAlpha = clouds.alpha ?? 0.12;

  const drift = (t * 14) % (GAME.BASE_WIDTH + 240);

  for (let i = 0; i < 6; i++) {
    const x = GAME.BASE_WIDTH - drift + i * 160;
    const y = 120 + i * 34;
    const w = 92 + (i % 3) * 18;
    const h = 28 + (i % 2) * 6;
    drawFallbackCloudCluster(ctx, x, y, w, h, theme);
  }

  ctx.restore();
}

function drawFarGlow(ctx, theme) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  const g = ctx.createLinearGradient(0, 0, 0, GAME.BASE_HEIGHT);
  g.addColorStop(0, theme?.mist?.a || "rgba(255,255,255,0.1)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME.BASE_WIDTH, GAME.BASE_HEIGHT);
  ctx.restore();
}

function drawGround(ctx, t, theme) {
  ctx.save();

  ctx.fillStyle = theme?.ground?.base || "#1a0f19";
  ctx.fillRect(0, GAME.BASE_HEIGHT - 120, GAME.BASE_WIDTH, 120);

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = theme?.ground?.silhouette || "#261724";
  ctx.beginPath();
  ctx.moveTo(0, GAME.BASE_HEIGHT);
  for (let x = 0; x <= GAME.BASE_WIDTH; x += 16) {
    const y = GAME.BASE_HEIGHT - 110 - Math.sin((x + t * 28) * 0.018) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(GAME.BASE_WIDTH, GAME.BASE_HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.08;
  for (let x = -24; x < GAME.BASE_WIDTH + 24; x += 16) {
    ctx.fillRect(x + ((t * 140) % 16), GAME.BASE_HEIGHT - 118, 1, 118);
  }

  ctx.restore();
}

function drawPauseOverlay(ctx) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(0, 0, GAME.BASE_WIDTH, GAME.BASE_HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(GAME.BASE_WIDTH * 0.5 - 22, GAME.BASE_HEIGHT * 0.5 - 36, 14, 72);
  ctx.fillRect(GAME.BASE_WIDTH * 0.5 + 8, GAME.BASE_HEIGHT * 0.5 - 36, 14, 72);
  ctx.restore();
}

function drawImageContainBottom(ctx, img, bounds) {
  const iw = Math.max(1, img.naturalWidth || img.width || 1);
  const ih = Math.max(1, img.naturalHeight || img.height || 1);
  const scale = Math.min(bounds.w / iw, bounds.h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = bounds.x + (bounds.w - dw) * 0.5;
  const dy = bounds.y + bounds.h - dh;
  ctx.drawImage(img, dx, dy, dw, dh);
}
function drawContainImage(ctx, img, bounds) {
  const iw = Math.max(1, img.naturalWidth || img.width || 1);
  const ih = Math.max(1, img.naturalHeight || img.height || 1);
  const scale = Math.min(bounds.w / iw, bounds.h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = bounds.x + (bounds.w - dw) * 0.5;
  const dy = bounds.y + (bounds.h - dh) * 0.5;

  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawFallbackCloudCluster(ctx, x, y, w, h, theme) {
  const g = ctx.createLinearGradient(x, y - h * 0.5, x, y + h * 0.7);
  g.addColorStop(0, theme?.clouds?.top || "rgba(255,255,255,0.28)");
  g.addColorStop(1, theme?.clouds?.bottom || "rgba(255,255,255,0.02)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.34, h * 0.42, 0, 0, Math.PI * 2);
  ctx.ellipse(x - w * 0.24, y + 4, w * 0.26, h * 0.34, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.22, y + 6, w * 0.25, h * 0.32, 0, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawFallbackBuilding(ctx, cx, y, w, h, theme) {
  ctx.save();

  const baseY = y + h;
  const left = cx - w * 0.5;
  const right = cx + w * 0.5;
  const shoulderY = y + h * 0.24;

  const g = ctx.createLinearGradient(cx, y, cx, baseY);
  g.addColorStop(0, "rgba(190,220,255,0.18)");
  g.addColorStop(0.18, "rgba(88,116,156,0.92)");
  g.addColorStop(0.72, theme?.ground?.silhouette || "#261724");
  g.addColorStop(1, "rgba(18,12,24,1)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(left, baseY);
  ctx.lineTo(left, shoulderY);
  ctx.lineTo(cx - w * 0.22, shoulderY - h * 0.12);
  ctx.lineTo(cx - w * 0.12, y + h * 0.08);
  ctx.lineTo(cx + w * 0.14, y + h * 0.08);
  ctx.lineTo(cx + w * 0.24, shoulderY - h * 0.1);
  ctx.lineTo(right, shoulderY);
  ctx.lineTo(right, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const windowRows = 4;
  const windowCols = 3;
  const cellW = w * 0.12;
  const cellH = h * 0.08;
  for (let row = 0; row < windowRows; row += 1) {
    for (let col = 0; col < windowCols; col += 1) {
      const wx = cx - w * 0.22 + col * w * 0.16;
      const wy = y + h * 0.22 + row * h * 0.14;
      ctx.fillRect(wx, wy, cellW, cellH);
    }
  }

  ctx.restore();
}

function drawFallbackOwl(ctx, theme, playPhase) {
  ctx.fillStyle = theme?.ui?.accent || "#7ef3d2";
  ctx.beginPath();
  ctx.arc(0, 0, playPhase === "glide" ? 20 : 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -4, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawFallbackReward(ctx, size, theme, pulse) {
  const accent = theme?.ui?.accent || "#7ef3d2";
  const glow = hexToRgb(accent) || { r: 126, g: 243, b: 210 };

  ctx.save();
  ctx.rotate(pulse * 0.3);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = `rgba(${glow.r},${glow.g},${glow.b},0.9)`;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i + Math.PI / 4;
    const x = Math.cos(angle) * size * 0.5;
    const y = Math.sin(angle) * size * 0.5;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawBuildingGroundShadow(ctx, bounds, spriteW, theme) {
  ctx.save();
  ctx.globalAlpha = 0.16;

  const cx = bounds.x + bounds.w * 0.5;
  const cy = GAME.BASE_HEIGHT - 24;
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, spriteW * 0.72);
  g.addColorStop(0, "rgba(25,18,32,0.28)");
  g.addColorStop(0.3, "rgba(25,18,32,0.14)");
  g.addColorStop(1, "rgba(25,18,32,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, spriteW * 0.45, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBuildingGroundCap(ctx, bounds, spriteW, groundAnchorY, theme) {
  const cx = bounds.x + bounds.w * 0.5;
  const capW = Math.max(bounds.w + 26, spriteW * 0.44);
  const capH = 12;
  const left = cx - capW * 0.5;
  const right = cx + capW * 0.5;
  const y = groundAnchorY - 5;

  ctx.save();

  ctx.globalAlpha = 0.98;
  ctx.fillStyle = theme?.ground?.silhouette || "#261724";
  ctx.beginPath();
  ctx.moveTo(left - 10, GAME.BASE_HEIGHT);
  ctx.lineTo(left - 10, y + 3);
  ctx.quadraticCurveTo(cx, y - capH, right + 10, y + 3);
  ctx.lineTo(right + 10, GAME.BASE_HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = theme?.mist?.a || "rgba(220,235,255,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left + 10, y + 1);
  ctx.quadraticCurveTo(cx, y - capH * 0.7, right - 10, y + 1);
  ctx.stroke();

  ctx.restore();
}

function ensureVisualVariant(obstacle, frames, kind, preferredCount) {
  if (!obstacle || typeof obstacle !== "object") {
    return { frameIndex: 0, widthScale: 1, heightScale: 1, scale: 1 };
  }

  const key = `${kind}:${obstacle.topH || 0}:${obstacle.gap || 0}`;
  const storeKey = kind === "building" ? "_buildingVisualVariant" : "_cloudVisualVariant";
  const current = obstacle[storeKey];
  if (current && current.key === key) return current;

  const frameCount = Math.max(1, Math.min(preferredCount, Array.isArray(frames) ? frames.length : 0) || 1);
  const hash = hash01((obstacle.topH || 0) * 0.173 + (obstacle.gap || 0) * 0.113 + (kind === "building" ? 7 : 13), frameCount);

  const buildingSizeBuckets = [
    { widthScale: 0.9, heightScale: 0.86 },
    { widthScale: 0.96, heightScale: 0.94 },
    { widthScale: 1.0, heightScale: 1.0 },
    { widthScale: 1.06, heightScale: 1.08 },
    { widthScale: 1.12, heightScale: 1.16 },
  ];
  const cloudSizeBuckets = [
    { widthScale: 0.94, scale: 0.94 },
    { widthScale: 1.0, scale: 1.0 },
    { widthScale: 1.06, scale: 1.05 },
  ];

  const bucketSource = kind === "building" ? buildingSizeBuckets : cloudSizeBuckets;
  const bucketIndex = Math.min(bucketSource.length - 1, Math.floor(hash * bucketSource.length));
  const frameIndex = frameCount > 0 ? Math.min(frameCount - 1, Math.floor(hash01(hash * 97.13, frameCount + 3) * frameCount)) : 0;

  const variant = {
    key,
    frameIndex,
    ...bucketSource[bucketIndex],
  };
  obstacle[storeKey] = variant;
  return variant;
}

function pickIndexedFrame(frames, index) {
  if (!Array.isArray(frames) || !frames.length) return null;
  const safeIndex = Math.max(0, Math.min(frames.length - 1, Number.isFinite(index) ? index : 0));
  return frames[safeIndex] || frames[0] || null;
}

function pickFrame(frames, t, fps, reducedMotion) {
  if (!Array.isArray(frames) || !frames.length) return null;
  if (reducedMotion) return frames[0] || null;
  const i = Math.floor(t * fps) % frames.length;
  return frames[i] || frames[0] || null;
}

function pickOwlFrame(frames, owl, t, reducedMotion) {
  if (!Array.isArray(frames) || frames.length < 3) return null;
  if (reducedMotion) return frames[1] || frames[0] || null;

  if (typeof owl?.wingAngle === "number") {
    if (owl.wingAngle < -0.25) return frames[0];
    if (owl.wingAngle > 0.25) return frames[2];
    return frames[1];
  }

  return frames[Math.floor(t * 10) % 3] || frames[1] || frames[0] || null;
}

function isImgReady(img) {
  return !!img && !!img.complete && (img.naturalWidth || img.width) > 0;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) * 0.5));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function hash01(i, salt = 0) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function hexToRgb(hex) {
  const clean = String(hex || "").trim().replace("#", "");
  if (![3, 6].includes(clean.length)) return null;

  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return null;

  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}
