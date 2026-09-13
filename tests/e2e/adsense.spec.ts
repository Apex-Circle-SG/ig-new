import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PUBLIC_AD_PATHS } from '../../packages/seo/src/routes';

const adScript = '**/pagead/js/adsbygoogle.js?*';
const clientId = 'ca-pub-8735749779872017';
test.use({ extraHTTPHeaders: { 'cf-ipcountry': 'US' } });
test.beforeEach(async ({ page }) => {
  await page.route(adScript, (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.__adTestLoaded = true;',
    }),
  );
});

test('every reviewed public page loads advertising by default for US visitors', async ({
  page,
}) => {
  for (const path of PUBLIC_AD_PATHS) {
    await page.goto(path);
    await expect(page.locator('#insightginie-adsense'), path).toHaveCount(1);
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute(
      'content',
      clientId,
    );
    await expect
      .poll(() =>
        page.evaluate(() => Boolean((window as unknown as Record<string, unknown>).__adTestLoaded)),
      )
      .toBe(true);
    await expect(page.getByRole('region', { name: 'Advertising preferences' })).toHaveCount(0);
  }
  for (const path of ['/authors/', '/missing-insight/']) {
    await page.goto(path);
    await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
  }
});

test('advertising cannot read calculator inputs or results', async ({ page }) => {
  const requests: string[] = [];
  const messages: string[] = [];
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__boundaryMessages = [];
    window.addEventListener('message', (event) => {
      if (event.data?.channel === 'insightginie:income-tool:v1')
        ((window as unknown as Record<string, unknown>).__boundaryMessages as unknown[]).push(
          event.data,
        );
    });
  });
  await page.goto('/calc/individual-income-percentile/');
  await expect(page.locator('#insightginie-adsense')).toHaveCount(1);
  const frame = page.frameLocator('iframe.private-income-frame');
  await expect(frame.getByLabel('Annual individual income')).toBeEnabled();
  page.on('request', (request) => requests.push(request.url() + (request.postData() ?? '')));
  await frame.getByLabel('Annual individual income').fill('137891.23');
  await frame.getByRole('button', { name: 'See where I stand' }).click();
  await expect(frame.locator('.result-primary h2')).toContainText('$137,891.23');
  expect(
    await page.locator('.private-income-frame').evaluate((element) => {
      const frame = element as HTMLIFrameElement;
      return frame.contentDocument === null;
    }),
  ).toBe(true);
  expect(await page.locator('body').textContent()).not.toContain('137,891');
  messages.push(
    await page.evaluate(() =>
      JSON.stringify((window as unknown as Record<string, unknown>).__boundaryMessages),
    ),
  );
  expect(requests.join('\n') + messages.join('\n')).not.toContain('137891');
  expect(messages.join('\n')).not.toContain('137,891');
  await expect(frame.locator('#insightginie-adsense')).toHaveCount(0);
});

test('required regional choice and withdrawal are respected', async ({ page, context }) => {
  await context.setExtraHTTPHeaders({ 'cf-ipcountry': 'DE' });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Advertising preferences' })).toBeVisible();
  await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
  await page.getByRole('button', { name: 'Allow advertising', exact: true }).click();
  await expect(page.locator('#insightginie-adsense')).toHaveCount(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { adsbygoogle: { requestNonPersonalizedAds: number } }).adsbygoogle
          .requestNonPersonalizedAds,
    ),
  ).toBe(1);
  await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
  await page.getByRole('button', { name: 'Continue without ads', exact: true }).click();
  await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
  expect((await context.cookies()).find((cookie) => cookie.name === 'ig_advertising')?.value).toBe(
    'deny',
  );
  await context.setExtraHTTPHeaders({ 'cf-ipcountry': 'US' });
  await page.goto('/calc/');
  await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
});

test('ads.txt, fresh nonces, and mobile advertising choices are valid', async ({
  page,
  request,
  context,
}) => {
  const ads = await request.get('/ads.txt');
  expect(ads.status()).toBe(200);
  expect(await ads.text()).toBe('google.com, pub-8735749779872017, DIRECT, f08c47fec0942fa0\n');
  const first = await request.get('/methodology/');
  const second = await request.get('/methodology/');
  expect(first.headers()['content-security-policy']).not.toEqual(
    second.headers()['content-security-policy'],
  );
  expect(first.headers()['cache-control']).toContain('no-transform');
  await context.setExtraHTTPHeaders({ 'cf-ipcountry': 'GB' });
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
});

test('public dataset supports sorting, CSV downloads and source-attributed embeds', async ({
  page,
  request,
}) => {
  await page.goto('/data/us-income-distribution/');
  await page.getByLabel('Order public income bands').selectOption('share');
  await expect(page.locator('.income-data-table tbody tr').first()).toContainText('Under $2,500');
  const csv = await request.get('/data/us-income-distribution.csv');
  expect(csv.status()).toBe(200);
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect((await csv.text()).trimEnd().split('\r\n')).toHaveLength(45);
  const embed = await request.get('/embed/income-distribution/');
  expect(embed.headers()['x-robots-tag']).toContain('noindex');
  expect(embed.headers()['x-frame-options']).toBeUndefined();
  expect(await embed.text()).toContain('Chart:');
  expect(await embed.text()).not.toContain('adsbygoogle');
});
