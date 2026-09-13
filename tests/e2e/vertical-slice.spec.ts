import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const calculator = '/calc/individual-income-percentile/';
const tool = (page: import('@playwright/test').Page) =>
  page.frameLocator('iframe.private-income-frame');
test.use({ extraHTTPHeaders: { 'cf-ipcountry': 'US' } });
test.beforeEach(async ({ page }) => {
  await page.route('**/pagead/js/adsbygoogle.js?*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
});

test('homepage routes a real question to the calculator', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Understandwhere you stand.');
  const search = page.getByRole('textbox', { name: 'What do you want to understand?' });
  await search.fill('compare my income');
  await page
    .locator('#intent-results')
    .getByRole('link', { name: 'How does my income compare?' })
    .click();
  await expect(page).toHaveURL(new RegExp(calculator));
  await expect(tool(page).locator('.big-percent')).toContainText('74.7%');
  expect(runtimeErrors).toEqual([]);
});

test('calculator validates, handles tail uncertainty, and explores a what-if', async ({ page }) => {
  await page.goto(calculator);
  const income = tool(page).getByLabel('Annual individual income');
  const calculate = tool(page).getByRole('button', { name: 'See where I stand' });
  await income.fill('abc');
  await calculate.click();
  await expect(tool(page).locator('#income-error')).toContainText('Enter an annual income');
  await income.fill('75000');
  await calculate.click();
  await expect(tool(page).locator('.big-percent')).toContainText('74.7%');
  await tool(page).getByRole('button', { name: '$5,000', exact: true }).click();
  await expect(income).toHaveValue('80000');
  await expect(tool(page).locator('.result-primary h2')).toContainText('$80,000');
  await income.fill('300000');
  await calculate.click();
  await expect(tool(page).locator('.big-percent')).toContainText('97.4–100%');
  await expect(tool(page).locator('.result-summary')).toContainText('cannot support an exact rank');
  await income.fill('2499.99');
  await calculate.click();
  await expect(tool(page).locator('.result-primary h2')).toContainText('$2,499.99');
  await expect(tool(page).locator('.result-summary')).toContainText('cannot support an exact rank');
  await income.fill('-2500');
  await calculate.click();
  await expect(tool(page).locator('.result-primary h2')).toContainText('-$2,500');
  await expect(tool(page).locator('#income-error')).toHaveCount(0);
  await tool(page).getByText('View the data as a table').click();
  await expect(tool(page).getByRole('table')).toBeVisible();
  await expect(tool(page).getByRole('row')).toHaveCount(45);
});

test('financial inputs never enter network requests or browser storage', async ({ page }) => {
  await page.goto(calculator);
  await page.waitForLoadState('networkidle');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url() + ' ' + (request.postData() ?? '')));
  await tool(page).getByLabel('Annual individual income').fill('137891.23');
  await tool(page).getByRole('button', { name: 'See where I stand' }).click();
  await expect(tool(page).locator('.result-primary h2')).toContainText('$137,891');
  expect(requests.join('\n')).not.toContain('137891');
  expect(page.url()).not.toContain('?');
  const stored = await page.evaluate(() => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookies: document.cookie,
  }));
  expect(stored).toEqual({ local: 0, session: 0, cookies: '' });
  await page.reload();
  await expect(tool(page).getByLabel('Annual individual income')).toHaveValue('75000');
});

