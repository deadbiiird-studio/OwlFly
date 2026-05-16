import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

test("release shell: production and dev HTML keep required game anchors", () => {
  for (const rel of ["web/index.html", "web/index.dev.html", "web/index.prod.html"]) {
    const html = read(rel);
    assert.match(html, /<canvas\s+id="game"/, `${rel} missing canvas#game`);
    assert.match(html, /<div\s+id="ui"/, `${rel} missing #ui root`);
    assert.match(html, /<div\s+id="menu"/, `${rel} missing #menu`);
    assert.match(html, /<div\s+id="hud"/, `${rel} missing #hud`);
    assert.match(html, /<div\s+id="gameover"/, `${rel} missing #gameover`);
    assert.match(html, /viewport-fit=cover/, `${rel} missing mobile fullscreen viewport guard`);
    assert.match(html, /\.\/style\.css/, `${rel} missing stylesheet link`);
  }

  assert.match(read("web/index.dev.html"), /type="module"\s+src="\/src\/app\/boot\.js"/, "dev shell must load source boot module");
  assert.match(read("web/index.html"), /src="\.\/game\.js"/, "production shell must load built bundle");
});

test("release shell: manifest icon references resolve", () => {
  const manifest = JSON.parse(read("web/manifest.webmanifest"));
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.start_url, "manifest missing start_url");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "manifest needs app icons");

  for (const icon of manifest.icons) {
    const rel = path.posix.join("web", icon.src.replace(/^\.\//, ""));
    assert.ok(exists(rel), `manifest icon missing: ${rel}`);
    assert.match(icon.type || "", /png/, `manifest icon type should be PNG: ${rel}`);
  }
});

test("release shell: service worker stays cache-safe until asset precache is explicit", () => {
  const sw = read("web/sw.js");
  assert.match(sw, /skipWaiting\(\)/, "service worker should activate cleanly");
  assert.match(sw, /clients\.claim\(\)/, "service worker should claim clients cleanly");
  assert.doesNotMatch(sw, /cache\.addAll|precache|CACHE_NAME/i, "do not silently precache stale asset paths");
});
