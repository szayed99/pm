import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const repoRoot = path.join(__dirname, "..");

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:8000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "docker compose up --build",
    cwd: repoRoot,
    url: "http://127.0.0.1:8000",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
