import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
          APP_SITE_ORIGIN: 'http://127.0.0.1:3000',
          ANALYTICS_SITE_ORIGIN: 'http://127.0.0.1:3000',
          ANALYTICS_DIRECTORY: '/tmp/insightginie-e2e/analytics',
          OPERATIONS_DIRECTORY: '/tmp/insightginie-e2e/operations',
          ASK_SECURITY_SECRET: '0'.repeat(64),
          ADMIN_ACCESS_KEY: 'test-only-admin-key-not-for-production-use',
        },
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
