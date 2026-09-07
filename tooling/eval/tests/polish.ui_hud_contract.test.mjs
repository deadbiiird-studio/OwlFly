import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../../../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

test("P2 UI: HUD exposes pressed-state controls and polite score feedback", async () => {
  const source = await read("src/ui/hud.js");

  assert.match(source, /aria-pressed=/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /aria-atomic="true"/);
  assert.match(source, /scorePill--pulse/);
  assert.match(source, /setAttribute\("aria-label", `Score \$\{next\}`\)/);
});

test("P2 UI: game-over view is a labelled dialog with restart focus", async () => {
  const source = await read("src/ui/gameOver.js");

  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby="gameOverTitle"/);
  assert.match(source, /restartBtn\?\.focus/);
  assert.match(source, /NEW BEST/);
});

test("P2 UI: polish layer ships in dev, production template, and current shell", async () => {
  for (const path of ["web/index.dev.html", "web/index.prod.html", "web/index.html"]) {
    const source = await read(path);
    assert.match(source, /href="\.\/polish\.css"/, `${path} must load polish.css`);
    assert.match(source, /id="game"/, `${path} must keep game canvas`);
    assert.match(source, /id="ui"/, `${path} must keep UI root`);
  }
});

test("P2 UI: focus, safe-area and reduced-motion rules are explicit", async () => {
  const source = await read("web/polish.css");

  assert.match(source, /env\(safe-area-inset-top\)/);
  assert.match(source, /button:focus-visible/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(source, /\.hudIconBtn\[aria-pressed="true"\]/);
});
