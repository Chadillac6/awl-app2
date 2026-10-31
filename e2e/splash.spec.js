import { expect, test } from '@playwright/test';

const leaderboardCsv = [',,,Week,1', 'Group A,,,Total', ',1,Chad,4,4'].join('\n');

test.beforeEach(async ({ context }) => {
  await context.route('**/api/sheets/leaderboard', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: leaderboardCsv }));
});

test('golf splash plays once per session and reloads skip it', async ({ page }) => {
  await page.goto('/');
  const splash = page.getByTestId('golf-splash');
  await expect(splash).toBeVisible();
  await expect(splash).toHaveAttribute('data-scene', 'hole-in-one');
  await expect(splash).toHaveAttribute('data-motion', 'full');
  await expect(splash).toBeHidden({ timeout: 3800 });
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toHaveAttribute('aria-current', 'page');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toBeVisible();
  await expect(splash).toHaveCount(0);
});

test('each new session shows the next splash scene in turn', async ({ context }) => {
  const seen = [];
  for (let i = 0; i < 4; i += 1) {
    const page = await context.newPage();
    await page.goto('/');
    seen.push(await page.getByTestId('golf-splash').getAttribute('data-scene'));
    await page.close();
  }
  expect(seen).toEqual(['hole-in-one', 'putt', 'sunrise', 'hole-in-one']);
});

test('tapping the splash skips straight to the app', async ({ page }) => {
  await page.goto('/');
  const splash = page.getByTestId('golf-splash');
  await expect(splash).toBeVisible();
  await splash.click();
  await expect(splash).toBeHidden({ timeout: 1000 });
  await page.getByRole('button', { name: 'Rules' }).click();
  await expect(page.getByRole('heading', { name: 'League Rules' })).toBeVisible();
});

test('reduce motion shows a still logo briefly instead of the animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const splash = page.getByTestId('golf-splash');
  await expect(splash).toHaveAttribute('data-motion', 'reduced');
  await expect(splash).toBeHidden({ timeout: 1600 });
});
