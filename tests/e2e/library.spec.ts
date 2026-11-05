import { expect, test } from '@playwright/test';

test('knowledge and tools can be browsed together', async ({ page }) => {
  await page.goto('/library/');
  await page.getByRole('button', { name: 'Technology', exact: true }).click();
  await page.getByRole('button', { name: 'Databases and data', exact: true }).click();
  await page.getByRole('link', { name: /SQL: queries, joins and transactions/ }).click();
  await expect(page.getByRole('heading', { name: 'SQL: queries, joins and transactions' })).toBeVisible();
  await page.getByRole('link', { name: 'Explore Data tools' }).click();
  await expect(page.getByRole('button', { name: 'Data', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Redis', { exact: true }).first()).toBeVisible();
});
