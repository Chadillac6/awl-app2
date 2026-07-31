import { expect, test } from '@playwright/test';

const championshipCsv = [
  'AWL CHAMPIONSHIP WEEKEND 2026',
  '',
  '',
  'WEEKEND EVENTS',
  'Event,Date,Start Time,Course / Venue,Address,Details',
  'Round One,8/8/2026,6:00 AM,Shawnee Hills,,',
  'Final Round,8/9/2026,6:00 AM,Shale Creek,,',
  'AWL Awards Ceremony,8/9/2026,1:30 PM,Awards Ceremony,"13489 Lake Avenue, Lakewood, Ohio",',
  '',
  'CHAMPIONSHIP RULES',
  'Rule #,Rule Name,Full Rule / Change',
  '1,The Kevin Rule,No gimmies for birdies.',
  '2,Out of Bounds,Played as a red stake.',
  '',
  'GROUPINGS & TEE TIMES',
  'Group,Tee Time,Player 1,Player 2,Player 3,Player 4,Notes',
  'Group 1,,Chuck,Sean,Fitch,Ian,',
  'Group 2,,Jimmy,Andulics,Tony,Glen,',
  'Group 3,,Baker,Houser,Chad,Faro,',
  'Group 4,,Jared,Carp,Jake,Basar,',
  '',
  'CHAMPIONSHIP LEADERBOARD',
  'Position,Player,Group,Round 1 Net,Round 2 Net,Weekend Net,Gross Total,Status / Notes',
  ',Chuck,Group 1,74,70,144,160,',
  ',Sean,Group 1,68,69,137,151,',
  ',Fitch,Group 1,,,,,,',
  '',
  'MODE & NOTIFICATION CONTROLS',
  'Setting,Value,Instructions / Copy',
  'Groupings Confirmed?,YES,',
  'Championship Mode Ready?,NO,',
].join('\n');

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
  await expect(page.getByText('Shale Creek', { exact: true })).toBeVisible();
  await expect(page.getByText('AWL Awards Ceremony', { exact: true })).toBeVisible();
  await expect(page.getByText('Everyone arrive around 6:00 AM', { exact: true })).toBeVisible();
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

test('leaderboard sorts scored golfers by lowest total net', async ({ page }) => {
  await page.goto('/?championshipPreview=1');
  await page.waitForTimeout(4100);

  const rows = page.getByTestId('championship-leaderboard-row');
  await expect(rows.first()).toHaveAttribute('data-player', 'Sean');
  await expect(rows.nth(1)).toHaveAttribute('data-player', 'Chuck');
  await expect(page.getByText('Total Net Scores', { exact: true })).toBeVisible();
});

test('standard app remains unchanged when preview mode is off', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(4100);
  await expect(page.getByRole('button', { name: 'Schedule' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Championship' })).toHaveCount(0);
  await expect(page.getByTestId('championship-page')).toHaveCount(0);
});
