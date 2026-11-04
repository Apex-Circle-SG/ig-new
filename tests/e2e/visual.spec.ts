import { test, expect } from '@playwright/test';

test('footer badge loads under the image security policy', async ({ page }) => {
  await page.route('https://toolindex.net/badges/listed-on-toolindex.svg', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="54" />' }),
  );
  await page.goto('/ask/');
  await expect(page.getByAltText('Listed on Tool Index')).toHaveJSProperty('naturalWidth', 200);
});

for (const width of [390, 1280]) {
  for (const route of ['ask', 'tools/cash-runway']) {
    test(`${route} visual regression at ${width}px`, async ({ page, context }) => {
      await context.setExtraHTTPHeaders({ 'cf-ipcountry': 'US' });
      await page.route('**/pagead/js/adsbygoogle.js*', (request) =>
        request.fulfill({ contentType: 'application/javascript', body: '' }),
      );
      await page.route('https://toolindex.net/badges/listed-on-toolindex.svg', (request) =>
        request.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="54" />' }),
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
        mask: [page.locator('img[alt="Listed on Tool Index"]')],
        maxDiffPixelRatio: 0.005,
      });
    });
  }
}
