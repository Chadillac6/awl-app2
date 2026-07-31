import { expect, test } from '@playwright/test';

const leaderboardCsv = [',,,Week,1', 'Group A,,,Total', ',1,Chad,4,4'].join('\n');
const statsCsv = [
  ',,,1,,,,',
  '18Birdies Name,Spreadsheet Name,Total Pts,Score,Hdcp,Net,Birdies,Pts (4)',
  'Chad S.,Chad,4,40,10,35,1,4',
  ',,,Total Gross,Avg Gross,Total Net,Avg Net,Avg Pts,Avg Hdcp,Birdies,Missed Week',
  ',,Chad,40,40,35,35,4,10,1,0',
].join('\n');

test('primary navigation, history accordions, and stats sorting expose state accessibly', async ({ page }) => {
  await page.route('**/api/sheets/leaderboard', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: leaderboardCsv }));
  await page.route('**/api/sheets/stats', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: statsCsv }));
  await page.goto('/');
  await page.waitForTimeout(4100);

  const leaderboardButton = page.getByRole('button', { name: 'Leaderboard' });
  await expect(leaderboardButton).toHaveAttribute('aria-current', 'page');

  await page.getByRole('button', { name: 'History' }).click();
  const historyAccordion = page.getByRole('button', { name: /2024/ }).first();
  await expect(historyAccordion).toHaveAttribute('aria-expanded', 'false');
  await historyAccordion.click();
  await expect(historyAccordion).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: /2024 full results/i })).toBeVisible();

  await page.getByRole('button', { name: 'Stats' }).click();
  const netSort = page.getByRole('button', { name: 'Sort by Avg Net' });
  await expect(netSort).toBeVisible();
  await expect(netSort.locator('..')).toHaveAttribute('aria-sort', 'ascending');
  await netSort.click();
  await expect(netSort.locator('..')).toHaveAttribute('aria-sort', 'descending');
});
