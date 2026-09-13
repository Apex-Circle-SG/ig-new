import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  for (const route of ['ask', 'tools/cash-runway']) {
    test(`${route} visual regression at ${width}px`, async ({ page, context }) => {
      await context.setExtraHTTPHeaders({ 'cf-ipcountry': 'US' });
      await page.route('**/pagead/js/adsbygoogle.js*', (request) =>
        request.fulfill({ contentType: 'application/javascript', body: '' }),
      );
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${route}/`);
      await expect(page.getByRole('button', { name: 'Analytics settings' })).toBeEnabled();
      await page.evaluate(() => document.fonts.ready);
      if (route.startsWith('tools')) {
        await expect(page.locator('[data-finance-tool]')).toHaveAttribute('data-ready', 'true');
        const frame = page.frames().find((value) => value.url().includes('/private-tools/'))!;
        await frame.evaluate(() => document.fonts.ready);
      }
      await expect(page).toHaveScreenshot(`${route.replaceAll('/', '-')}-${width}.png`, {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.005,
      });
    });
  }
}
