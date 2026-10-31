import { defineConfig, devices } from '@playwright/test';

// Exercise real production bundles: DEV=false, no local preview escape hatch.
const modes = [
  { name: 'regular', enabled: false, port: 5175 },
  { name: 'championship', enabled: true, port: 5176 },
];

export default defineConfig({
  testDir: './production',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: modes.flatMap(({ name, enabled, port }) => [
    { name: `${name}-chromium`, use: { ...devices['iPhone 13'], browserName: 'chromium', baseURL: `http://127.0.0.1:${port}` }, metadata: { championshipMode: enabled } },
    { name: `${name}-webkit`, use: { ...devices['iPhone 13'], browserName: 'webkit', baseURL: `http://127.0.0.1:${port}` }, metadata: { championshipMode: enabled } },
  ]),
  webServer: modes.map(({ name, enabled, port }) => ({
    command: `VITE_CHAMPIONSHIP_MODE=${enabled} npm run build -- --outDir node_modules/.cache/awl-e2e-${name} && npm run preview -- --outDir node_modules/.cache/awl-e2e-${name} --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  })),
});
