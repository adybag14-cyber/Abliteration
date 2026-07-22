import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const captureDirectory = path.resolve("artifacts/playwright/captures");

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

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

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

  await page.getByRole("button", { name: /24 GB\+/ }).click();
  await page.getByRole("button", { name: "MoE Routed experts" }).click();
  await page.getByRole("button", { name: "Create a candidate" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Router-aware MoE path" })).toBeVisible();
  await capture(page.locator("#path"), testInfo, "route-finder", false);

  await page.getByRole("button", { name: "Mark Set the boundary complete" }).click();
  await expect(page.getByText("1/6 complete")).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("1/6 complete")).toBeVisible();
  await revealWholePage(page);

  await page.getByRole("radio", { name: /Protected subspace/ }).click();
  await expect(page.getByRole("radio", { name: /Protected subspace/ })).toBeChecked();
  await expect(page.getByRole("img", { name: /Method profile for Protected subspace/ })).toBeVisible();

  await page.getByRole("textbox", { name: "Search techniques" }).fill("T31");
  await expect(page.getByText("Router-weighted MoE", { exact: true })).toBeVisible();
  await expect(page.getByText("Reversible hook ablation", { exact: true })).toBeHidden();

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
