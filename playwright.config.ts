import { defineConfig, devices } from "@playwright/test";

const localPath = process.env.GITHUB_ACTIONS ? "/Abliteration/" : "/";
const localOrigin = "http://127.0.0.1:4173";
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  outputDir: "artifacts/playwright/test-results",
  reporter: [
    ["line"],
    ["html", { outputFolder: "artifacts/playwright/report", open: "never" }],
  ],
  use: {
    baseURL: externalBaseUrl ?? `${localOrigin}${localPath}`,
    colorScheme: "light",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
        url: `${localOrigin}${localPath}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
      },
    },
  ],
});
