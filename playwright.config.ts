import { defineConfig, devices } from "@playwright/test";

// Browser flows at mobile size. Runs locally and in /check verify against the
// dev server (needs .env.local); CI adds it once it has a database branch.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    ...devices["Pixel 7"],
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