test('sharing copies only the generic tool URL', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(calculator);
  await tool(page).getByRole('button', { name: 'Share this calculator' }).click();
  await expect(tool(page).getByRole('button', { name: 'Tool link copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'https://insightginie.com/calc/individual-income-percentile/',
  );
});

for (const width of [320, 375, 390, 430, 768, 1280]) {
  test(`homepage and calculator fit ${width}px and remain accessible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', calculator]) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(accessibility.violations).toEqual([]);
    }
  });
}

test('mobile menu and keyboard form work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.mobile-nav summary').click();
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'Calculators', exact: true })
    .click();
  await expect(page).toHaveURL(/\/calc\/$/);
  await page.getByRole('link', { name: /Individual income percentile/ }).click();
  await tool(page).getByLabel('Annual individual income').focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('55000');
  await page.keyboard.press('Enter');
  await expect(tool(page).locator('.result-primary h2')).toContainText('$55,000');
});

test('sources, production indexing, headers and 404', async ({ page, request }) => {
  const response = await page.goto(calculator);
  expect(response?.headers()['x-robots-tag']).toBeUndefined();
  expect(response?.headers()['content-security-policy']).toContain("object-src 'none'");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://insightginie.com/calc/individual-income-percentile/',
  );
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(
    jsonLd
      .map((s) => JSON.parse(s))
      .flat()
      .some((v) => v['@type'] === 'WebApplication'),
  ).toBe(true);
  await page.getByRole('link', { name: 'Explore the dataset' }).click();
  await expect(page.getByRole('heading', { name: 'The version we use' })).toBeVisible();
  await expect(page.locator('article')).toContainText('2024');
  const health = await request.get('/api/health/');
  expect(health.status()).toBe(200);
  expect((await health.json()).status).toBe('ok');
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const robots = await (await request.get('/robots.txt')).text();
  const generalRules = robots.match(/User-Agent:\s*\*([\s\S]*?)(?:\n\s*\n|$)/i)?.[1];
  expect(generalRules).toContain('Allow: /');
  expect(generalRules).not.toMatch(/^Disallow: \/$/m);
  expect(await (await request.get('/sitemap.xml')).text()).toContain(
    '<loc>https://insightginie.com/calc/individual-income-percentile/</loc>',
  );
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
  expect((await request.get('/missing-insight/')).status()).toBe(404);
});

test('all public navigation destinations render', async ({ request }) => {
  for (const path of [
    '/about/',
    '/methodology/',
    '/methodology/individual-income/',
    '/data/',
    '/data/census-cps/',
    '/editorial-policy/',
    '/privacy/',
    '/terms/',
    '/contact/',
    '/authors/',
  ])
    expect((await request.get(path)).status(), path).toBe(200);
});

test('no-JavaScript page cannot submit a private income', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}${calculator}`);
  await expect(tool(page).getByLabel('Annual individual income')).toBeDisabled();
  await expect(tool(page).getByRole('button', { name: 'See where I stand' })).toBeDisabled();
  expect(await tool(page).locator('noscript').textContent()).toContain(
    'Enable JavaScript to calculate privately',
  );
  await expect(tool(page).locator('.big-percent')).toBeVisible();
  expect(
    await tool(page)
      .locator('input')
      .evaluateAll((inputs) => inputs.every((input) => !input.getAttribute('name'))),
  ).toBe(true);
  await context.close();
});

test('native form submission cannot send financial values out of the sandbox', async ({ page }) => {
  await page.goto(calculator);
  await expect(tool(page).getByLabel('Annual individual income')).toBeEnabled();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url() + (request.postData() ?? '')));
  await tool(page)
    .locator('form')
    .evaluate((form) => {
      const input = form.querySelector('input')!;
      input.value = '137891.23';
      (form as HTMLFormElement).submit();
    });
  await expect(tool(page).locator('.big-percent')).toBeVisible();
  expect(requests.join('\n')).not.toContain('137891');
  expect(page.url()).not.toContain('137891');
});

test('a failed calculator document can be retried without exposing an input', async ({ page }) => {
  await page.route('**/tools/income/**', (route) => route.abort());
  await page.goto(calculator);
  await expect(page.getByRole('button', { name: 'Reload calculator' })).toBeVisible({
    timeout: 12000,
  });
  await page.unroute('**/tools/income/**');
  await page.getByRole('button', { name: 'Reload calculator' }).click();
  await expect(tool(page).getByLabel('Annual individual income')).toBeEnabled();
  await tool(page).getByLabel('Annual individual income').fill('123456');
  await tool(page).getByRole('button', { name: 'See where I stand' }).click();
  await expect(tool(page).locator('.result-primary h2')).toContainText('$123,456');
});
