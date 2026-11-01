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

test('iOS status bar has a real full-width fixed green strip', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(4100);

  const strip = await page.evaluate(() => {
    const element = document.querySelector('body > .status-bar-strip');
    if (!element) return null;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      ariaHidden: element.getAttribute('aria-hidden'),
      backgroundColor: style.backgroundColor,
      height: rect.height,
      position: style.position,
      top: rect.top,
      widthRatio: rect.width / window.innerWidth,
    };
  });

  expect(strip).not.toBeNull();
  expect(strip.ariaHidden).toBe('true');
  expect(strip.backgroundColor).toBe('rgb(15, 122, 63)');
  expect(strip.height).toBeGreaterThan(10);
  expect(strip.position).toBe('fixed');
  expect(strip.top).toBe(0);
  expect(strip.widthRatio).toBeGreaterThanOrEqual(0.9);
});

test('header title clears the status bar strip when there is no safe-area inset', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(4100);

  const { stripBottom, titleTop } = await page.evaluate(() => ({
    stripBottom: document.querySelector('body > .status-bar-strip').getBoundingClientRect().bottom,
    titleTop: document.querySelector('header h1').getBoundingClientRect().top,
  }));

  expect(titleTop).toBeGreaterThanOrEqual(stripBottom);
});

test('iOS status bar style is default so Home Screen apps get a solid status bar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'default');
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
