import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const captureDirectory = path.resolve("artifacts/playwright/captures");

const nightlyArchives = [
  "abliterate-cxx-windows-x64-msvc.zip",
  "abliterate-cxx-linux-x64-gcc15.tar.gz",
  "abliterate-cxx-macos-arm64-llvm.tar.gz",
] as const;

const hourZeroCommand = /guide\s*→\s*doctor\s*→\s*self-check\s*→\s*demo/;

async function openGuide(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await revealWholePage(page);
}

async function revealWholePage(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 500);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 25));
    }
    window.scrollTo(0, 0);
  });
}

async function capture(target: Page | Locator, testInfo: TestInfo, label: string, fullPage = true) {
  await mkdir(captureDirectory, { recursive: true });
  const filename = `${testInfo.project.name}-${label}.png`;
  const screenshotPath = path.join(captureDirectory, filename);
  if ("url" in target) {
    await target.screenshot({ path: screenshotPath, fullPage, animations: "disabled" });
  } else {
    await target.screenshot({
      path: screenshotPath,
      animations: "disabled",
      style: "header, .skip-link { visibility: hidden !important; }",
    });
  }
  await testInfo.attach(label, { path: screenshotPath, contentType: "image/png" });
}

async function expectNightlyArchives(scope: Page | Locator) {
  for (const file of nightlyArchives) {
    const link = scope.locator(`a[href*="releases/download/cxx-nightly/"][href$="${file}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toBeVisible();
    await expect(scope.getByRole("link", { name: new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
  }
}

async function expectLabClearsStickyHeader(page: Page) {
  const lab = page.locator("#lab");
  await expect(lab).toBeAttached();
  const metrics = await lab.evaluate((el) => {
    const className = el instanceof SVGElement ? "" : el.className.toString();
    const scrollMarginTop = Number.parseFloat(getComputedStyle(el).scrollMarginTop || "0");
    return { className, scrollMarginTop };
  });
  expect(
    metrics.className.split(/\s+/).includes("scroll-mt-36") || metrics.scrollMarginTop >= 144,
    `expected #lab to clear the sticky header (scroll-mt-36 or ≥144px), got class="${metrics.className}" scroll-margin-top=${metrics.scrollMarginTop}`,
  ).toBe(true);
}

test("renders the complete responsive guide without browser errors or horizontal overflow", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await openGuide(page);
  await expect(page).toHaveTitle("Abliteration Field Guide");
  await expect(page.getByRole("heading", { level: 1, name: /Abliteration,/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /measured direction being isolated/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /Method profile for Heretic projected/ })).toBeVisible();

  await expect(page.getByRole("link", { name: /C\+\+26.*toy[-\s]?lab|toy[-\s]?lab.*C\+\+26/ })).toHaveAttribute("href", "#lab");
  await expect(page.getByRole("link", { name: /Find my path/ })).toHaveAttribute("href", "#path");

  const firstJourneyStage = page.locator("ol").filter({ hasText: /Hour 0/ }).locator("li").first();
  await expect(firstJourneyStage).toContainText(/Hour 0/);
  await expect(firstJourneyStage).toContainText(/C\+\+26|toy[-\s]?lab/);
  await expect(page.getByText(hourZeroCommand).first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
  const clippedRadarLabels = await page.locator("#compare svg text").evaluateAll((labels) =>
    labels
      .filter((label) => {
        const bounds = label.getBoundingClientRect();
        return bounds.left < 0 || bounds.right > document.documentElement.clientWidth;
      })
      .map((label) => label.textContent),
  );
  expect(clippedRadarLabels).toEqual([]);

  const mobileNavigation = page.getByRole("navigation", { name: "Guide sections mobile" });
  const desktopNavigation = page.getByRole("navigation", { name: "Guide sections", exact: true });
  if (testInfo.project.name.startsWith("mobile")) {
    await expect(mobileNavigation).toBeVisible();
    await expect(desktopNavigation).toBeHidden();
  } else {
    await expect(desktopNavigation).toBeVisible();
    await expect(mobileNavigation).toBeHidden();
  }

  await capture(page, testInfo, "full-guide");
  expect(browserErrors).toEqual([]);
});

test("route finder, learning progress, radar, and technique atlas remain interactive", async ({ page }, testInfo) => {
  await openGuide(page);

  const lab = page.locator("#lab");
  const path = page.locator("#path");
  await expect(lab.getByRole("heading", { level: 3, name: "C++26 toy-matrix lab" })).toBeVisible();
  await expect(path.getByRole("heading", { level: 3, name: "Hour 0 · C++26 start" })).toBeVisible();
  await expectNightlyArchives(lab);
  await expect(page.locator('a[href$="abliterate-cxx-windows-x64.tar.gz"]')).toHaveCount(0);
  await expectLabClearsStickyHeader(page);
  await expect(lab.getByText(hourZeroCommand).first()).toBeVisible();

  await capture(lab, testInfo, "default-lab", false);

  await page.getByRole("button", { name: /24 GB\+/ }).click();
  await page.getByRole("button", { name: /MoE\s*Routed experts/ }).click();
  await page.getByRole("button", { name: "Create a candidate" }).click();
  await expect(path.getByRole("heading", { level: 3, name: "Router-aware MoE path" })).toBeVisible();
  await expect(path).toContainText("T08 + T31");
  await expect(lab.getByRole("heading", { level: 3, name: "C++26 toy-matrix lab" })).toBeVisible();
  await expectNightlyArchives(lab);
  await expect(page.locator('a[href$="abliterate-cxx-windows-x64.tar.gz"]')).toHaveCount(0);
  await capture(path, testInfo, "route-finder", false);

  await page.getByRole("button", { name: "Mark Set the boundary complete" }).click();
  await expect(page.getByText("1/6 complete")).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("1/6 complete")).toBeVisible();
  await revealWholePage(page);

  await page.getByRole("radio", { name: /Protected subspace/ }).click();
  await expect(page.getByRole("radio", { name: /Protected subspace/ })).toBeChecked();
  await expect(page.getByRole("img", { name: /Method profile for Protected subspace/ })).toBeVisible();

  const atlas = page.locator("#techniques");
  const atlasSearch = page.getByRole("textbox", { name: "Search techniques" });

  await atlasSearch.fill("DIM");
  await expect(atlas.getByRole("heading", { name: /Mean-difference DIM/ })).toBeVisible();
  await expect(atlas.getByRole("heading", { name: /False-refusal/ })).toHaveCount(0);
  await expect(atlas.getByText("T38", { exact: true })).toHaveCount(0);

  await atlasSearch.fill("ORBA");
  await expect(atlas.getByRole("heading", { name: /ORBA/ })).toBeVisible();
  await expect(atlas.getByText("T34", { exact: true })).toBeVisible();
  await expect(atlas.getByText(/^T\d{2}$/)).toHaveCount(1);

  await atlasSearch.fill("COSMIC");
  await expect(atlas.getByRole("heading", { name: /COSMIC/ })).toBeVisible();
  await expect(atlas.getByText("T36", { exact: true })).toBeVisible();
  await expect(atlas.getByText(/^T\d{2}$/)).toHaveCount(1);

  await atlasSearch.fill("T08");
  await expect(atlas.getByRole("heading", { name: "MoE per-expert edit" })).toBeVisible();
  await expect(atlas.getByText("T08", { exact: true })).toBeVisible();
  await expect(atlas.getByText("T31", { exact: true })).toHaveCount(0);
  await expect(atlas.getByRole("heading", { name: "Router-weighted MoE diagnostics" })).toHaveCount(0);
  await expect(atlas.getByText(/^T\d{2}$/)).toHaveCount(1);

  await atlasSearch.fill("T31");
  await expect(atlas.getByRole("heading", { name: "Router-weighted MoE diagnostics" })).toBeVisible();
  await expect(atlas.getByText("T31", { exact: true })).toBeVisible();
  await expect(atlas.getByText("T08", { exact: true })).toHaveCount(0);
  await expect(atlas.getByRole("heading", { name: "MoE per-expert edit" })).toHaveCount(0);
  await expect(atlas.getByText(/^T\d{2}$/)).toHaveCount(1);

  await atlasSearch.fill("T04");
  await expect(atlas.getByText(/^T\d{2}$/)).toHaveCount(0);
  await expect(atlas.getByText(/No card matches/).or(atlas.getByText(/Try .{0,80}T-ID shown on a card/))).toBeVisible();

  await atlasSearch.fill("router");
  await expect(atlas.getByRole("heading", { name: "Router-weighted MoE diagnostics" })).toBeVisible();
  await expect(atlas.getByText("T31", { exact: true })).toBeVisible();

  const noGpu = page.getByRole("button", { name: "I have no GPU" });
  await noGpu.click();
  await expect(noGpu).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("[data-slot='accordion-item']").filter({ has: noGpu })).toContainText(/C\+\+26|cxx-nightly|toy[-\s]?lab/);
});

