import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 3000;
const EXPRESS_PORT = 5000;

// A handful of e2e specs for the critical path (browse → cart → checkout →
// order), run against the real Next.js + Express stack — not broad UI
// coverage, a sustainable scope for a single maintainer (see Faz E in
// PROJECT_ANALYSIS.md).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node server.js",
      cwd: path.join(__dirname, ".."),
      url: `http://localhost:${EXPRESS_PORT}/api/categories`,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "npm run dev",
      cwd: __dirname,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
