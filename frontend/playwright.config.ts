import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import path from "node:path";

// The suite runs its own server against a throwaway data file, never your real board.
const PORT = 3100;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  workers: 1, // all specs share one server data file
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1920, height: 1080 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { KANBAN_DATA_FILE: path.join(tmpdir(), "kanban-e2e", "kanban.json") },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
