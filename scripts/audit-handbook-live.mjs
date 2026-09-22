import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { navigateBrowser } from "./lib/browser-navigation.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
}
const base = option(
  "--url",
  "https://adybag14-cyber.github.io/Abliteration/",
).replace(/\/?$/, "/");
const expected = option("--expected-sha", process.env.EXPECTED_BUILD_SHA || "");
const output = path.resolve(option("--out", "artifacts/handbook-audit/live"));
await mkdir(output, { recursive: true });
const report = {
  url: base,
  expected,
  ok: false,
  pages: [],
  browsers: [],
  errors: [],
};
let browser;
async function fetchFile(relative) {
  const response = await fetch(new URL(relative, base), {
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  assert.equal(response.status, 200, `${relative}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
async function navigate(page, relative) {
  const response = await navigateBrowser(page, new URL(relative, base).href);
  assert(
    [200, 304].includes(response?.status()),
    `${relative}: browser navigation failed (HTTP ${response?.status()})`,
  );
}
try {
  const deployment = JSON.parse(
    (await fetchFile("deployment-manifest.json")).toString(),
  );
  const manifest = JSON.parse(
    (await fetchFile("handbook/manifest.json")).toString(),
  );
  assert.equal(
    manifest.buildId,
    deployment.commit,
    "handbook and deployment belong to different builds",
  );
  if (expected)
    assert.equal(
      deployment.commit,
      expected,
      "Pages has not deployed the expected commit",
    );
  assert(
    manifest.chapters >= 138 && manifest.pages.length === manifest.chapters + 1,
    "incomplete chapter inventory",
  );
  const hashes = new Map(
    deployment.files.map((file) => [file.path, file.sha256]),
  );
  const pending = [...manifest.pages];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (pending.length) {
        const chapter = pending.shift();
        const file = `${chapter.route}index.html`;
        const bytes = await fetchFile(file);
        const actual = createHash("sha256").update(bytes).digest("hex");
        assert.equal(
          actual,
          hashes.get(file),
          `${file}: deployed bytes differ from the commit-bound artifact`,
        );
        const html = bytes.toString();
        assert(
          html.includes('id="handbook-data"'),
          `${file}: missing reader data`,
        );
        if (chapter.source)
          assert(
            html.includes('id="chapter-content"') &&
              html.includes(chapter.sourceHash),
            `${file}: missing complete source chapter`,
          );
        report.pages.push({
          route: chapter.route,
          sha256: actual,
          status: 200,
        });
      }
    }),
  );
  browser = await puppeteer.launch({
    headless: true,
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
      : {}),
    args: process.env.CI ? ["--no-sandbox"] : [],
  });
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage();
    try {
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
      });
      await page.emulateMediaFeatures([
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await navigate(page, "handbook/docs/theory/");
      assert.equal(
        await page.$eval(
          'meta[name="abliteration-build"]',
          (element) => element.content,
        ),
        deployment.commit,
      );
      await page
        .locator('.chapter-companion button[aria-expanded="false"]')
        .click();
      await page.waitForSelector(
        'svg[aria-label^="Illustrative vector projection"]',
      );
      assert(
        await page.$eval(
          "html",
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
        `${viewport.name}: horizontal overflow`,
      );
      await page.screenshot({
        path: path.join(output, `${viewport.name}-reader.png`),
      });
      await page.click('button[aria-label="Search the handbook"]');
      await page.waitForFunction(() =>
        document
          .querySelector(".search-footer")
          ?.textContent.includes("Full-text search"),
      );
      await page.type('[role="combobox"]', "MiniCPM5 20,447,232");
      await page.waitForFunction(() =>
        document
          .querySelector('[role="option"]')
          ?.textContent.includes("MiniCPM5"),
      );
      await page.keyboard.press("Escape");
      if (viewport.name === "mobile") {
        await page.click('button[aria-label="Open handbook navigation"]');
        await page.waitForSelector(
          '[role="dialog"] nav[aria-label="Handbook chapters"]',
        );
        await page.keyboard.press("Escape");
      }
      await navigate(page, "handbook/");
      await page.screenshot({
        path: path.join(output, `${viewport.name}-library.png`),
      });
      await page.setJavaScriptEnabled(false);
      await navigate(page, "handbook/docs/minicpm5-selective-study/");
      assert(
        await page.$eval("#chapter-content", (element) =>
          element.textContent.includes("20,447,232"),
        ),
        "source chapter requires JavaScript",
      );
      assert.deepEqual(errors, [], `${viewport.name}: browser errors`);
      report.browsers.push({
        viewport: viewport.name,
        directChapter: true,
        companion: true,
        fullTextSearch: true,
        noJavaScriptChapter: true,
        errors,
      });
    } finally {
      await page.close();
    }
  }
  report.ok = true;
} catch (error) {
  report.errors.push(error.stack || String(error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  report.pages.sort((a, b) => a.route.localeCompare(b.route));
  await writeFile(
    path.join(output, "audit.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
if (report.ok)
  console.log(
    `Handbook live audit passed: ${report.pages.length} file hashes and both responsive readers match ${expected || "the deployment manifest"}.`,
  );
else console.error(report.errors.join("\n"));
