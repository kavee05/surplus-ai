import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// Locally use the installed Chrome; CI installs Playwright's Chromium.
const channel = process.env.CI ? undefined : "chrome";

/** End-to-end tests run against a production build (`npm run build` first). No live AI: LIVE_AI is forced off. */
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { LIVE_AI: "false" },
  },
});
