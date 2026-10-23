import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route(/googlesyndication|google-analytics|googletagmanager|doubleclick/, (r) =>
    r.abort(),
  );
});
async function ask(page: import('@playwright/test').Page, question: string) {
  await page.getByLabel('Your question', { exact: true }).fill(question);
  await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
  const answer = page.getByLabel('Answers').locator('article').last();
  await expect(answer).toBeVisible();
  await expect(page.getByLabel('Your question', { exact: true })).toBeEnabled();
  return answer;
}
test('catalog search responds immediately and retains filters across follow-ups', async ({
  page,
}) => {
  await page.goto('/ask/');
  let answer = await ask(page, 'Find remote customer support jobs');
  await expect(answer).toContainText('InsightGinie · live catalog search');
  await expect(answer).toContainText('matching source-listed opportunities');
  await expect(answer.locator('section h4 a').first()).toHaveAttribute(
    'href',
    /^\/opportunities\/[a-z0-9_-]+\/$/,
  );
  answer = await ask(page, 'Only in Singapore');
  await expect(answer).toContainText('Listed location: Singapore');
  await expect(
    answer.getByRole('link', { name: 'Open the directory', exact: false }),
  ).toHaveAttribute('href', /q=customer\+support.*location=Singapore/);
  answer = await ask(page, 'What about contract roles?');
  await expect(
    answer.getByRole('link', { name: 'Open the directory', exact: false }),
  ).toHaveAttribute('href', /q=customer\+support.*location=Singapore.*arrangement=Contract/);
  await page.getByRole('button', { name: 'Start new chat' }).click();
  await expect(page.getByLabel('Answers').locator('article')).toHaveCount(0);
});
test('creative methods and unusual business ideas have real site links and honest labels', async ({
  page,
}) => {
  await page.goto('/ask/');
  let answer = await ask(page, 'Show me paid research opportunities');
  await expect(answer).toContainText('matching earning guides');
  await expect(answer.locator('section h4 a').first()).toHaveAttribute('href', /^\/earn\//);
  answer = await ask(page, 'Suggest funny business ideas');
  await expect(answer).toContainText('matching business experiments');
  await expect(answer.locator('section h4 a').first()).toHaveAttribute('href', /^\/ideas\//);
  await answer.getByText('How this answer was prepared').click();
  await expect(answer).toContainText('not proven businesses');
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 950 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
  await page.screenshot({ path: 'artifacts/ask-copilot-desktop.png', fullPage: true });
});
test('browser sends only bounded recent context and keeps chat off analytics and ads', async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route('**/api/ask/', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'answer',
        message: 'A short explanation.',
        method: 'datadog-general-answer',
        provider: { id: 'datadog', status: 'live' },
        citations: [],
        followups: [],
        assumptions: [],
      }),
    });
  });
  await page.goto('/ask/');
  for (const q of [
    'Explain JavaScript promises',
    'Give me a small example',
    'Explain that simply',
    'Try another example',
  ])
    await ask(page, q);
  expect(requests[0].history).toEqual([]);
  expect(requests[3].history as unknown[]).toHaveLength(2);
  expect(JSON.stringify(requests[3])).not.toContain('Explain JavaScript promises');
  await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
  await expect(page.locator('#insightginie-ga4')).toHaveCount(0);
});
