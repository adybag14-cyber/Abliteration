import { test, expect, chromium } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Match the production workflow: each standalone audit owns a browser and runs
// after the preceding one has closed it.
test.describe.configure({ mode: "serial" });

test("the production Puppeteer audit accepts the built guide before deployment", async ({
  baseURL,
}, testInfo) => {
  // The script itself covers both viewports, so execute it once per suite.
  test.setTimeout(120_000);
  const output = testInfo.outputPath("puppeteer-predeploy");
  const expectedSha =
    process.env.EXPECTED_BUILD_SHA ??
    (process.env.PLAYWRIGHT_BASE_URL
      ? ""
      : process.env.VITE_BUILD_SHA || "local");
  const args = [
    "scripts/puppeteer-live-audit.mjs",
    "--url",
    baseURL!,
    "--out",
    output,
  ];
  if (expectedSha) args.push("--expected-sha", expectedSha);
  const result = await promisify(execFile)(process.execPath, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PUPPETEER_EXECUTABLE_PATH: chromium.executablePath(),
    },
    windowsHide: true,
    timeout: 110_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  expect(result.stdout).toContain("Puppeteer live audit passed");
  const audit = JSON.parse(
    await readFile(path.join(output, "audit.json"), "utf8"),
  );
  expect(audit.ok).toBe(true);
  expect(audit.results).toHaveLength(2);
});

test("the production handbook audit verifies every built chapter before deployment", async ({
  baseURL,
}, testInfo) => {
  test.setTimeout(180_000);
  const output = testInfo.outputPath("handbook-predeploy");
  const args = [
    "scripts/audit-handbook-live.mjs",
    "--url",
    baseURL!,
    "--out",
    output,
  ];
  const expected =
    process.env.EXPECTED_BUILD_SHA ??
    (process.env.PLAYWRIGHT_BASE_URL
      ? ""
      : process.env.VITE_BUILD_SHA || "local");
  if (expected) args.push("--expected-sha", expected);
  const result = await promisify(execFile)(process.execPath, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PUPPETEER_EXECUTABLE_PATH: chromium.executablePath(),
    },
    windowsHide: true,
    timeout: 170_000,
    maxBuffer: 2 * 1024 * 1024,
  });
  expect(result.stdout).toContain("Handbook live audit passed");
  const audit = JSON.parse(
    await readFile(path.join(output, "audit.json"), "utf8"),
  );
  expect(audit.ok).toBe(true);
  expect(audit.browsers).toHaveLength(2);
});
