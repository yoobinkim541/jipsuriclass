import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  expect: {
    timeout: 120_000
  },
  use: {
    baseURL: "http://127.0.0.1:4175"
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4175",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: true,
    timeout: 120_000
  }
});
