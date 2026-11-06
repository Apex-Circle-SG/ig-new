import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { DEAL_TOOLS } from '../../packages/calculators/src/deals/definitions';
test('all deal workspaces load on desktop and mobile, with private CSP and canonical discovery', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tool of DEAL_TOOLS) {
      await page.goto(tool.path);
      await expect(page.getByRole('heading', { name: tool.title, exact: true })).toBeVisible();
      const frame = page.frameLocator('iframe[data-private-finance]');
      await expect(frame.getByRole('heading', { name: tool.title, exact: true })).toBeVisible();
      await expect(page.locator('[data-finance-tool]')).toHaveAttribute('data-ready', 'true');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect(
        await frame.locator('body').evaluate((el) => el.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
      if (tool.kind === 'calculator')
        await frame.getByRole('button', { name: 'Calculate scenario', exact: true }).click();
      await expect(frame.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        'https://insightginie.com' + tool.path,
      );
    }
  }
  expect(errors).toEqual([]);
  const response = await request.get('/private-tools/lbo-recapitalization/');
  expect(response.headers()['content-security-policy']).toContain("connect-src 'none'");
  expect(response.headers()['content-security-policy']).not.toContain('allow-same-origin');
  expect(response.headers()['x-robots-tag']).toContain('noindex');
});
test('scenario export/import preserves private data and failed imports preserve the draft', async ({
  page,
}) => {
  await page.goto('/calculators/corporate-finance/acquisition-impact/');
  const frame = page.frameLocator('iframe[data-private-finance]');
  await expect(frame.getByLabel('Buyer fully diluted shares (M)')).toBeEnabled();
  const traffic: string[] = [];
  page.on('request', (r) => traffic.push(r.url() + (r.postData() ?? '')));
  await frame.getByLabel('Buyer fully diluted shares (M)').fill('123.456789');
  await frame.getByRole('button', { name: 'Calculate scenario', exact: true }).click();
  await frame.getByRole('button', { name: 'Pin current results', exact: false }).click();
  const event = page.waitForEvent('download');
  await frame.getByRole('button', { name: 'Export private scenario' }).click();
  const file = await event,
    text = await readFile((await file.path())!, 'utf8');
  expect(JSON.parse(text).inputs.buyerShares).toBe('123.456789');
  await frame.getByRole('button', { name: 'Reset example' }).click();
  await frame.getByLabel('Import scenario').setInputFiles({
    name: 'scenario.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  });
  await expect(frame.getByLabel('Buyer fully diluted shares (M)')).toHaveValue('123.456789');
  await frame.getByLabel('Import scenario').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });
  await expect(frame.getByRole('alert')).toBeVisible();
  await expect(frame.getByLabel('Buyer fully diluted shares (M)')).toHaveValue('123.456789');
  expect(traffic.join('\n')).not.toContain('123.456789');
  await expect(page.locator('body')).not.toContainText('123.456789');
});
test('historical observations and all planning dimensions are usable with complete exports', async ({
  page,
}) => {
  await page.goto('/calculators/markets/vwap-volume/');
  const frame = page.frameLocator('iframe[data-private-finance]');
  await frame.getByRole('button', { name: 'Load all 2,022 historical sample rows' }).click();
  await frame.getByRole('button', { name: 'Calculate scenario', exact: true }).click();
  await expect(frame.locator('.metrics')).toContainText('2,022');
  await expect(frame.locator('.metrics')).toContainText('43');
  await expect(frame.getByRole('alert')).toHaveCount(0);
  await page.goto('/calculators/corporate-finance/culture-comparison/');
  const culture = page.frameLocator('iframe[data-private-finance]');
  await expect(culture.getByText('0 of 46 pairs rated.', { exact: true })).toBeVisible();
  const group = culture
    .locator('details')
    .filter({ has: culture.locator('summary').filter({ hasText: 'Strategic Orientation' }) })
    .first();
  await group.locator('summary').click();
  await group
    .getByRole('combobox', { name: 'Organization A', exact: true })
    .first()
    .selectOption('1');
  await group
    .getByRole('combobox', { name: 'Organization B', exact: true })
    .first()
    .selectOption('5');
  await expect(culture.getByText('1 of 46 pairs rated.', { exact: true })).toBeVisible();
  await expect(
    group.getByText('Absolute perception gap: 4', { exact: true }).first(),
  ).toBeVisible();
  await page.goto('/calculators/corporate-finance/due-diligence/');
  const diligence = page.frameLocator('iframe[data-private-finance]');
  await diligence.getByLabel('Find a request').fill('Charter documents');
  await expect(diligence.getByText(/Showing 1 of 1/)).toBeVisible();
  const req = diligence
    .locator('details')
    .filter({ has: diligence.locator('summary').filter({ hasText: 'Charter documents' }) });
  await req.locator('summary').click();
  await req.getByRole('combobox', { name: 'Status', exact: true }).selectOption('Reviewed');
  await expect(req.locator('summary')).toContainText('Reviewed');
});
