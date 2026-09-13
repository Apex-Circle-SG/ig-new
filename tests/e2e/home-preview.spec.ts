import { test, expect } from '@playwright/test';

test.use({ extraHTTPHeaders: { 'cf-ipcountry': 'US' } });

test('homepage shows a public example and loads the private calculator only on request', async ({
  page,
}) => {
  const calculatorRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/tools/income/')
      calculatorRequests.push(request.url());
  });
  await page.route('**/pagead/js/adsbygoogle.js?*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: 'window.__adTestLoaded = true;' }),
  );

  await page.goto('/');
  await expect(page.locator('#insightginie-adsense')).toHaveCount(1);
  await expect(page.locator('.public-income-preview')).toContainText('$75,000');
  await expect(page.locator('.public-income-preview')).toContainText('74.7%');
  await expect(page.locator('.public-income-preview')).toContainText('2024 income');
  await expect(page.locator('iframe.private-income-frame')).toHaveCount(0);
  expect(calculatorRequests).toEqual([]);

  await page.getByRole('button', { name: 'Try your income', exact: true }).click();
  const tool = page.frameLocator('iframe.private-income-frame');
  await expect(tool.getByLabel('Annual individual income')).toBeEnabled();
  await tool.getByLabel('Annual individual income').fill('137891.23');
  await tool.getByRole('button', { name: 'Reveal my insight' }).click();
  await expect(tool.locator('.result-primary h2')).toContainText('$137,891.23');
  await expect(page.locator('.public-income-preview')).toHaveCount(0);
  expect(await page.locator('body').textContent()).not.toContain('137,891');
  expect(
    await page
      .locator('iframe.private-income-frame')
      .evaluate((element) => (element as HTMLIFrameElement).contentDocument),
  ).toBeNull();
  expect(calculatorRequests).toHaveLength(1);
});
