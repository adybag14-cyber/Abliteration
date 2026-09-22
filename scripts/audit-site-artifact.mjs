import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const verifyOnly = process.argv.includes("--verify-only");
const required = [
  "index.html",
  "404.html",
  "favicon.svg",
  "og-card.svg",
  "og-card.png",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml",
  "structured-data.json",
  "theme-init.js",
  "llms.txt",
  ".well-known/security.txt",
];

assert(existsSync(dist), "dist/ does not exist; run npm run build first");
for (const relative of required) assert(existsSync(path.join(dist, relative)), `missing required Pages artifact: ${relative}`);

const html = readFileSync(path.join(dist, "index.html"), "utf8");
for (const marker of [
  'rel="canonical"',
  'rel="manifest"',
  'http-equiv="Content-Security-Policy"',
  'name="abliteration-build"',
  'type="application/ld+json"',
]) assert(html.includes(marker), `index.html is missing ${marker}`);
assert(!html.includes("%VITE_"), "index.html contains an unresolved Vite environment token");
assert(!html.includes("__ABLITERATION_BUILD_SHA__"), "index.html contains an unresolved build SHA token");
const linkedData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
assert(linkedData, "index.html has no structured-data payload");
const linkedDataHash = createHash("sha256").update(linkedData).digest("base64");
assert(html.includes(`'sha256-${linkedDataHash}'`), "structured data changed without updating its CSP hash");

const assetDirectory = path.join(dist, "assets");
const assets = readdirSync(assetDirectory).filter((name) => statSync(path.join(assetDirectory, name)).isFile());
const javascript = assets.filter((name) => name.endsWith(".js"));
const stylesheets = assets.filter((name) => name.endsWith(".css"));
assert(javascript.length > 0, "site artifact has no JavaScript bundle");
assert(stylesheets.length > 0, "site artifact has no CSS bundle");
assert.equal(assets.some((name) => name.endsWith(".map")), false, "production source maps must not be deployed");

function gzipBytes(names) {
  return names.reduce((total, name) => total + gzipSync(readFileSync(path.join(assetDirectory, name))).byteLength, 0);
}

const budgets = {
  htmlBytes: 48 * 1024,
  javascriptGzipBytes: 350 * 1024,
  cssGzipBytes: 90 * 1024,
};
const sizes = {
  htmlBytes: Buffer.byteLength(html),
  javascriptGzipBytes: gzipBytes(javascript),
  cssGzipBytes: gzipBytes(stylesheets),
};
assert(sizes.htmlBytes <= budgets.htmlBytes, `HTML budget exceeded: ${sizes.htmlBytes} > ${budgets.htmlBytes}`);
assert(sizes.javascriptGzipBytes <= budgets.javascriptGzipBytes, `JavaScript gzip budget exceeded: ${sizes.javascriptGzipBytes} > ${budgets.javascriptGzipBytes}`);
assert(sizes.cssGzipBytes <= budgets.cssGzipBytes, `CSS gzip budget exceeded: ${sizes.cssGzipBytes} > ${budgets.cssGzipBytes}`);

const hashedFiles = required.concat(assets.map((name) => `assets/${name}`));
const files = hashedFiles.map((relative) => {
  const bytes = readFileSync(path.join(dist, relative));
  return { path: relative.replaceAll("\\", "/"), bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") };
});
const manifest = {
  schemaVersion: 1,
  commit: process.env.VITE_BUILD_SHA || "local",
  generatedAt: new Date().toISOString(),
  budgets,
  sizes,
  files,
};
const manifestPath = path.join(dist, "deployment-manifest.json");
if (!verifyOnly) writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
else {
  assert(existsSync(manifestPath), "deployment-manifest.json is missing");
  const deployed = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(deployed.commit, manifest.commit, "deployment manifest commit does not match this environment");
}

console.log(`Pages artifact audit passed: JS ${sizes.javascriptGzipBytes} B gzip, CSS ${sizes.cssGzipBytes} B gzip, HTML ${sizes.htmlBytes} B`);
