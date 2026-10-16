import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  outputDir: "../../../.next/customizer-test-results",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3200",
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile-375",
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      cwd: process.cwd(),
      command: "node src/lib/customizer/e2e/backend.mjs",
      url: "http://127.0.0.1:4329",
      reuseExistingServer: false,
    },
    {
      cwd: process.cwd(),
      command: "npm run dev -- --port 3200",
      url: "http://localhost:3200/builder",
      timeout: 120000,
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:4329",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-test-placeholder-anon-key-only",
      },
    },
  ],
});
