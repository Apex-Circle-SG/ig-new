import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import { PUBLIC_EARNING_GUIDE_PATHS } from '@insightginie/seo';

const income = '/calc/individual-income-percentile/';
test.beforeEach(async ({ page }) => {
  await page.route(/googlesyndication|google-analytics|googletagmanager|doubleclick/, (route) =>
    route.abort(),
  );
});
for (const width of [390, 1280])
  test(`quick wins pages and guides work at ${width}px`, async ({ page, request }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    const paths = [
      '/',
      '/calculators/',
      income,
      '/data/us-income-distribution/',
      '/privacy/',
      '/advertising-disclosure/',
      ...FINANCE_TOOLS.map((tool) => `/tools/${tool.id}/`),
      ...PUBLIC_EARNING_GUIDE_PATHS,
    ];
    const links = new Set<string>();
    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        path,
      ).toBe(true);
      if (width === 390) await page.locator('.mobile-nav > summary').click();
      await expect(
        page
          .getByRole('navigation', {
            name: width === 390 ? 'Mobile navigation' : 'Main navigation',
            exact: true,
          })
          .getByRole('link', { name: 'Calculators', exact: true }),
      ).toHaveAttribute('href', '/calculators/');
      if (path.startsWith('/earn/')) {
        await expect(page.getByRole('heading', { name: 'Make the numbers work' })).toBeVisible();
        await expect(
          page.getByText('This is an earning method, not an available paid assignment.', {
            exact: false,
          }),
        ).toBeVisible();
      }
      if (path === income || path === '/data/us-income-distribution/') {
        const faq = page.locator('.faq-section').filter({
          has: page.getByRole('heading', { name: 'Income percentiles and thresholds' }),
        });
        await expect(faq.locator('details')).toHaveCount(8);
        await expect(
          faq
            .locator('details p')
            .filter({ hasText: /^Source: US Census Bureau, CPS ASEC PINC-11, 2024 income\.$/ }),
        ).toHaveCount(8);
        const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
        expect(schema.some((text) => JSON.parse(text)['@type'] === 'FAQPage')).toBe(true);
      }
      if (['/calculators/', income, '/data/us-income-distribution/'].includes(path)) {
        await expect(page.locator('.weekly-insight')).toHaveCount(1);
        await expect(page.getByRole('button', { name: 'Get the weekly insight' })).toBeDisabled();
        await expect(page.locator('.weekly-insight')).toContainText(
          'No email address is sent or saved',
        );
      } else await expect(page.locator('.weekly-insight')).toHaveCount(0);
      for (const href of await page
        .locator('main a[href]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')!))) {
        if (href.startsWith('/') && !href.startsWith('//')) links.add(href.split('#')[0]);
      }
    }
    for (const path of links) {
      const response = await request.get(path);
      expect(response.status(), path).toBeLessThan(400);
    }
    for (const path of ['/calculators/', income, '/data/us-income-distribution/']) {
      await page.goto(path);
      const a11y = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(a11y.violations).toEqual([]);
    }
  });

test('anonymous sharing stays inside the sandbox and calculator pages reject third-party tracking', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: 'ig_analytics', value: 'allow', domain: new URL(baseURL!).hostname, path: '/' },
    { name: 'ig_ga4', value: 'allow', domain: new URL(baseURL!).hostname, path: '/' },
    { name: 'ig_advertising', value: 'allow', domain: new URL(baseURL!).hostname, path: '/' },
  ]);
  const traffic: string[] = [];
  const messages: string[] = [];
  page.on('request', (request) => traffic.push(request.url() + (request.postData() ?? '')));
  await page.addInitScript(() => {
    (window as unknown as { auditMessages: unknown[] }).auditMessages = [];
    addEventListener('message', (event) =>
      (window as unknown as { auditMessages: unknown[] }).auditMessages.push(event.data),
    );
  });
  await page.goto(income);
  const frame = page.frameLocator('iframe.private-income-frame');
  await frame.getByLabel('Annual individual income').fill('137891.23');
  await frame.getByRole('button', { name: 'See where I stand' }).click();
  await frame.getByRole('button', { name: 'Share this insight', exact: true }).click();
  const text = frame.getByLabel('Review or edit your anonymous insight');
  await expect(text).toBeVisible();
  const shared = await text.inputValue();
  expect(shared).toContain('$100,000');
  expect(shared).toContain('83.32–91.91%');
  expect(shared).toContain('https://insightginie.com' + income);
  expect(shared).not.toMatch(/137[,.]?891|89\.8/);
  await frame.getByRole('button', { name: 'Copy insight', exact: true }).click();
  await expect(frame.getByRole('status')).toContainText(/Insight copied|Text selected/);
  messages.push(
    await page.evaluate(() =>
      JSON.stringify((window as unknown as { auditMessages: unknown[] }).auditMessages),
    ),
  );
  expect(traffic.join('\n') + messages.join('\n')).not.toMatch(/137[,.]?891|83\.32|91\.91/);
  await expect(page.locator('#insightginie-adsense,#insightginie-ga4')).toHaveCount(0);
  expect(
    traffic.some((url) =>
      /googlesyndication|google-analytics|googletagmanager|doubleclick/.test(url),
    ),
  ).toBe(false);
  for (const tool of FINANCE_TOOLS) {
    await page.goto(`/tools/${tool.id}/`);
    await expect(page.locator('#insightginie-adsense,#insightginie-ga4')).toHaveCount(0);
  }
});

test('duplicate hubs redirect permanently and sitemap contains only clean canonical pages', async ({
  request,
}) => {
  for (const path of ['/tools/', '/calc/']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers().location).toMatch(/\/calculators\/$/);
  }
  const response = await request.get('/sitemap.xml');
  const xml = await response.text();
  expect(xml).toContain('<loc>https://insightginie.com/calculators/</loc>');
  expect(xml).toContain('<loc>https://insightginie.com' + income + '</loc>');
  expect(xml).toContain('<loc>https://insightginie.com/data/us-income-distribution/</loc>');
  expect(xml).not.toMatch(/<loc>[^<]*[?]|<loc>https:\/\/insightginie.com\/(?:tools|calc)\/<\/loc>/);
});
