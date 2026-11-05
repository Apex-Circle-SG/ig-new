import { expect, test } from '@playwright/test';

test('expanded calculators run in an isolated frame', async ({ page }) => {
  await page.goto('/calculators/expanded/');
  const iframe = page.locator('iframe[title="Private finance calculators"]');
  await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-forms');
  const frame = page.frameLocator('iframe[title="Private finance calculators"]');
  await expect(frame.getByRole('heading', { name: 'Salary to hourly', exact: true })).toBeVisible();
  await expect(frame.locator('body')).toHaveCSS('margin-left', '0px');
  await expect(frame.getByRole('heading', { name: 'All calculators — 88 free tools' })).toHaveCSS('font-family', /Arial/);
  await frame.getByRole('searchbox').fill('Salary to hourly');
  await expect(frame.getByText('Showing 1 of 88 calculators.')).toBeVisible();
});
