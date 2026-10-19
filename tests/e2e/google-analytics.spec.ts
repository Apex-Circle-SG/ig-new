import { test, expect } from '@playwright/test';
const id = 'G-4HQVZL3586';
test.beforeEach(async ({ page }) => {
  await page.route('**/googletagmanager.com/gtag/js*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.__gaScriptLoaded = true;',
    }),
  );
  await page.route('**/pagead/js/adsbygoogle.js*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
});
test('GA4 waits for updated consent, uses the owner ID, and disables on withdrawal', async ({
  page,
}) => {
  await page.goto('/opportunities/');
  await expect(page.getByRole('button', { name: 'Analytics settings' })).toBeEnabled();
  await expect(page.locator('#insightginie-ga4')).toHaveCount(0);
  await page.getByRole('button', { name: 'Analytics settings' }).click();
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect(page.locator('#insightginie-ga4')).toHaveAttribute(
    'src',
    `https://www.googletagmanager.com/gtag/js?id=${id}`,
  );
  const commands = await page.evaluate(() =>
    ((window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer ?? []).map((entry) =>
      Array.from(entry),
    ),
  );
  expect(commands.some((entry) => entry[0] === 'config' && entry[1] === id)).toBe(true);
  expect(commands.filter((entry) => entry[0] === 'event' && entry[1] === 'page_view')).toHaveLength(
    1,
  );
  await page.getByRole('button', { name: 'Decline analytics' }).click();
  expect(
    await page.evaluate(
      (key) => (window as unknown as Record<string, unknown>)[key],
      `ga-disable-${id}`,
    ),
  ).toBe(true);
});
test('old counts consent, filtered searches and private conversations do not load GA4', async ({
  page,
  context,
}) => {
  await page.goto('/opportunities/');
  await page.evaluate(() => {
    document.cookie = 'ig_analytics=allow; Path=/';
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Analytics settings' })).toBeEnabled();
  await expect(page.locator('#insightginie-ga4')).toHaveCount(0);
  await page.evaluate(() => {
    document.cookie = 'ig_ga4=allow; Path=/';
  });
  for (const path of ['/opportunities/?q=private-search-term', '/ask/', '/opportunities/saved/']) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'Analytics settings' })).toBeEnabled();
    await expect(page.locator('#insightginie-ga4')).toHaveCount(0);
  }
  expect((await context.cookies()).find((cookie) => cookie.name === 'ig_ga4')?.value).toBe('allow');
});
