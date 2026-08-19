import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests/visual",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : 2,
  reporter: isCI
    ? [["github"], ["json", { outputFile: "test-results/visual-report.json" }]]
    : "list",
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}{-projectName}{ext}",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      timeout: 30_000,
    },
  },
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command:
      "npm run build && (test -d dist/client && npx --yes serve dist/client -l 4321 || npx --yes serve dist -l 4321)",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      PUBLIC_CONTACT_FORM_ACTION: "https://example.com/contact",
      PUBLIC_COMMENTS_ENABLED: "true",
    },
  },
});
