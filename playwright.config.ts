import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], browserName: 'chromium', viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'], browserName: 'chromium', viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: 'bun run build && bun run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
