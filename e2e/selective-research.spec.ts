import { test, expect } from "@playwright/test";

test("selective planner, measured results, and snapshot history work", async ({ page }, testInfo) => {
  await page.goto("./");
  const lab = page.locator("[data-slot='selective-lab']");
  await lab.scrollIntoViewIfNeeded();
  await expect(lab.getByTestId("selected-tensor-count")).toHaveText("4 / 219");
  for (const element of [lab.getByRole("button", { name: "Layer 23", exact: true }), lab.getByLabel("Selective edit commands")]) {
    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  }
  await lab.screenshot({ path: testInfo.outputPath("selective-planner.png"), animations: "disabled" });
  await lab.getByRole("button", { name: "Layer 10", exact: true }).click();
  await expect(lab.getByTestId("selected-tensor-count")).toHaveText("2 / 219");
  await lab.getByLabel("Operator").selectOption("norm-preserving");
  await expect(lab.getByLabel("Selective edit commands")).toContainText("--layers 11");
  const slider = lab.getByRole("slider");
  await slider.focus(); await slider.press("ArrowRight");
  await expect(lab.getByLabel("Selective edit commands")).toContainText("--alpha 0.85");
  await lab.getByRole("tab", { name: "Understand the methods" }).click();
  await expect(lab.getByRole("heading", { name: "LoMC", exact: true })).toBeVisible();
  const study = page.locator("[data-slot='research-results']");
  await study.scrollIntoViewIfNeeded();
  await study.getByLabel("Study generation window").selectOption("96");
  await expect(study.getByRole("table")).toHaveAccessibleName(/96-token cap/);
  await study.getByLabel("Study generation window").selectOption("256");
  await expect(study.getByRole("table")).toHaveAccessibleName(/256-token cap/);
  await study.getByLabel("Refusal-marker cohort").selectOption("target_refusal");
  await expect(study.getByRole("table")).toBeVisible();
  await expect(study.getByText(/95% Wilson interval:/).first()).toBeVisible();
  await study.screenshot({ path: testInfo.outputPath("measured-study.png"), animations: "disabled" });
  const research = page.locator("#research");
  await research.getByLabel("Catalog snapshot").selectOption("2026-09-22");
  await expect(research.getByText(/14 papers match/)).toBeVisible();
  await research.getByLabel(/Search titles/).fill("2609.16204");
  await research.getByRole("button", { name: "Compare 2609.16204" }).click();
  await expect(research.getByRole("heading", { name: "Compare research scope (1/3)" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});
