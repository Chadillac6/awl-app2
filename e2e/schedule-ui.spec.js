import { test, expect } from '@playwright/test';

const getWeekCard = (page, week) => page.locator(`[data-testid="schedule-week-card"][data-week="${week}"]`);

const expectGroupOnce = async (card, week, group) => {
  await expect(card.getByText(`Group ${group}`, { exact: true }), `Week ${week} should include Group ${group} once`).toHaveCount(1);
};

test('Schedule UI renders all four groups for every regular week, including three-course weeks', async ({ page }) => {
  const rows = [',,2026 SCHEDULE B,,,', ',,Group A,Group B,Group C,Group D'];
  for (let week = 1; week <= 12; week += 1) {
    const courses = week === 8
      ? ['Hilliard', 'Bob O Link', 'Big Met', 'Big Met']
      : week === 10
        ? ['Bob O Link', 'Hilliard', 'Big Met', 'Big Met']
        : ['Bob O Link', 'Bob O Link', 'Hilliard', 'Hilliard'];
    rows.push([week, `12-${week}`, ...courses].join(','));
  }
  rows.push('MAJOR,12-20,Seneca Open,,,');
  rows.push(',8-7,Championship Aug 8th and 9th,,,');
  await page.route('**/api/sheets/schedule', (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: rows.join('\n') }));
  await page.goto(process.env.AWL_APP_URL ?? '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Schedule' }).click({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible({ timeout: 15000 });

  for (const week of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']) {
    const card = getWeekCard(page, week);
    await expect(card, `Week ${week} card should be visible`).toBeVisible({ timeout: 15000 });
    for (const group of ['A', 'B', 'C', 'D']) await expectGroupOnce(card, week, group);
  }

  await expect(getWeekCard(page, '8').getByText('Hilliard')).toBeVisible();
  await expect(getWeekCard(page, '10').getByText('Big Met')).toBeVisible();
  const seneca = getWeekCard(page, 'MAJOR');
  await expect(seneca.getByText('Seneca Open - May 30', { exact: true })).toBeVisible();
  await expect(seneca.getByText('Seneca Open · May 30', { exact: true })).toBeVisible();

  const championship = getWeekCard(page, 'CHAMPIONSHIP');
  await expect(championship.getByText('Championship', { exact: true })).toBeVisible();
  await expect(championship.getByText('Shawnee Hills', { exact: true })).toBeVisible();
  await expect(championship.getByText('Shale Creek', { exact: true })).toBeVisible();
  await expect(championship.getByText('Aug 8', { exact: true })).toBeVisible();
  await expect(championship.getByText('Aug 9', { exact: true })).toBeVisible();
});
