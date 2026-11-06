import { dirname } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import type { PluginOptions } from '@grafana/plugin-e2e';

// `@grafana/plugin-e2e` ships a prebuilt auth setup we run as a dependency
// project so every test starts already logged in.
const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: process.env.GRAFANA_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Record a video for each test but only keep it when the test fails, so the
    // always-uploaded HTML report carries recordings for failures without
    // bloating artifacts with videos of passing runs.
    video: 'retain-on-failure',
    // plugin-e2e reads provisioned datasources from here.
    provisioningRootDir: process.env.PROVISIONING_ROOT_DIR ?? 'provisioning',
  },
  projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'run',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});
