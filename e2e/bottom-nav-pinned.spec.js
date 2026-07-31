import { expect, test } from '@playwright/test';

const leaderboardCsv = [
  ',,,Week,1',
  ...['A', 'B', 'C', 'D'].flatMap((group, groupIndex) => [
    `Group ${group},,,Total`,
    ...Array.from({ length: 12 }, (_, i) => `,${i + 1},Player ${groupIndex}-${i},4,4`),
  ]),
].join('\n');

const championshipCsv = [
  'AWL CHAMPIONSHIP WEEKEND 2026',
  '',
  '',
  'WEEKEND EVENTS',
  'Event,Date,Start Time,Course / Venue,Address,Details',
  'Round One,8/8/2026,6:00 AM,Shawnee Hills,,',
  'Final Round,8/9/2026,6:00 AM,Shale Creek,,',
  '',
  'CHAMPIONSHIP RULES',
  'Rule #,Rule Name,Full Rule / Change',
  '1,The Kevin Rule,No gimmies for birdies.',
  '',
  'GROUPINGS & TEE TIMES',
  'Group,Tee Time,Player 1,Player 2,Player 3,Player 4,Notes',
  'Group 1,,Chuck,Sean,Fitch,Ian,',
  'Group 2,,Jimmy,Andulics,Tony,Glen,',
  '',
  'CHAMPIONSHIP LEADERBOARD',
  'Position,Player,Group,Round 1 Net,Round 2 Net,Weekend Net,Gross Total,Status / Notes',
  ',Chuck,Group 1,74,70,144,160,',
  ',Sean,Group 1,68,69,137,151,',
].join('\n');

const scrollMainToBottom = async (page) => {
  await page.locator('#main-content').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(300);
};

const expectNavPinnedToViewportBottom = async (page) => {
  const nav = page.getByRole('navigation', { name: 'Primary' });
  const box = await nav.boundingBox();
  const viewportHeight = await page.evaluate(() => innerHeight);
  expect(box).not.toBeNull();
  expect(Math.abs((box.y + box.height) - viewportHeight)).toBeLessThanOrEqual(1);
};

test.describe('bottom navigation stays glued to the viewport bottom', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/sheets/leaderboard', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: leaderboardCsv }));
    await page.route('**/championship-preview.csv', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: championshipCsv }));
  });

  test('the document does not scroll and main is the scroll container', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4100);

    const layout = await page.evaluate(() => {
      const main = document.getElementById('main-content');
      return {
        bodyOverflow: getComputedStyle(document.body).overflowY,
        htmlOverflow: getComputedStyle(document.documentElement).overflowY,
        mainOverflow: getComputedStyle(main).overflowY,
        documentScrollable: document.documentElement.scrollHeight > innerHeight + 1,
        mainScrollable: main.scrollHeight > main.clientHeight,
      };
    });

    expect(layout.bodyOverflow).toBe('hidden');
    expect(layout.htmlOverflow).toBe('hidden');
    expect(layout.mainOverflow).toBe('auto');
    expect(layout.documentScrollable).toBe(false);
    expect(layout.mainScrollable).toBe(true);
  });

  for (const tab of ['Leaderboard', 'Schedule', 'Rules', 'History', 'Stats']) {
    test(`nav stays pinned after scrolling the ${tab} tab`, async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(4100);
      await page.getByRole('button', { name: tab }).click();

      await expectNavPinnedToViewportBottom(page);
      await scrollMainToBottom(page);
      await expectNavPinnedToViewportBottom(page);
    });
  }

  test('nav stays pinned after scrolling in championship mode', async ({ page }) => {
    await page.goto('/?championshipPreview=1');
    await page.waitForTimeout(4100);
    await expect(page.getByTestId('championship-page')).toBeVisible();

    await expectNavPinnedToViewportBottom(page);
    await scrollMainToBottom(page);
    await expectNavPinnedToViewportBottom(page);
  });

  test('nav keeps its safe-area bottom padding', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4100);

    const paddingBottom = await page.getByRole('navigation', { name: 'Primary' }).evaluate((el) => getComputedStyle(el).paddingBottom);
    expect(Number.parseFloat(paddingBottom)).toBeGreaterThanOrEqual(6);
  });
});
