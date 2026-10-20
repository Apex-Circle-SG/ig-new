import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { DISCOVERY_HUB_PATHS, PUBLIC_EARNING_GUIDE_PATHS } from '@insightginie/seo';

test.beforeEach(async ({ page }) => {
  await page.route('**/pagead/js/adsbygoogle.js*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.route('**/gtag/js*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.route('**/g/collect*', (route) => route.fulfill({ status: 204 }));
});

test('topic hubs and reviewed guides agree with canonical and sitemap policies', async ({
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const partition = await (await request.get('/sitemaps/site.xml')).text();
  for (const path of [...DISCOVERY_HUB_PATHS, ...PUBLIC_EARNING_GUIDE_PATHS]) {
    expect(sitemap).toContain(`https://insightginie.com${path}`);
    expect(partition).toContain(`https://insightginie.com${path}`);
  }
  for (const path of DISCOVERY_HUB_PATHS) {
    const response = await request.get(path);
    const html = await response.text();
    expect(response.status()).toBe(200);
    expect(html).toContain(`rel="canonical" href="https://insightginie.com${path}"`);
    expect(html).not.toMatch(/name="robots" content="noindex/);
    expect(html).toContain('CollectionPage');
    expect(html).toContain('BreadcrumbList');
  }
  expect(
    (await request.get('/earn/digital-products/?q=private')).headers()['x-robots-tag'],
  ).toContain('noindex');
  for (const path of ['/earn/missing-method/', '/ideas/missing-idea/'])
    expect(await (await request.get(path)).text()).toMatch(/name="robots" content="noindex/);
});

test('hubs lead readers into relevant guides and contracts without losing their context', async ({
  page,
}) => {
  await page.goto('/earn/paid-research/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Paid research');
  await page.locator('article').getByRole('link', { name: 'Get paid to test websites' }).click();
  await expect(page.getByRole('heading', { name: 'Your first step', exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Paid participation' }),
  ).toHaveAttribute('href', '/earn/paid-research/');
  await expect(
    page.getByRole('heading', { name: 'Compare related earning methods' }),
  ).toBeVisible();
  await page.goto('/opportunities/remote-contracts/');
  for (const card of await page.locator('article').all())
    await expect(card).toContainText('Contract');
  await expect(page.getByRole('heading', { name: 'Compare the whole commitment' })).toBeVisible();
});

test('topic pages fit mobile, remain accessible, and retain eligible advertising', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await context.setExtraHTTPHeaders({ 'cf-ipcountry': 'US' });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of DISCOVERY_HUB_PATHS) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator('#insightginie-adsense')).toHaveAttribute(
        'src',
        /ca-pub-8735749779872017/,
      );
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
  }
  await page.screenshot({ path: 'artifacts/seo-discovery-hub-desktop.png', fullPage: true });
});

test('topic discovery and guide comparisons work without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/earn/digital-products/');
  await expect(
    page.getByRole('heading', { name: 'The first sale is not the same as breaking even' }),
  ).toBeVisible();
  await page
    .getByRole('table')
    .getByRole('link', { name: 'Specialist spreadsheets', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Sell a specialist spreadsheet', exact: true }),
  ).toBeVisible();
  await context.close();
});
