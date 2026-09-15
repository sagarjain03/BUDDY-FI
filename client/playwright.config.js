import { defineConfig, devices } from '@playwright/test';

const CLIENT_PORT = 5173;
const API_PORT = 5000;
const BASE_URL = `http://localhost:${CLIENT_PORT}`;

// The smoke test creates and deletes real users, so it must never point at a
// database anyone cares about. CI sets these; locally they fall back to a
// throwaway database on whatever MONGO_URI the developer already has.
const TEST_DB = process.env.SMOKE_DB_NAME || 'buddyfi_test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.js',
  globalTeardown: './tests/e2e/global-teardown.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: [
    {
      command: 'node app.js',
      cwd: '../server',
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        MONGO_DB_NAME: TEST_DB,
        // Otherwise a long suite trips the login limiter and fails for the
        // wrong reason. There is a dedicated test that turns this back on.
        DISABLE_RATE_LIMITS: 'true',
        // Questions are cached for a minute in production; tests should not wait.
        QUESTION_CACHE_MS: '500',
        CLIENT_ORIGIN: BASE_URL,
        PORT: String(API_PORT),
      },
    },
    {
      command: `npm run dev -- --port ${CLIENT_PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
