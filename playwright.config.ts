import { defineConfig } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    acceptDownloads: true,
    // Lets the tests use a preinstalled Chromium when the bundled one isn't available.
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: `PORT=${PORT} node tests/serve.mjs`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
