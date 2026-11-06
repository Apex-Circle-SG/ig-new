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

test('business browsing starts with collections and keeps nested readings searchable', async ({ page }) => {
  await page.goto('/library/');
  const knowledge = page.getByRole('region', { name: 'Knowledge', exact: true });
  await knowledge.getByRole('button', { name: 'Business & Management', exact: true }).click();
  await expect(knowledge.getByText('7 collections', { exact: true })).toBeVisible();
  await expect(knowledge.locator('a[href^="/library/knowledge/"]')).toHaveCount(7);
  await expect(knowledge.locator('[aria-label="Filter knowledge by subtopic"]')).toHaveCount(0);

  await knowledge.getByRole('combobox', { name: /Business collection/ }).selectOption('brand-strategy');
  await knowledge.getByRole('button', { name: 'Architecture & growth', exact: true }).click();
  await expect(knowledge.locator('a[href^="/library/knowledge/"]')).toHaveCount(3);
  await knowledge.getByRole('combobox', { name: /Business collection/ }).selectOption('strategy-growth');
  await knowledge.getByRole('searchbox', { name: 'Search knowledge' }).fill('Nine situations and changing commitments');
  await knowledge.getByRole('link', { name: /The Art of War: Nine situations and changing commitments/ }).click();
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumb.getByRole('link', { name: 'Strategy & Growth', exact: true })).toBeVisible();
  await expect(breadcrumb.getByRole('link', { name: 'The Art of War: a guided reading collection', exact: true })).toBeVisible();
});
