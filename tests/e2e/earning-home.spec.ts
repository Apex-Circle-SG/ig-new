import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('**/pagead/js/adsbygoogle.js*', (r) =>
    r.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.route('**/gtag/js*', (r) =>
    r.fulfill({ contentType: 'application/javascript', body: '' }),
  );
});
test('earning homepage presents usable routes on mobile and desktop', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /Find your next\s*way to earn\./,
    );
    await expect(page.getByRole('link', { name: 'Find remote work', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `artifacts/earning-home-${width}.png`, fullPage: true });
  }
  await page.getByRole('link', { name: 'Get paid for your perspective', exact: false }).click();
  await expect(page).toHaveURL(/\/earn\/paid-research\//);
});
test('homepage routes work without JavaScript and image endpoints reject arbitrary content', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route(/googlesyndication|doubleclick|googletagmanager|google-analytics/, (r) =>
    r.abort(),
  );
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Advertising preferences' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Find remote work', exact: true }).click();
  await expect(page).toHaveURL(/\/opportunities\//);
  await context.close();
  for (const path of [
    '/api/social-card/unknown/test/',
    '/api/social-card/method/nonexistent/',
    '/api/social-card/discovery/nonexistent/',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  }
});
test('reviewed earning and discovery images render as bounded PNGs', async ({ request }) => {
  for (const path of [
    '/api/social-card/method/website-user-testing/',
    '/api/social-card/discovery/think-out-loud/',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect(response.headers()['x-robots-tag']).toContain('noimageindex');
    const png = await response.body();
    expect(png.length).toBeLessThan(4_000_000);
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(1200);
  }
  const response = await request.get('/api/social-card/job/missing-role/');
  expect(response.status()).toBe(404);
});
