import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const ROOT_DIR = process.cwd();
const WEB_DIR = path.join(ROOT_DIR, "web");
const OUT_FILE = path.join(WEB_DIR, "game.js");
const PROD_INDEX_SRC = path.join(WEB_DIR, "index.prod.html");
const PROD_INDEX_DEST = path.join(WEB_DIR, "index.html");

// Preserve module scopes instead of concatenating source files.
const result = await build({
  entryPoints: ["src/app/boot.js"],
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2020",
  write: false,
  logLevel: "info",
});

if (result.outputFiles.length !== 1) {
  throw new Error("Expected exactly one OwlFly bundle.");
}

fs.mkdirSync(WEB_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, result.outputFiles[0].contents);
console.log(`Built: ${OUT_FILE}`);

if (fs.existsSync(PROD_INDEX_SRC)) {
  fs.copyFileSync(PROD_INDEX_SRC, PROD_INDEX_DEST);
  console.log("Prod index.html installed.");
} else {
  console.warn(`No prod index found: ${PROD_INDEX_SRC}`);
}
