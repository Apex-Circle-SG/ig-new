import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ context, baseURL }, info) => {
  // Cloudflare owns these headers at the public edge; spoofing its client IP
  // there triggers Error1000 before the request reaches the application.
  if (baseURL?.startsWith('https://insightginie.com')) return;
  await context.setExtraHTTPHeaders({
    'cf-ipcountry': 'US',
    'cf-connecting-ip': `198.51.100.${100 + info.parallelIndex}`,
  });
});

test('Ginie returns cited explanations, deterministic arithmetic, refusals and fallbacks', async ({
  page,
}) => {
  const outbound: string[] = [];
  page.on('request', (request) => outbound.push(request.url()));
  await page.goto('/ask/');
  await expect(page.locator('#insightginie-adsense')).toHaveCount(0);
  for (const [question, expected] of [
    ['How do I calculate cash runway?', 'Sources & freshness'],
    ['What gain recovers a 50% loss?', 'gain of 100%'],
    ['Should I buy this stock?', 'General AI answers'],
    ['What are today mortgage rates?', 'do not have a validated live'],
  ]) {
    await page.getByLabel('Your question', { exact: true }).fill(question);
    await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
    await expect(page.getByLabel('Answers').locator('article').last()).toContainText(expected);
  }
  expect(outbound.some((url) => /datadog|anthropic|openai|googlesyndication/.test(url))).toBe(
    false,
  );
  await page.getByText('Report an answer', { exact: true }).click();
  await page.getByRole('button', { name: 'source issue', exact: true }).click();
  await expect(page.getByText(/Only the issue category was recorded/)).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('Ginie handles API failures and rejects cross-site or unbound submissions', async ({
  page,
  request,
  baseURL,
}) => {
  expect(
    (
      await request.post('/api/ask/', {
        data: { question: 'How does cash runway work?', token: 'a'.repeat(50) },
        headers: { Origin: 'https://untrusted.example' },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post('/api/ask/', {
        data: { question: 'How does cash runway work?', token: 'a'.repeat(50) },
        headers: { Origin: baseURL! },
      })
    ).status(),
  ).toBe(403);
  await page.route('**/api/ask/token/', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  );
  await page.goto('/ask/');
  await page.getByLabel('Your question', { exact: true }).fill('How does cash runway work?');
  await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Ginie is busy' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ask Ginie', exact: true })).toBeEnabled();
});

test('Ginie distinguishes Datadog selections, cached selections and local fallbacks', async ({
  page,
}) => {
  await page.goto('/ask/');
  for (const [provider, label] of [
    [{ id: 'datadog', status: 'live' }, 'Datadog · source selection'],
    [{ id: 'datadog', status: 'cached' }, 'Datadog · cached source selection'],
    [{ id: 'local', status: 'fallback' }, 'InsightGinie · local response'],
  ] as const) {
    await page.route('**/api/ask/', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'answer',
          message: 'Cash runway compares available cash with monthly net burn.',
          method:
            provider.id === 'datadog' ? 'datadog-grounded-selection' : 'approved-content-retrieval',
          provider,
          citations: [],
          followups: [],
          assumptions: [],
        }),
      }),
    );
    await page.getByLabel('Your question', { exact: true }).fill('How does cash runway work?');
    await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
    await expect(page.getByTestId('answer-provider').last()).toHaveText(label);
    await page.unroute('**/api/ask/');
  }
});

test('general answers are labelled honestly, escaped and counted without question text', async ({
  page,
}) => {
  const events: string[] = [];
  await page.route('**/api/events/', async (route) => {
    events.push(route.request().postData() ?? '');
    await route.fulfill({ status: 204 });
  });
  await page.route('**/api/ask/', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'answer',
        method: 'datadog-general-answer',
        provider: { id: 'datadog', status: 'live' },
        message: 'Shorter wavelengths scatter more strongly.\n\n<img src=x onerror="alert(1)">',
        citations: [],
        followups: [],
        assumptions: [],
      }),
    }),
  );
  await page.goto('/ask/');
  await page.getByRole('button', { name: 'Analytics settings' }).click();
  await page.getByRole('button', { name: 'Allow anonymous counts' }).click();
  await page.getByLabel('Your question', { exact: true }).fill('Why is the sky blue?');
  await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
  const answer = page.getByLabel('Answers').locator('article').last();
  await expect(answer.getByRole('heading', { name: 'General AI answer' })).toBeVisible();
  await expect(answer).toContainText('not been verified against published sources');
  await expect(answer).toContainText('<img src=x');
  await expect(answer.locator('img')).toHaveCount(0);
  await expect(answer.getByText('Sources & freshness')).toHaveCount(0);
  await expect(page.getByTestId('answer-provider').last()).toHaveText('Datadog · general answer');
  await expect.poll(() => events.some((body) => body.includes('ask_answer_generated'))).toBe(true);
  expect(events.join('')).not.toMatch(/sky blue|wavelength|ask_answer_cited/);
});

test('admin is protected and quality checks do not approve an incomplete migration', async ({
  browser,
  request,
  baseURL,
}) => {
  const denied = await request.get('/admin/');
  expect(denied.status()).toBe(401);
  expect(denied.headers()['x-robots-tag']).toContain('noindex');
  const context = await browser.newContext({
    baseURL,
    httpCredentials: {
      username: 'admin',
      password: process.env.ADMIN_ACCESS_KEY ?? 'test-only-admin-key-not-for-production-use',
    },
  });
  const page = await context.newPage();
  await page.goto('/admin/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('InsightGinie operations');
  await page.getByRole('button', { name: 'Run local quality checks' }).click();
  await expect(page.getByRole('status')).toContainText('"datasetValid": true');
  await expect(page.getByRole('status')).toContainText('"publicationAllowed": false');
  await expect(page.getByRole('button', { name: /Approve publication/ })).toBeDisabled();
  expect(await page.locator('script[src*="google"],script[src*="datadog"]').count()).toBe(0);
  await context.close();
});

test('usage counts wait for consent and contain no questions', async ({ page }) => {
  const bodies: string[] = [];
  await page.route('**/api/events/', async (route) => {
    bodies.push(route.request().postData() ?? '');
    await route.fulfill({ status: 204 });
  });
  await page.goto('/ask/');
  await expect(page.getByRole('button', { name: 'Analytics settings' })).toBeEnabled();
  expect(bodies).toEqual([]);
  await page.getByRole('button', { name: 'Analytics settings' }).click();
  await page.getByRole('button', { name: 'Allow anonymous counts' }).click();
  await expect.poll(() => bodies.length).toBeGreaterThan(0);
  await page.getByLabel('Your question', { exact: true }).fill('How does cash runway work?');
  await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
  await expect.poll(() => bodies.some((body) => body.includes('ask_answer_cited'))).toBe(true);
  expect(bodies.join('')).not.toContain('How does');
  await page.getByRole('button', { name: 'Decline anonymous counts' }).click();
  const count = bodies.length;
  await page.getByLabel('Your question', { exact: true }).fill('What is an AI payback period?');
  await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
  await expect(page.getByLabel('Answers').locator('article')).toHaveCount(2);
  expect(bodies).toHaveLength(count);
});

for (const width of [320, 375, 390, 430, 768])
  test(`Ginie is usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/ask/');
    await page.getByLabel('Your question', { exact: true }).fill('How does cash runway work?');
    await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
    await expect(page.getByLabel('Answers').locator('article')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
