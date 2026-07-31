import { expect, test } from '@playwright/test';

const leaderboardCsv = [
  ',,,Week,1',
  'Group A,,,Total',
  ',1,Chad,4,4',
  'Group B,,,Total',
  ',1,Sean,4,4',
  'Group C,,,Total',
  ',1,Joey,4,4',
  'Group D,,,Total',
  ',1,Josh,4,4',
].join('\n');

test.beforeEach(async ({ page }) => {
  await page.route('**/api/sheets/leaderboard', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: leaderboardCsv }));
});

test('app shell covers the complete viewport with no top-edge color seam', async ({ page }) => {
  await page.goto('/');

  const geometry = await page.evaluate(() => {
    const root = document.getElementById('root');
    const topColors = [0, 1, 2, 3, 4].map((y) => getComputedStyle(document.elementFromPoint(innerWidth / 2, y)).backgroundColor);
    return {
      bodyHeight: document.body.getBoundingClientRect().height,
      rootHeight: root.getBoundingClientRect().height,
      viewportHeight: innerHeight,
      topColors,
    };
  });

  expect(geometry.bodyHeight).toBeGreaterThanOrEqual(geometry.viewportHeight);
  expect(geometry.rootHeight).toBeGreaterThanOrEqual(geometry.viewportHeight);
  expect(new Set(geometry.topColors)).toEqual(new Set(['rgb(15, 122, 63)']));
});

test('iOS safe-area boundary has a continuous green paint layer', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(4100);

  const safeAreaPaint = await page.evaluate(() => {
    const style = getComputedStyle(document.body, '::before');
    return {
      backgroundColor: style.backgroundColor,
      content: style.content,
      height: Number.parseFloat(style.height),
      pointerEvents: style.pointerEvents,
      position: style.position,
      top: style.top,
    };
  });

  expect(safeAreaPaint.backgroundColor).toBe('rgb(15, 122, 63)');
  expect(safeAreaPaint.content).not.toBe('none');
  expect(safeAreaPaint.height).toBeGreaterThanOrEqual(2);
  expect(safeAreaPaint.pointerEvents).toBe('none');
  expect(safeAreaPaint.position).toBe('fixed');
  expect(safeAreaPaint.top).toBe('0px');
});

test('all primary navigation destinations open without a render error', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(4100);

  for (const [button, heading] of [
    ['Leaderboard', 'Leaderboard'],
    ['Schedule', 'Schedule'],
    ['Rules', 'League Rules'],
    ['History', 'Hall of Fame'],
    ['Stats', 'Player Stats'],
  ]) {
    await page.getByRole('button', { name: button }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});
