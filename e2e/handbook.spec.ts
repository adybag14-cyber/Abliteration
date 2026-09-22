import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const paths = {
  theory: "handbook/docs/theory/",
  selective: "handbook/docs/selective-methods-2026/",
  study: "handbook/docs/minicpm5-selective-study/",
  tooling: "handbook/docs/tools/abliteration-tooling/",
};
async function openReader(page: Page, route: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto(route, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  return errors;
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    })),
  ).toEqual(expect.objectContaining({ width: expect.any(Number) }));
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  // Long code and tables may scroll inside their own containers, but content
  // cards and controls must fit without a root overflow-hiding workaround.
  const outside = await page
    .locator(
      ".chapter-companion button, .chapter-toolbar button, .chapter-card, .chapter-prose h2",
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            (rect.left < -1 ||
              rect.right > document.documentElement.clientWidth + 1)
          );
        })
        .map((element) => element.textContent),
    );
  expect(outside).toEqual([]);
}

test("every published chapter has a direct static route with its complete content", async ({
  request,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "Static route coverage is viewport independent",
  );
  test.setTimeout(180_000);
  const response = await request.get("handbook/manifest.json");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.chapters).toBeGreaterThanOrEqual(138);
  const failures: string[] = [];
  const remaining = [...manifest.pages];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (remaining.length) {
        const chapter = remaining.shift();
        const page = await request.get(chapter.route);
        const html = await page.text();
        if (
          page.status() !== 200 ||
          !html.includes('id="handbook-data"') ||
          (chapter.source &&
            (!html.includes('id="chapter-content"') ||
              !html.includes(chapter.sourceHash)))
        )
          failures.push(`${page.status()} ${chapter.route}`);
      }
    }),
  );
  expect(failures).toEqual([]);
});

test("source chapters and library navigation work without JavaScript", async ({
  browser,
  baseURL,
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
    viewport: testInfo.project.use.viewport,
  });
  try {
    const page = await context.newPage();
    await page.goto(paths.study);
    await expect(page.locator("#chapter-content")).toContainText("20,447,232");
    await expect(page.locator("#chapter-content pre").first()).toBeVisible();
    await page.goto("handbook/");
    await page.locator(".library-text-index > summary").click();
    const link = page.locator(
      `.library-text-index a[href$="/${paths.theory}"]`,
    );
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.locator("#chapter-content h2").first()).toBeVisible();
    await noOverflow(page);
  } finally {
    await context.close();
  }
});

test("library filtering, keyboard full-text search, and direct refresh work", async ({
  page,
}, testInfo) => {
  const errors = await openReader(page, "handbook/");
  await page.screenshot({
    path: testInfo.outputPath("library.png"),
    fullPage: false,
  });
  await page
    .getByRole("textbox", { name: "Filter the chapter library" })
    .fill("MiniCPM5");
  await expect(page.locator(".chapter-card-grid")).toContainText("MiniCPM5");
  await expect(page.locator(".library-result-count")).not.toHaveText(
    "0 chapters match",
  );
  await noOverflow(page);
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Search the handbook" });
  await expect(search).toBeVisible();
  await expect(search.locator(".search-footer")).toContainText(
    "Full-text search",
  );
  await search.getByRole("combobox").fill("MiniCPM5 20,447,232");
  await expect(search.getByRole("option").first()).toContainText("MiniCPM5");
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/handbook\/docs\/minicpm5-selective-study\//);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("h1")).toContainText("MiniCPM5");
  expect(errors).toEqual([]);
});

