import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("GitHub Pages publishes the custom hostname with the static website", () => {
  assert.equal(read("web/CNAME").trim(), "owlfly.app");
  assert.equal(fs.existsSync(new URL("../CNAME", import.meta.url)), false);
  const workflow = read(".github/workflows/deploy-pages.yml");
  assert.match(workflow, /path:\s*web\b/);
  assert.match(workflow, /test -s web\/.well-known\/assetlinks\.json/);
});

test("Android App Links targets the published custom hostname", () => {
  const manifest = read("android/app/src/main/AndroidManifest.xml");
  assert.match(manifest, /android:scheme="https" android:host="owlfly\.app"/);
  assert.doesNotMatch(manifest, /android:host="owlfly\.vercel\.app"/);
  assert.doesNotMatch(manifest, /<!-- Verified OwlFly links/);
});

test("digital asset links declares matching package with a certificate fingerprint", () => {
  const links = JSON.parse(read("web/.well-known/assetlinks.json"));
  assert.ok(links.some(({ relation, target }) =>
    relation?.includes("delegate_permission/common.handle_all_urls") &&
    target?.namespace === "android_app" &&
    target?.package_name === "com.owlfly.game" &&
    target?.sha256_cert_fingerprints?.some((fingerprint) =>
      /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/i.test(fingerprint)
    )
  ));
});

test("Android release signing requires environment-provided credentials", () => {
  const gradle = read("android/app/build.gradle");
  for (const name of [
    "OWLFLY_RELEASE_STORE_FILE",
    "OWLFLY_RELEASE_STORE_PASSWORD",
    "OWLFLY_RELEASE_KEY_ALIAS",
    "OWLFLY_RELEASE_KEY_PASSWORD",
  ]) {
    assert.match(gradle, new RegExp(`System\\.getenv\\('${name}'\\)`));
  }
  assert.doesNotMatch(gradle, /storePassword\s+["']/);
  assert.doesNotMatch(gradle, /keyPassword\s+["']/);
  assert.doesNotMatch(gradle, /storeFile\s+file\(["']/);
  assert.match(gradle, /OwlFly release signing is not configured/);
});
