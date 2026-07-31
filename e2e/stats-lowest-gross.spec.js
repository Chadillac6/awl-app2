import { test, expect } from '@playwright/test';

const statsCsv = [
  ['', '', '', '1', '', '', '', '', '2', '', '', '', ''],
  ['18Birdies Name', 'Spreadsheet Name', 'Total Pts', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts (4)'],
  ['Joe F.', 'Joey', '4', '40', '8', '32', '0', '2', '39', '8', '31', '0', '2'],
  ['Josh H.', 'Josh', '4', '45', '9', '36', '0', '1', '36', '9', '27', '0', '4'],
  ['', '', '', 'Total Gross', 'Avg Gross', 'Total Net', 'Avg Net', 'Avg Pts', 'Avg Hdcp', 'Birdies', 'Missed Week'],
  ['', '', 'Joey', '79', '39.5', '63', '31.5', '2', '8', '0', '0'],
  ['', '', 'Josh', '81', '40.5', '63', '31.5', '2.5', '9', '0', '0'],
  ['All Time Records', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', 'Lowest Net:', 'Josh', '27', '', '', '', '', ''],
  ['', '', '', 'Lowest Gross:', 'Joey', '36', '', '', '', '', ''],
  ['', '', '', 'Most Birdies:', 'Josh', '2', '', '', '', '', ''],
].map((row) => row.join(',')).join('\n');

test('Stats Lowest Gross tile shows Josh and Joey tied at 36', async ({ page }) => {
  await page.route('**/api/sheets/stats', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/csv', body: statsCsv });
  });

  await page.goto(process.env.AWL_APP_URL ?? '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Stats' }).click({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Player Stats' })).toBeVisible({ timeout: 15000 });

  const card = page.getByTestId('stats-lowest-gross-card');
  await expect(card).toBeVisible({ timeout: 15000 });
  await expect(card.getByText('Lowest Gross')).toBeVisible();
  await expect(card.getByText('Josh & Joey')).toBeVisible();
  await expect(card.getByText('(36)')).toBeVisible();
});
