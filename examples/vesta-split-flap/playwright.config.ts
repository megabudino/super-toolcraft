import { defineConfig, devices } from "@playwright/test";

import { findAvailablePort, readPreferredPort } from "./scripts/creative-apps-kit-port.mjs";

const preferredTestPort = readPreferredPort([
  "CREATIVE_APPS_KIT_TEST_PORT",
  "CREATIVE_APPS_KIT_PORT",
  "PORT",
]);
const testPort = await findAvailablePort(preferredTestPort);
const testBaseUrl = `http://localhost:${testPort}`;

if (testPort !== preferredTestPort) {
  console.log(`[creative-apps-kit] Browser test port ${preferredTestPort} is busy; using ${testPort} instead.`);
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: testBaseUrl,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec vite dev --port ${testPort}`,
    reuseExistingServer: false,
    timeout: 60_000,
    url: testBaseUrl,
  },
});
