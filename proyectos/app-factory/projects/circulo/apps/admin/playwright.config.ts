import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against a real `next build` + `next start`, not the dev server, so a
 * green run means the production build actually serves working pages — the
 * same build that would ship. Requires a reachable Supabase instance; point
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY at one (`supabase
 * start` for local dev) before running `pnpm test:e2e`.
 */

// Some sandboxed dev environments ship a Chromium pinned to a fixed path
// instead of one matching whatever @playwright/test version is installed.
// Use it only if present; everywhere else (CI included) Playwright manages
// its own browser via the normal `playwright install`.
const PINNED_CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const launchOptions = existsSync(PINNED_CHROMIUM_PATH)
  ? { executablePath: PINNED_CHROMIUM_PATH }
  : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions } },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
