const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  webServer: {
    command: 'npx http-server dist -p 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // Give it time to start
  },

  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add Firefox/Safari later to try compatibility on different browswers
  ],
});
