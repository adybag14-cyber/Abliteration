import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import puppeteer from "puppeteer";

const defaultUrl = "https://adybag14-cyber.github.io/Abliteration/";
const defaultOutput = path.resolve("artifacts/puppeteer-live");

function readArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const targetUrl = new URL(readArgument("--url", defaultUrl)).href;
const outputDirectory = path.resolve(readArgument("--out", defaultOutput));
const headed = process.argv.includes("--headed");

const viewports = [
  { name: "desktop", width: 1440, height: 1000, isMobile: false, hasTouch: false },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
];

async function clickButton(page, accessibleText) {
  const clicked = await page.$$eval("button", (buttons, expected) => {
    const normalize = (value) => value.replace(/\s+/g, " ").trim();
    const button = buttons.find((candidate) => normalize(candidate.innerText ?? "") === expected);
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return true;
  }, accessibleText);
  assert.equal(clicked, true, `button not found: ${accessibleText}`);
}

async function revealWholePage(page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 500);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await delay(700);
}

async function screenshotElement(page, selector, screenshotPath) {
  const element = await page.$(selector);
  assert(element, `screenshot target not found: ${selector}`);
  await element.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await delay(700);
  const style = await page.addStyleTag({ content: "header, .skip-link { display: none !important; }" });
  try {
    await element.screenshot({ path: screenshotPath, type: "png" });
  } finally {
    await style.evaluate((node) => node.remove());
  }
}

async function auditViewport(browser, viewport) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const startedAt = new Date().toISOString();
  const screenshots = {};

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? "unknown"}`);
  });

  try {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
    });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    const response = await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 45_000 });
    assert(response, "navigation did not return a response");
    assert(response.status() >= 200 && response.status() < 400, `live page returned HTTP ${response.status()}`);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle2", timeout: 45_000 });
    await revealWholePage(page);

    const initial = await page.evaluate(() => {
      const visible = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      };
      return {
        title: document.title,
        heading: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim(),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        heroDiagram: Boolean(document.querySelector('[role="img"][aria-label*="measured direction"]')),
        radarTitle: document.querySelector('svg[role="img"] title')?.textContent,
        clippedRadarLabels: [...document.querySelectorAll("#compare svg text")]
          .filter((label) => {
            const bounds = label.getBoundingClientRect();
            return bounds.left < 0 || bounds.right > document.documentElement.clientWidth;
          })
          .map((label) => label.textContent),
        mobileNavigationVisible: visible('nav[aria-label="Guide sections mobile"]'),
        desktopNavigationVisible: visible('nav[aria-label="Guide sections"]'),
      };
    });

    assert.equal(initial.title, "Abliteration Field Guide");
    assert.match(initial.heading ?? "", /Abliteration,/);
    assert.equal(initial.horizontalOverflow, false, `${viewport.name} has horizontal overflow`);
    assert.equal(initial.heroDiagram, true);
    assert.match(initial.radarTitle ?? "", /Heretic projected/);
    assert.deepEqual(initial.clippedRadarLabels, [], `${viewport.name} radar labels are clipped`);
    assert.equal(initial.mobileNavigationVisible, viewport.isMobile);
    assert.equal(initial.desktopNavigationVisible, !viewport.isMobile);

    screenshots.full = path.join(outputDirectory, `${viewport.name}-full.png`);
    await page.screenshot({ path: screenshots.full, type: "png", fullPage: true });

    await clickButton(page, "24 GB+ Larger / MoE");
    await clickButton(page, "MoE Routed experts");
    await clickButton(page, "Create a candidate");
    await page.waitForFunction(
      () => [...document.querySelectorAll("h3")].some((heading) => heading.textContent?.includes("Router-aware MoE path")),
      { timeout: 8_000 },
    );
    screenshots.route = path.join(outputDirectory, `${viewport.name}-route.png`);
    await screenshotElement(page, "#path", screenshots.route);

    await clickButton(page, "Protected subspace High-control research");
    const radarSelected = await page.$eval('button[role="radio"][aria-checked="true"]', (button) => button.textContent);
    assert.match(radarSelected ?? "", /Protected subspace/);
    await page.waitForFunction(
      () => document.querySelector('svg[role="img"] title')?.textContent?.includes("Protected subspace"),
      { timeout: 8_000 },
    );
    screenshots.radar = path.join(outputDirectory, `${viewport.name}-radar.png`);
    await screenshotElement(page, "#compare", screenshots.radar);

    const search = await page.$('input[placeholder^="Search T-ID"]');
    assert(search, "technique search input is missing");
    await search.type("T31");
    await page.waitForFunction(
      () => document.body.textContent?.includes("Router-weighted MoE") && !document.body.textContent?.includes("Reversible hook ablation"),
      { timeout: 8_000 },
    );

    await clickButton(page, "Stress the gates");
    await page.waitForFunction(
      () => [...document.querySelectorAll("h3")].some((heading) => heading.textContent === "Hold this candidate"),
      { timeout: 8_000 },
    );
    await clickButton(page, "Passing example");
    await page.waitForFunction(
      () => [...document.querySelectorAll("h3")].some((heading) => heading.textContent === "Ready to export"),
      { timeout: 8_000 },
    );
    await page.click('button[aria-label="Use dark theme"]');
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"), { timeout: 8_000 });
    screenshots.gatesDark = path.join(outputDirectory, `${viewport.name}-gates-dark.png`);
    await screenshotElement(page, "#gates", screenshots.gatesDark);

    await page.click('button[aria-label="Mark Set the boundary complete"]');
    await page.waitForFunction(() => document.body.textContent?.includes("1/6 complete"), { timeout: 8_000 });
    await page.reload({ waitUntil: "networkidle2", timeout: 45_000 });
    await page.waitForFunction(() => document.body.textContent?.includes("1/6 complete"), { timeout: 8_000 });

    assert.deepEqual(consoleErrors, [], `${viewport.name} console errors`);
    assert.deepEqual(pageErrors, [], `${viewport.name} page errors`);
    assert.deepEqual(requestFailures, [], `${viewport.name} request failures`);

    return {
      viewport,
      startedAt,
      completedAt: new Date().toISOString(),
      initial,
      interactions: {
        route: "Router-aware MoE path",
        radar: "Protected subspace",
        technique: "T31 Router-weighted MoE",
        gates: "Ready to export",
        theme: "dark",
        persistedProgress: "1/6 complete",
      },
      screenshots,
      consoleErrors,
      pageErrors,
      requestFailures,
      ok: true,
    };
  } finally {
    await page.close();
  }
}

await mkdir(outputDirectory, { recursive: true });
const executablePath = await puppeteer.executablePath();
const browser = await puppeteer.launch({
  headless: !headed,
  args: ["--disable-dev-shm-usage"],
});
const browserProcessId = browser.process()?.pid ?? null;
let audit;

try {
  const browserVersion = await browser.version();
  const results = [];
  for (const viewport of viewports) results.push(await auditViewport(browser, viewport));
  audit = {
    schemaVersion: 1,
    targetUrl,
    browserVersion,
    executablePath,
    browserProcessId,
    generatedAt: new Date().toISOString(),
    results,
    ok: results.every((result) => result.ok),
  };
  await writeFile(path.join(outputDirectory, "audit.json"), `${JSON.stringify(audit, null, 2)}\n`, "utf8");
} finally {
  await browser.close();
}

await delay(250);
console.log(`Puppeteer live audit passed: ${targetUrl}`);
console.log(`Chrome PID ${browserProcessId ?? "unknown"} closed=${!browser.connected}`);
console.log(`Evidence: ${outputDirectory}`);
