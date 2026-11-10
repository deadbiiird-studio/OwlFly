import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

test("GitHub Pages ships the custom domain and asset links", () => {
  assert.equal(read("web/CNAME").trim(), "owlfly.app");
  const links = JSON.parse(read("web/.well-known/assetlinks.json"));
  assert(links.some((entry) => entry.target?.package_name === "com.owlfly.game"));
  const workflow = read(".github/workflows/deploy-pages.yml");
  assert.match(workflow, /path: web/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm run test/);
  assert.match(workflow, /src\/\*\*/);
});

test("Android App Link uses published domain with no verified claim", () => {
  const manifest = read("android/app/src/main/AndroidManifest.xml");
  assert.match(manifest, /android:host="owlfly\.app"/);
  assert.doesNotMatch(manifest, /android:host="owlfly\.vercel\.app"/);
  assert.match(manifest, /requires live HTTPS assetlinks/);
});

test("Android signing credentials are not stored in Gradle", () => {
  const gradle = read("android/app/build.gradle");
  for (const name of ["OWLFLY_KEYSTORE_FILE", "OWLFLY_KEYSTORE_PASSWORD", "OWLFLY_KEY_ALIAS", "OWLFLY_KEY_PASSWORD"]) {
    assert.match(gradle, new RegExp(name));
  }
  assert.doesNotMatch(gradle, /storePassword\s+["']/);
  assert.doesNotMatch(gradle, /keyPassword\s+["']/);
  assert.doesNotMatch(gradle, /[A-Z]:\/[\w/]+\.jks/);
});

test("crash short-circuits dead owl before repeated score updates", () => {
  const boot = read("src/app/boot.js");
  assert.match(boot, /function crash\(\) \{[\s\S]*?if \(!owl\.alive\) return;[\s\S]*?owl\.kill\(\)/);
  assert.match(boot, /if \(state\.paused \|\| !owl\.alive\) return;/);
});
