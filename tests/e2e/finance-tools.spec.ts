import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const scenarios = [
  { id: 'ai-workflow-roi', title: 'AI workflow ROI calculator', example: '$850' },
  { id: 'cash-runway', title: 'Cash runway calculator', example: '8.5 months' },
  { id: 'break-even', title: 'Break-even calculator', example: '167' },
  { id: 'business-loan', title: 'Business loan payment calculator', example: '$2,027.64' },
  { id: 'drawdown-recovery', title: 'Drawdown recovery calculator', example: '42.86%' },
  { id: 'portfolio-concentration', title: 'Portfolio concentration calculator', example: '50%' },
];
test.use({ extraHTTPHeaders: { 'cf-ipcountry': 'US' } });
test.beforeEach(async ({ page }) => {
  await page.route('**/pagead/js/adsbygoogle.js?*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: 'window.__adTestLoaded=true;' }),
  );
});
for (const scenario of scenarios)
  test(`${scenario.title} calculates inside the private boundary`, async ({ page }) => {
    await page.goto(`/tools/${scenario.id}/`);
    await expect(page.getByRole('heading', { level: 1, name: scenario.title })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://insightginie.com/tools/${scenario.id}/`,
    );
    const tool = page.frameLocator('iframe[data-private-finance]');
    await expect(tool.getByRole('button', { name: 'Calculate scenario' })).toBeEnabled();
    await tool.getByRole('button', { name: 'Calculate scenario' }).click();
    await expect(tool.locator('.finance-primary-result')).toContainText(scenario.example);
    expect(
      await page
        .locator('iframe[data-private-finance]')
        .evaluate((element) => (element as HTMLIFrameElement).contentDocument),
    ).toBeNull();
    await expect(tool.locator('#insightginie-adsense')).toHaveCount(0);
    const first = tool.locator('input,textarea').first();
    await first.fill('not a number');
    await tool.getByRole('button', { name: 'Calculate scenario' }).click();
    await expect(tool.getByRole('alert')).toBeVisible();
    await expect(first).toHaveAttribute('aria-invalid', 'true');
  });

