import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,

  reporter: isCI
    ? [['github'], ['json', { outputFile: 'reports/results.json' }], ['html', { outputFolder: 'reports/html', open: 'never' }]]
    : [['html', { outputFolder: 'reports/html', open: 'never' }], ['list']],

  outputDir: 'reports/artifacts',

  use: {
    baseURL: process.env.BASE_URL || 'https://dev.3snet.info',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
    ignoreHTTPSErrors: true,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  },

  projects: [
    // Desktop browsers (P0)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1920, height: 1080 } },
    },
    // Mobile (P1)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
