import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('**/pagead/js/adsbygoogle.js*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
});

test('insights hub searches the preserved preview and query results stay noindex', async ({
  page,
}) => {
  await page.goto('/insights/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Understand the numbers.');
  await expect(page.getByText('2 of 9,071 inventoried posts', { exact: false })).toBeVisible();
  await page.getByLabel('Search article previews').fill('quantitative trading');
  await page.getByRole('button', { name: 'Find articles' }).click();
  await expect(page).toHaveURL(/q=quantitative/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(
    page.getByRole('heading', { name: /How to Get Into Quantitative Trading/ }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /Connecting OpenClaw/ })).toHaveCount(0);
});

test('insights topic hubs link accessible decision sections to implemented tools', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/insights/');
  const topics = page.getByRole('navigation', { name: 'Insight topics' });
  for (const topic of [
    { name: 'AI economics', id: 'ai-economics', tools: ['ai-workflow-roi'] },
    {
      name: 'Founder finance',
      id: 'founder-finance',
      tools: ['cash-runway', 'break-even', 'business-loan'],
    },
    {
      name: 'Quantitative risk',
      id: 'quantitative-risk',
      tools: ['drawdown-recovery', 'portfolio-concentration'],
    },
  ]) {
    const anchor = topics.getByRole('link', { name: topic.name, exact: true });
    await expect(anchor).toHaveAttribute('href', `#${topic.id}`);
    await anchor.click();
    await expect(page).toHaveURL(new RegExp(`/insights/#${topic.id}$`));
    const section = page.getByRole('region', { name: topic.name, exact: true });
    await expect(section.getByRole('heading', { name: topic.name, level: 3 })).toBeVisible();
    for (const tool of topic.tools)
      await expect(section.locator(`a[href="/tools/${tool}/"]`)).toBeVisible();
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://insightginie.com/insights/',
  );
  await expect(page.locator('main a[href*="/briefs/"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const article of [
  {
    slug: 'connecting-openclaw-to-qq-a-guide-to-the-onebot-adapter-skill',
    title: 'Connecting OpenClaw to QQ',
    publishedAt: '2026-03-17T12:00:31.000Z',
    snippet: 'OneBot',
  },
  {
    slug: 'how-to-get-into-quantitative-trading-a-career-guide',
    title: 'How to Get Into Quantitative Trading',
    publishedAt: '2026-05-25T20:01:17.000Z',
    snippet: 'quantitative',
  },
]) {
  test(`migration preview preserves ${article.slug}`, async ({ page }) => {
    await page.goto(`/insights/${article.slug}/`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://blog.insightginie.com/${article.slug}/`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(article.title);
    await expect(page.getByLabel('Publication status')).toBeVisible();
    await expect(page.getByText('By Insight Ginie Editorial Team', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Preserved article content')).toContainText(article.snippet);
    await expect(page.locator('time').first()).toHaveAttribute('datetime', article.publishedAt);
    await expect(
      page.getByRole('link', { name: 'Read the original publication →' }),
    ).toHaveAttribute('href', `https://blog.insightginie.com/${article.slug}/`);
    expect(await page.locator('figure img').count()).toBeGreaterThan(0);
    const unsafe = await page
      .getByLabel('Preserved article content')
      .locator('script, iframe, form, [onclick], [onerror], [style]')
      .count();
    expect(unsafe).toBe(0);
  });
}

test('public RSS excludes migration previews and draft article bodies', async ({ request }) => {
  const response = await request.get('/feed.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).toContain('<rss');
  expect(xml).not.toContain('connecting-openclaw-to-qq-a-guide-to-the-onebot-adapter-skill');
  expect(xml).not.toContain('how-to-get-into-quantitative-trading-a-career-guide');
  expect(xml).not.toContain('migration-preview');
});

for (const width of [320, 390, 768]) {
  test(`research data table and sources remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/research/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Research starts with');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByRole('row')).toHaveCount(9);
    await expect(page.getByRole('link', { name: 'Download the derived CSV' })).toHaveAttribute(
      'href',
      '/data/us-income-distribution.csv',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390) {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
      const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(
        schema.map((value) => JSON.parse(value)).some((value) => value['@type'] === 'Dataset'),
      ).toBe(true);
    }
  });
}
