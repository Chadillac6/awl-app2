import { expect, test } from '@playwright/test';

import { championshipCsv } from './fixtures/championship.js';

test.beforeEach(async ({ page }) => {
  await page.route('**/championship-preview.csv', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: championshipCsv }));
});

test('preview mode shows championship splash, page, sponsor, and unique tab', async ({ page }) => {
  await page.goto('/?championshipPreview=1');
  await expect(page.getByTestId('championship-splash')).toBeVisible();
  await expect(page.getByAltText('Anderson Heating and Cooling')).toBeVisible();

  await page.waitForTimeout(4100);
  await expect(page.getByRole('heading', { name: 'Championship', exact: true })).toBeVisible();
  await expect(page.getByTestId('championship-page')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Championship' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'Schedule' })).toHaveCount(0);
  await expect(page.getByText('Shawnee Hills', { exact: true })).toBeVisible();
  await expect(page.getByText('Pleasant Valley Country Club', { exact: true })).toBeVisible();
  await expect(page.getByText('AWL Awards Ceremony', { exact: true })).toBeVisible();
  await expect(page.getByText('Groups A & B: Bring appetizers · Groups C & D: Bring desserts', { exact: true })).toBeVisible();
  const pleasantValleyEvent = page.getByTestId('championship-event-final-round');
  await expect(pleasantValleyEvent.getByText('6:00 AM', { exact: true })).toBeVisible();
  await expect(page.getByText('Everyone arrive around 6:00 AM', { exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Saturday handicap' }).first()).toBeVisible();
  await expect(page.getByTestId('championship-group-1').getByText('14', { exact: true })).toBeVisible();
  await expect(page.getByText('6:20 AM', { exact: true })).toHaveCount(0);

  const sectionLabels = await page.locator('[data-testid="championship-page"] > h2').allTextContents();
  expect(sectionLabels).toEqual([
    'Championship Weekend',
    'Live Championship Leaderboard',
    'Championship Groupings',
    'Championship Rules',
    'What’s at Stake',
  ]);
});

test('leaderboard sorts scored golfers by lowest total net and DNF at the bottom', async ({ page }) => {
  await page.goto('/?championshipPreview=1');
  await page.waitForTimeout(4100);

  const rows = page.getByTestId('championship-leaderboard-row');
  await expect(rows.first()).toHaveAttribute('data-player', 'Sean');
  await expect(rows.nth(1)).toHaveAttribute('data-player', 'Chuck');
  await expect(page.getByText('Total Net Scores', { exact: true })).toBeVisible();
  await expect(rows.nth(3)).toHaveAttribute('data-player', 'Ian');
  await expect(rows.nth(3).getByText('DNP', { exact: true })).toBeVisible();
  await expect(rows.nth(3).getByText('DNF', { exact: true })).toBeVisible();
  await expect(page.getByTestId('championship-leaderboard-row')).toHaveCount(4);
});

test('standard app remains unchanged when preview mode is off', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(4100);
  await expect(page.getByRole('button', { name: 'Schedule' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Championship' })).toHaveCount(0);
  await expect(page.getByTestId('championship-page')).toHaveCount(0);
});

test('all unaffected destinations remain usable in championship mode', async ({ page }) => {
  await page.goto('/?championshipPreview=1');
  await page.waitForTimeout(4100);

  for (const [button, heading] of [
    ['Leaderboard', 'Leaderboard'],
    ['Rules', 'League Rules'],
    ['History', 'Hall of Fame'],
    ['Stats', 'Player Stats'],
    ['Championship', 'Championship'],
  ]) {
    await page.getByRole('button', { name: button }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }

  await expect(page.getByRole('button', { name: 'Schedule' })).toHaveCount(0);
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});
