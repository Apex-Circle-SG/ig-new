import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const clientId = 'ca-pub-8735749779872017';
const adScript = '**/pagead/js/adsbygoogle.js?*';

test('advertising requires a choice and disappears across the calculator boundary', async ({
  page,
  context,
}) => {
  let requests = 0;
  await page.route(adScript, async (route) => {
    requests++;
    await route.fulfill({
      contentType: 'application/javascript',
      body: 'window.__adTestLoaded = true;',
    });
  });
  const response = await page.goto('/data/census-cps/');
  await expect(page.getByRole('region', { name: 'Advertising preferences' })).toBeVisible();
  await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute(
    'content',
    clientId,
  );
  await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
  expect(requests).toBe(0);
  await page.getByRole('button', { name: 'Allow advertising', exact: true }).click();
  await expect(page.locator('#insightginie-adsense')).toHaveCount(1);
  await expect(page.locator('#insightginie-adsense')).toHaveAttribute('data-cfasync', 'false');
  await expect.poll(() => requests).toBe(1);
  expect(
    await page.evaluate(() => (window as unknown as Record<string, unknown>).__adTestLoaded),
  ).toBe(true);
  const nonce = await page
    .locator('#insightginie-adsense')
    .evaluate((script) => (script as HTMLScriptElement).nonce);
  expect(nonce?.length ?? 0).toBeGreaterThan(20);
  expect(response?.headers()['content-security-policy']).toContain("'strict-dynamic'");
  await page.locator('header a[href="/calc/individual-income-percentile/"]').click();
  await expect(page.getByLabel('Annual individual income')).toBeEnabled();
  await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as Record<string, unknown>).__adTestLoaded),
  ).toBeUndefined();
  await page.getByLabel('Annual individual income').fill('137891.23');
  await page.getByRole('button', { name: 'See where I stand' }).click();
  await expect(page.locator('.result-primary h2')).toContainText('$137,891.23');
  expect(requests).toBe(1);
  expect((await context.cookies()).find((cookie) => cookie.name === 'ig_advertising')?.value).toBe(
    'allow',
  );
});

test('withdrawing advertising reloads into a document without the provider', async ({
  page,
  context,
}) => {
  let requests = 0;
  await page.route(adScript, async (route) => {
    requests++;
    await route.fulfill({
      contentType: 'application/javascript',
      body: 'window.__adTestLoaded = true;',
    });
  });
  await page.goto('/methodology/');
  await page.getByRole('button', { name: 'Allow advertising', exact: true }).click();
  await expect.poll(() => requests).toBe(1);
  await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
  await page.getByRole('button', { name: 'Continue without ads', exact: true }).click();
  await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
  await expect
    .poll(
      async () =>
        (await context.cookies()).find((cookie) => cookie.name === 'ig_advertising')?.value,
    )
    .toBe('deny');
  expect(requests).toBe(1);
  expect(
    await page.evaluate(() => (window as unknown as Record<string, unknown>).__adTestLoaded),
  ).toBeUndefined();
});

test('ads.txt, fresh nonces, and mobile advertising choices are valid', async ({
  page,
  request,
}) => {
  const ads = await request.get('/ads.txt');
  expect(ads.status()).toBe(200);
  expect(ads.headers()['content-type']).toContain('text/plain');
  expect(await ads.text()).toBe('google.com, pub-8735749779872017, DIRECT, f08c47fec0942fa0\n');
  const first = await request.get('/methodology/');
  const second = await request.get('/methodology/');
  expect(first.headers()['content-security-policy']).not.toEqual(
    second.headers()['content-security-policy'],
  );
  expect(first.headers()['cache-control']).toContain('no-store');
  expect(first.headers()['cache-control']).toContain('no-transform');
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/methodology/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Continue without ads', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Advertising preferences' })).toHaveCount(0);
});