test("reader controls persist, code copies exactly, and mobile navigation is accessible", async ({
  page,
  context,
}, testInfo) => {
  const errors = await openReader(page, paths.theory);
  await page.getByRole("button", { name: "Save chapter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Wrap code", exact: true }).click();
  await page.getByLabel("Reading density").selectOption("large");
  await expect(page.locator("main")).toHaveAttribute("data-text-size", "large");
  await page.reload({ waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Wrap code", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  if (testInfo.project.name.startsWith("mobile")) {
    await page
      .getByRole("button", { name: "Open handbook navigation" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Research handbook" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("navigation", { name: "Handbook chapters" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("mobile-navigation.png"),
    });
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  } else {
    const checkpoint = page
      .locator(".chapter-toc .reading-checkpoints button")
      .first();
    await checkpoint.click();
    await expect(checkpoint).toHaveAttribute("aria-pressed", "true");
    await page.reload({ waitUntil: "networkidle" });
    await expect(checkpoint).toHaveAttribute("aria-pressed", "true");
  }
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const code = page.locator(".chapter-code").first();
  const expectedCode = await code.locator("code").textContent();
  await code.getByRole("button", { name: /^Copy/ }).click();
  await expect(page.locator(".reader-status")).toHaveText(
    "Code example copied.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    expectedCode,
  );
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("reader-dark.png") });
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test("interactive geometry and lazy researcher tools fit the reading layout", async ({
  page,
}, testInfo) => {
  const errors = await openReader(page, paths.theory);
  await page.screenshot({ path: testInfo.outputPath("reader-light.png") });
  await page.getByRole("button", { name: "Open companion" }).click();
  await expect(
    page.getByRole("img", { name: /Illustrative vector projection/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove component", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: /Illustrative vector projection/ }),
  ).toHaveAttribute("aria-label", /to -?0.00/);
  await page.getByRole("slider", { name: "Direction angle" }).focus();
  await page.keyboard.press("ArrowRight");
  await noOverflow(page);
  await page
    .locator(".chapter-companion")
    .screenshot({
      path: testInfo.outputPath("geometry.png"),
      style: "header,.skip-link{visibility:hidden!important}",
    });
  for (const route of [paths.selective, paths.study]) {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open companion" }).click();
    await expect(page.locator(".companion-content h3").first()).toBeVisible();
    await noOverflow(page);
  }
  expect(errors).toEqual([]);
});

test("chapter typography, diagrams, and dialogs pass accessibility checks", async ({
  page,
}, testInfo) => {
  const errors = await openReader(page, paths.tooling);
  const diagrams = page.locator(".chapter-diagram .diagram-light");
  await expect(diagrams).toHaveCount(2);
  const originalFigure = await page
    .locator(".chapter-diagram")
    .first()
    .elementHandle();
  for (const diagram of await diagrams.all()) {
    await diagram.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        diagram.evaluate(
          (image) =>
            (image as HTMLImageElement).complete &&
            (image as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  expect(await originalFigure!.evaluate((element) => element.isConnected)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Wrap code", exact: true }).click();
  expect(await originalFigure!.evaluate((element) => element.isConnected)).toBe(
    true,
  );
  await page
    .locator(".chapter-diagram")
    .first()
    .screenshot({
      path: testInfo.outputPath("source-diagram.png"),
      style: "header,.skip-link{visibility:hidden!important}",
    });
  const axe = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
  await page.evaluate(axe);
  const checkAccessibility = () =>
    page.evaluate(async () => {
      const result = await (window as any).axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      });
      return result.violations.map((item: any) => ({
        id: item.id,
        nodes: item.nodes.map((node: any) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      }));
    });
  expect(await checkAccessibility()).toEqual([]);
  await page.locator("button[data-expand-diagram]").first().click();
  const viewer = page.getByRole("dialog", { name: "Source workflow diagram" });
  await expect(viewer).toBeVisible();
  await viewer.getByRole("button", { name: "Zoom diagram in" }).click();
  await expect(viewer.getByLabel("Diagram zoom")).toHaveText("120%");
  expect(await checkAccessibility()).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("diagram-viewer.png") });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  expect(await checkAccessibility()).toEqual([]);
  await page
    .getByRole("button", { name: "Search the handbook", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Search the handbook" }),
  ).toBeVisible();
  expect(await checkAccessibility()).toEqual([]);
  await page.keyboard.press("Escape");
  await noOverflow(page);
  expect(errors).toEqual([]);
});
