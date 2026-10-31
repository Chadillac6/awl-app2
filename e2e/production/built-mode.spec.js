import { expect, test } from '@playwright/test';
import { championshipCsv } from '../fixtures/championship.js';

for (const search of ['', '?championshipPreview=1']) {
  test(`production mode, splash, data and navigation with query ${search || '(none)'}`, async ({ page }, testInfo) => {
    const enabled = testInfo.project.metadata.championshipMode;
    const errors = [];
    const championshipRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/sheets/*', async (route) => {
      const tab = new URL(route.request().url()).pathname.split('/').pop();
      if (tab === 'championship') championshipRequests.push(tab);
      const fixtures = {
        championship: championshipCsv,
        leaderboard: ',,,Week,1\nGroup A,,,Total\n,1,Chad,4,4',
        schedule: ',,2026 SCHEDULE B,,,\n,,Group A,Group B,Group C,Group D\n1,5-1,Bob O Link,Bob O Link,Hilliard,Hilliard',
        stats: 'Player,Week 1\nChad,40',
      };
      await route.fulfill({ status: 200, contentType: 'text/csv', body: fixtures[tab] ?? '' });
    });
    // A production build must never request the development-only fixture.
    let previewRequests = 0;
    await page.route('**/championship-preview.csv', (route) => {
      previewRequests += 1;
      return route.abort();
    });
    // Returning installed clients can retain Championship cache after the switch.
    // It must not activate the mode or cause Championship fetches in regular mode.
    await page.addInitScript((csv) => {
      localStorage.setItem('awl-cache:championship', csv);
      localStorage.setItem('awl-cache-time:championship', '1');
    }, championshipCsv);
    await page.goto(`/${search}`);
    if (enabled) {
      await expect(page.getByTestId('championship-splash')).toBeVisible();
      await expect(page.getByAltText('Anderson Heating and Cooling')).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'AM Walking', exact: true })).toBeVisible();
      await expect(page.getByTestId('championship-splash')).toHaveCount(0);
      await expect(page.getByAltText('Anderson Heating and Cooling')).toHaveCount(0);
    }
    const initialTab = enabled ? 'Championship' : 'Leaderboard';
    await expect(page.getByRole('button', { name: initialTab, exact: true })).toHaveAttribute('aria-current', 'page', { timeout: 10000 });
    await expect(page.getByRole('button', { name: enabled ? 'Schedule' : 'Championship', exact: true })).toHaveCount(0);
    if (enabled) {
      await expect(page.getByTestId('championship-page')).toBeVisible();
      await expect(page.getByTestId('championship-leaderboard-row').first()).toHaveAttribute('data-player', 'Sean');
      await expect(page.getByTestId('championship-leaderboard-row').last().getByText('DNF', { exact: true })).toBeVisible();
      expect(championshipRequests.length).toBeGreaterThan(0);
    }
    for (const [button, heading] of [
      ['Leaderboard', 'Leaderboard'],
      [enabled ? 'Championship' : 'Schedule', enabled ? 'Championship' : 'Schedule'],
      ['Rules', 'League Rules'], ['History', 'Hall of Fame'], ['Stats', 'Player Stats'],
    ]) {
      await page.getByRole('button', { name: button, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      if (button === 'Schedule') {
        await expect(page.locator('[data-testid="schedule-week-card"][data-week="1"]')).toBeVisible();
      }
    }
    if (!enabled) {
      await expect(page.getByTestId('championship-page')).toHaveCount(0);
      expect(championshipRequests).toEqual([]);
    }
    expect(previewRequests).toBe(0);
    expect(errors).toEqual([]);
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  });
}
