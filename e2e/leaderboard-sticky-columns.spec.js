import { test, expect } from '@playwright/test';

const box = async (locator) => {
  const rect = await locator.boundingBox();
  expect(rect).not.toBeNull();
  return rect;
};

test('Leaderboard keeps rank, player, and total pinned during horizontal scroll', async ({ page }) => {
  const rows = [',,,Week,1,2,3,4,Major,5,6,7,8,9,10,11,12'];
  for (const group of ['A', 'B', 'C', 'D']) {
    rows.push(`Group ${group},,,Total`);
    for (let rank = 1; rank <= 4; rank += 1) rows.push(`,${rank},Player ${group}${rank},${17 - rank},4,2,1,0,0,4,2,1,0,4,2,1,0`);
  }
  await page.route('**/api/sheets/leaderboard', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: rows.join('\n') }));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(process.env.AWL_APP_URL ?? '/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible({ timeout: 15000 });

  const scroller = page.getByTestId('leaderboard-scroll');
  await expect(scroller).toBeVisible({ timeout: 15000 });

  const firstRow = page.getByTestId('leaderboard-player-row').first();
  await expect(firstRow).toBeVisible({ timeout: 15000 });

  const player = firstRow.getByTestId('leaderboard-sticky-player');
  const total = firstRow.getByTestId('leaderboard-sticky-total');
  const firstWeek = firstRow.locator('div').nth(3);

  const beforePlayer = await box(player);
  const beforeTotal = await box(total);
  const beforeWeek = await box(firstWeek);

  await scroller.evaluate((el) => { el.scrollLeft = 260; });
  await page.waitForTimeout(250);

  const afterPlayer = await box(player);
  const afterTotal = await box(total);
  const afterWeek = await box(firstWeek);
  const scrollLeft = await scroller.evaluate((el) => el.scrollLeft);

  expect(scrollLeft).toBeGreaterThan(100);
  expect(Math.abs(afterPlayer.x - beforePlayer.x), 'player column should stay pinned').toBeLessThanOrEqual(1);
  expect(Math.abs(afterTotal.x - beforeTotal.x), 'total column should stay pinned').toBeLessThanOrEqual(1);
  expect(afterWeek.x, 'weekly points columns should scroll underneath/away').toBeLessThan(beforeWeek.x - 100);

  await expect(player).toBeVisible();
  await expect(total).toBeVisible();
});
