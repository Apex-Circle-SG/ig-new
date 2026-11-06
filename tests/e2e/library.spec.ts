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

test('finance collections and the formula reference expose corrections and original wording', async ({ page }) => {
  await page.goto('/library/');
  const knowledge = page.getByRole('region', { name: 'Knowledge', exact: true });
  await knowledge.getByRole('button', { name: 'Finance & Accounting', exact: true }).click();
  await expect(knowledge.getByText('8 collections', { exact: true })).toBeVisible();
  await knowledge.getByRole('combobox', { name: /Finance collection/ }).selectOption('financial-performance');
  await knowledge.getByRole('button', { name: 'Formula reference', exact: true }).click();
  await knowledge.getByRole('link', { name: /Accounting and finance formula reference/ }).click();
  const directory = page.getByRole('region', { name: 'Find a formula', exact: true });
  await expect(directory.getByText('Showing 24 of 135 source entries', { exact: true })).toBeVisible();
  await directory.getByRole('button', { name: 'Show more formulas', exact: true }).click();
  await expect(directory.getByText('Showing 48 of 135 source entries', { exact: true })).toBeVisible();
  await directory.getByRole('combobox', { name: /Review state/ }).selectOption('Needs clarification');
  await expect(directory.getByText('Showing 4 of 4 source entries', { exact: true })).toBeVisible();
  await directory.getByRole('combobox', { name: /Review state/ }).selectOption('All review states');
  await directory.getByRole('searchbox', { name: 'Search formulas', exact: true }).fill('Total asset turnover');
  await directory.locator('a[href$="/#formula-36"]').click();
  const formula = page.locator('#formula-36');
  await expect(formula.getByText('Net sales / average total assets', { exact: true })).toBeVisible();
  await formula.getByText('Original supplied wording', { exact: true }).click();
  await expect(formula.getByText('Total Asset Turnover = Net Sales - Average Total Assets', { exact: true })).toBeVisible();
});
