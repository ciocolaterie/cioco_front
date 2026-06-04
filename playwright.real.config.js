// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.real.spec.js',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-real',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'NODE_ENV=test PORT=5101 CLIENT_URL=http://localhost:5174 npm run start',
      cwd: '../server',
      url: 'http://localhost:5101/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'VITE_API_URL=http://localhost:5101/api npm run dev -- --host localhost --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