test('private results export locally without entering parent requests or share links', async ({
  page,
  context,
  request,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/business-loan/');
  const tool = page.frameLocator('iframe[data-private-finance]');
  await expect(tool.getByLabel('Loan principal')).toBeEnabled();
  const traffic: string[] = [];
  page.on('request', (request) => traffic.push(request.url() + (request.postData() ?? '')));
  await tool.getByLabel('Loan principal').fill('123456.78');
  await tool.getByLabel('Annual interest rate').fill('0');
  await tool.getByLabel('Loan term').fill('12');
  await tool.getByRole('button', { name: 'Calculate scenario' }).click();
  await expect(tool.locator('.finance-primary-result')).toContainText('$10,288.07');
  await expect(page.locator('body')).not.toContainText('123,456.78');
  expect(traffic.join('\n')).not.toContain('123456');
  const downloading = page.waitForEvent('download');
  await tool.getByRole('button', { name: 'Download scenario CSV' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('insightginie-business-loan.csv');
  expect(await readFile((await download.path())!, 'utf8')).toContain('123456.78');
  await page.getByRole('button', { name: 'Copy tool link' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'https://insightginie.com/tools/business-loan/',
  );
  const privateResponse = await request.get('/private-tools/business-loan/');
  expect(privateResponse.headers()['content-security-policy']).toContain("connect-src 'none'");
  expect(privateResponse.headers()['content-security-policy']).not.toContain('allow-same-origin');
  expect(privateResponse.headers()['x-robots-tag']).toContain('noindex');
  expect((await request.get('/private-tools/not-a-tool/')).status()).toBe(404);
});

test('tool hub and mobile cash runway stay accessible and fit the viewport', async ({ page }) => {
  await page.goto('/tools/');
  for (const scenario of scenarios)
    await expect(page.getByRole('heading', { name: scenario.title, exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/tools/cash-runway/');
  const tool = page.frameLocator('iframe[data-private-finance]');
  await expect(tool.getByRole('button', { name: 'Calculate scenario' })).toBeEnabled();
  await tool.getByText('View the calculation table').click();
  const burnValue = tool
    .locator('.finance-result-rows > div')
    .filter({ hasText: 'Net monthly cash burn' })
    .locator('dd');
  expect(
    await burnValue.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set(Array.from(range.getClientRects(), (rect) => Math.round(rect.top))).size;
    }),
  ).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const frame = page.frames().find((frame) => frame.url().includes('/private-tools/'))!;
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('loan comparison keeps both scenarios private, exports deliberately and clears on reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/tools/business-loan/');
  const tool = page.frameLocator('iframe[data-private-finance]');
  await expect(tool.getByLabel('Loan principal')).toBeEnabled();
  const traffic: string[] = [];
  page.on('request', (request) => traffic.push(request.url() + (request.postData() ?? '')));
  await tool.getByLabel('Loan principal').fill('12000');
  await tool.getByLabel('Annual interest rate').fill('0');
  await tool.getByLabel('Loan term').fill('12');
  await tool.getByLabel('Fee paid upfront').fill('100');
  await tool.getByRole('button', { name: 'Calculate scenario' }).click();
  await tool.getByRole('button', { name: 'Keep as comparison', exact: true }).click();
  await tool.getByLabel('Loan term').fill('24');
  await tool.getByLabel('Fee paid upfront').fill('250');
  await expect(tool.getByRole('button', { name: 'Replace kept comparison' })).toBeDisabled();
  await expect(tool.getByRole('button', { name: 'Download comparison CSV' })).toBeDisabled();
  await tool.getByRole('button', { name: 'Calculate scenario' }).click();
  const comparison = tool.getByRole('region', { name: 'Loan scenario comparison', exact: true });
  await expect(
    comparison.getByRole('row', { name: 'Scheduled monthly principal + interest', exact: false }),
  ).toContainText('$1,000.00$500.00-$500.00');
  await expect(
    comparison.getByRole('row', { name: 'Total borrowing cost including fee', exact: false }),
  ).toContainText('$100.00$250.00+$150.00');
  await expect(
    comparison.getByRole('row', { name: 'Payoff time with extra payments', exact: false }),
  ).toContainText('12 months24 months+12 months');
  const inputs = tool.getByRole('region', { name: 'Inputs for both loan scenarios', exact: true });
  await expect(inputs.getByRole('row', { name: 'Loan term', exact: false })).toContainText(
    '12 months24 months',
  );
  await tool.getByText('Compare amortization by month', { exact: true }).click();
  const amortization = tool.getByRole('region', {
    name: 'Payment and remaining balance by month',
    exact: true,
  });
  await expect(amortization.locator('tbody tr').nth(12)).toContainText(
    '13$0.00$500.00$0.00$5,500.00',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const frame = page.frames().find((frame) => frame.url().includes('/private-tools/'))!;
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('body')).not.toContainText('12,000.00');
  expect(traffic.join('\n')).not.toContain('12000');
  expect(
    await page
      .locator('iframe[data-private-finance]')
      .evaluate((element) => (element as HTMLIFrameElement).contentDocument),
  ).toBeNull();
  const downloading = page.waitForEvent('download');
  await tool.getByRole('button', { name: 'Download comparison CSV' }).click();
  const csv = await readFile((await (await downloading).path())!, 'utf8');
  expect(csv).toContain('"Inputs","Kept scenario","Current scenario","Unit"');
  expect(csv).toContain('"Loan term","12","24","months"');
  expect(csv).toContain('"Total borrowing cost including fee","100","250","150","currency"');
  expect(csv).toContain('Kept scenario: monthly amortization schedule');
  expect(csv).toContain('Current scenario: Monthly amortization schedule');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await tool.getByRole('button', { name: 'Clear comparison', exact: true }).click();
  await expect(tool.getByRole('heading', { name: 'Compare loan scenarios.' })).toHaveCount(0);
  await tool.getByRole('button', { name: 'Keep as comparison', exact: true }).click();
  await page.reload();
  await expect(tool.getByRole('button', { name: 'Keep as comparison', exact: true })).toBeEnabled();
  await expect(tool.getByRole('heading', { name: 'Compare loan scenarios.' })).toHaveCount(0);
});
