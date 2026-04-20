export const THEMES = [
  {
    id: "night",
    name: "Night Desert",
    unlock: null,
    ui: {
      accent: "#7ef3d2",
    },
    sky: {
      top: "#061327",
      mid: "#120a1c",
      bottom: "#07060f",
      topBloom: "rgba(160,230,255,0.55)",
    },
    aurora: {
      enabled: true,
      a: "rgba(80,255,210,0.25)",
      b: "rgba(170,110,255,0.18)",
    },
    stars: {
      enabled: true,
      count: 90,
    },
    ridges: {
      far: "#0a1a2c",
      mid: "#091425",
      farAlpha: 0.42,
      midAlpha: 0.55,
    },
    clouds: {
      enabled: true,
      alpha: 0.12,
      top: "rgba(255,255,255,0.25)",
      bottom: "rgba(255,255,255,0)",
    },
    mist: {
      alpha: 0.14,
      a: "rgba(255,255,255,0.08)",
      b: "rgba(255,255,255,0.06)",
    },
    ground: {
      base: "#1d0f17",
      silhouette: "#21121a",
      textureAlpha: 0.08,
      hazeTop: "rgba(255,200,90,0)",
      hazeBottom: "rgba(255,200,90,0.55)",
    },
    cactus: {
      grad: ["#052f1c", "#0e6b3e", "#2ee58b", "#06351f"],
      outline: "rgba(0,0,0,0.7)",
      outlineAlpha: 0.35,
      groove: "rgba(255,255,255,0.08)",
      capGlow: "rgba(255,255,255,0.15)",
    },
    vignette: {
      alpha: 0.26,
    },
  },

  {
    id: "sunrise",
    name: "Sunrise Canyon",
    unlock: {
      type: "score",
      target: 10,
      text: "Reach score 10",
    },
    ui: {
      accent: "#ffd27d",
    },
    sky: {
      top: "#2b0a2a",
      mid: "#ff5a6a",
      bottom: "#ffcc66",
      topBloom: "rgba(255,240,200,0.55)",
    },
    aurora: {
      enabled: false,
      a: "rgba(255,255,255,0)",
      b: "rgba(255,255,255,0)",
    },
    stars: {
      enabled: false,
      count: 0,
    },
    ridges: {
      far: "#2a0c1f",
      mid: "#190a18",
      farAlpha: 0.32,
      midAlpha: 0.50,
    },
    clouds: {
      enabled: true,
      alpha: 0.18,
      top: "rgba(255,255,255,0.35)",
      bottom: "rgba(255,255,255,0)",
    },
    mist: {
      alpha: 0.10,
      a: "rgba(255,255,255,0.10)",
      b: "rgba(255,255,255,0.07)",
    },
    ground: {
      base: "#2a0c1f",
      silhouette: "#1e0a16",
      textureAlpha: 0.06,
      hazeTop: "rgba(255,245,210,0)",
      hazeBottom: "rgba(255,245,210,0.55)",
    },
    cactus: {
      grad: ["#4a1b0d", "#c53a1a", "#ffcc66", "#5a230f"],
      outline: "rgba(20,0,0,0.75)",
      outlineAlpha: 0.28,
      groove: "rgba(255,255,255,0.10)",
      capGlow: "rgba(255,255,255,0.18)",
    },
    vignette: {
      alpha: 0.22,
    },
  },

  {
    id: "dusk",
    name: "Blue Dusk",
    unlock: {
      type: "runs",
      target: 10,
      text: "Finish 10 runs",
    },
    ui: {
      accent: "#9ad7ff",
    },
    sky: {
      top: "#08102a",
      mid: "#1a2a55",
      bottom: "#0b0e1e",
      topBloom: "rgba(120,200,255,0.45)",
    },
    aurora: {
      enabled: true,
      a: "rgba(80,160,255,0.18)",
      b: "rgba(180,120,255,0.14)",
    },
    stars: {
      enabled: true,
      count: 65,
    },
    ridges: {
      far: "#0b1a3d",
      mid: "#08122a",
      farAlpha: 0.36,
      midAlpha: 0.52,
    },
    clouds: {
      enabled: true,
      alpha: 0.13,
      top: "rgba(230,245,255,0.22)",
      bottom: "rgba(230,245,255,0)",
    },
    mist: {
      alpha: 0.12,
      a: "rgba(210,235,255,0.08)",
      b: "rgba(210,235,255,0.06)",
    },
    ground: {
      base: "#111429",
      silhouette: "#0d1022",
      textureAlpha: 0.06,
      hazeTop: "rgba(160,210,255,0)",
      hazeBottom: "rgba(160,210,255,0.30)",
    },
    cactus: {
      grad: ["#052339", "#0d4f86", "#9ad7ff", "#062a3f"],
      outline: "rgba(0,0,0,0.75)",
      outlineAlpha: 0.30,
      groove: "rgba(255,255,255,0.08)",
      capGlow: "rgba(255,255,255,0.16)",
    },
    vignette: {
      alpha: 0.24,
    },
  },

  {
    id: "haunted",
    name: "Haunted Grove",
    unlock: {
      type: "score",
      target: 25,
      text: "Reach score 25",
    },
    ui: {
      accent: "#a8ffb5",
    },
    sky: {
      top: "#03130d",
      mid: "#07261c",
      bottom: "#010807",
      topBloom: "rgba(180,255,210,0.35)",
    },
    aurora: {
      enabled: false,
      a: "rgba(255,255,255,0)",
      b: "rgba(255,255,255,0)",
    },
    stars: {
      enabled: false,
      count: 0,
    },
    ridges: {
      far: "#041a12",
      mid: "#03110c",
      farAlpha: 0.40,
      midAlpha: 0.56,
    },
    clouds: {
      enabled: true,
      alpha: 0.10,
      top: "rgba(220,255,240,0.20)",
      bottom: "rgba(220,255,240,0)",
    },
    mist: {
      alpha: 0.18,
      a: "rgba(170,255,200,0.10)",
      b: "rgba(170,255,200,0.06)",
    },
    ground: {
      base: "#02110c",
      silhouette: "#010906",
      textureAlpha: 0.06,
      hazeTop: "rgba(140,255,190,0)",
      hazeBottom: "rgba(140,255,190,0.25)",
    },
    cactus: {
      grad: ["#032014", "#0b5a3a", "#a8ffb5", "#032a19"],
      outline: "rgba(0,0,0,0.80)",
      outlineAlpha: 0.34,
      groove: "rgba(255,255,255,0.06)",
      capGlow: "rgba(255,255,255,0.12)",
    },
    vignette: {
      alpha: 0.28,
    },
  },

  {
    id: "neon",
    name: "Neon City",
    unlock: {
      type: "score",
      target: 50,
      text: "Reach score 50",
    },
    ui: {
      accent: "#ff6bff",
    },
    sky: {
      top: "#09001d",
      mid: "#1a0072",
      bottom: "#00000b",
      topBloom: "rgba(255,120,255,0.38)",
    },
    aurora: {
      enabled: true,
      a: "rgba(0,255,255,0.18)",
      b: "rgba(255,80,255,0.16)",
    },
    stars: {
      enabled: true,
      count: 80,
    },
    ridges: {
      far: "#12003b",
      mid: "#0a0023",
      farAlpha: 0.34,
      midAlpha: 0.52,
    },
    clouds: {
      enabled: true,
      alpha: 0.10,
      top: "rgba(190,220,255,0.18)",
      bottom: "rgba(190,220,255,0)",
    },
    mist: {
      alpha: 0.10,
      a: "rgba(255,255,255,0.08)",
      b: "rgba(255,255,255,0.05)",
    },
    ground: {
      base: "#060017",
      silhouette: "#03000b",
      textureAlpha: 0.06,
      hazeTop: "rgba(255,90,255,0)",
      hazeBottom: "rgba(255,90,255,0.22)",
    },
    cactus: {
      grad: ["#001a2e", "#00fff0", "#ff6bff", "#001326"],
      outline: "rgba(0,0,0,0.85)",
      outlineAlpha: 0.30,
      groove: "rgba(255,255,255,0.09)",
      capGlow: "rgba(255,255,255,0.18)",
    },
    vignette: {
      alpha: 0.30,
    },
  },
];

export function getTheme(themeId) {
  const id = String(themeId || "").trim();
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function getThemePreview(theme) {
  const t = theme || THEMES[0];
  return {
    a: t.sky?.top || "#000",
    b: t.sky?.mid || "#111",
    c: t.sky?.bottom || "#222",
    accent: t.ui?.accent || "#7ef3d2",
  };
}
