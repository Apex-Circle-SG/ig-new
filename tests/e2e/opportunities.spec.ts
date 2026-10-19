import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('live roles can be filtered, inspected and saved locally', async ({ page }) => {
  await page.goto('/opportunities/');
  await expect(page.getByRole('heading', { name: /Find work/ })).toBeVisible();
  const source = page.getByRole('combobox', { name: 'Source', exact: true });
  await source.selectOption('jobicy');
  await page.getByRole('button', { name: 'Find opportunities →' }).click();
  await expect(page).toHaveURL(/source=jobicy/);
  const first = page.locator('article').first();
  await expect(first).toContainText('Jobicy');
  await first.getByRole('heading').getByRole('link').click();
  await expect(page.getByRole('heading', { name: 'Check before you apply' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View original on Jobicy ↗' })).toHaveAttribute(
    'href',
    /^https:\/\/jobicy.com\//,
  );
  await page.getByRole('button', { name: 'Save for later' }).click();
  await expect(page.getByRole('button', { name: 'Saved ✓' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('link', { name: 'Your saved roles' }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('article')).toHaveCount(1);
});

test('ideas are explicitly speculative and platforms are not presented as available tasks', async ({
  page,
}) => {
  await page.goto('/ideas/?category=Playful');
  await expect(page.getByText('Ideas, not paid listings.')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(10);
  await page.getByRole('link', { name: 'Pet personality reports', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your first experiment' })).toBeVisible();
  await expect(page.getByText(/No buyer or payment is committed/)).toBeVisible();
  await page.goto('/platforms/');
  await expect(page.getByText('A directory, not a live task feed.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prolific', exact: true })).toBeVisible();
});

test('opportunity discovery works without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/opportunities/');
  await expect(page.locator('article').first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption('arbeitnow');
  await page.getByRole('button', { name: 'Find opportunities →' }).click();
  await expect(page.locator('article').first()).toContainText('Arbeitnow');
  await context.close();
});

test('new discovery pages exclude ads and personal/filter pages exclude indexing', async ({
  request,
}) => {
  for (const path of ['/opportunities/', '/ideas/', '/platforms/', '/opportunities/sources/']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain(
      'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
    );
  }
  const filtered = await request.get('/opportunities/?q=python');
  expect(filtered.headers()['x-robots-tag']).toContain('noindex');
  const saved = await request.get('/opportunities/saved/');
  expect(await saved.text()).toMatch(/name="robots" content="noindex/);
  const missing = await request.get('/opportunities/jobicy-does-not-exist/');
  // Next may stream a not-found response after the layout; the metadata must exclude it.
  expect(await missing.text()).toMatch(/noindex/);
});

test('opportunity and idea pages fit mobile and meet basic accessibility checks', async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      '/opportunities/',
      '/ideas/?category=Playful',
      '/platforms/',
      '/opportunities/sources/',
    ]) {
      await page.goto(path);
      await expect(page.getByRole('button', { name: 'Analytics settings' })).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    }
    await page.goto('/opportunities/');
    await page.screenshot({ path: `artifacts/opportunities-${width}.png`, fullPage: true });
  }
});