test("header Lab click reveals Hour 0 nightlies below the sticky header", async ({ page }, testInfo) => {
  await openGuide(page);

  const mobileNavigation = page.getByRole("navigation", { name: "Guide sections mobile" });
  const desktopNavigation = page.getByRole("navigation", { name: "Guide sections", exact: true });
  const navigation = testInfo.project.name.startsWith("mobile") ? mobileNavigation : desktopNavigation;
  if (testInfo.project.name.startsWith("mobile")) {
    await expect(mobileNavigation).toBeVisible();
    await expect(desktopNavigation).toBeHidden();
  } else {
    await expect(desktopNavigation).toBeVisible();
    await expect(mobileNavigation).toBeHidden();
  }

  await navigation.getByRole("link", { name: "Lab", exact: true }).click();
  const labHeading = page.locator("#lab").getByRole("heading", { level: 2, name: "C++26 Hour 0 — unique nightlies" });
  await expect(labHeading).toBeVisible();
  await expect
    .poll(async () => {
      const { h2Top, headerBottom } = await labHeading.evaluate((h2) => {
        const header = document.querySelector("header");
        return {
          h2Top: h2.getBoundingClientRect().top,
          headerBottom: header?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY,
        };
      });
      return h2Top - (headerBottom - 1);
    })
    .toBeGreaterThanOrEqual(0);
});

test("evaluation gates and theme communicate state changes clearly", async ({ page }, testInfo) => {
  await openGuide(page);

  await page.getByRole("button", { name: "Stress the gates" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Hold this candidate" })).toBeVisible();
  await page.getByRole("button", { name: "Passing example" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Ready to export" })).toBeVisible();
  await expect(page.getByText("6/6 gates passing")).toBeVisible();

  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Use light theme" })).toBeVisible();

  await capture(page.locator("#gates"), testInfo, "passing-gates-dark", false);
});
