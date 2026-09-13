/** One synthetic public general question, with no trace, response body or cookies saved. */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = 'https://insightginie.com';
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const hosts = new Set();
  let pageErrors = 0;
  page.on('request', (request) => hosts.add(new URL(request.url()).hostname));
  page.on('pageerror', () => pageErrors++);
  const response = await page.goto(`${base}/ask/`);
  assert.equal(response.status(), 200);
  await page.locator('[id$="-general-disclosure"]').waitFor();
  assert.match(await page.locator('main').innerText(), /Ask about any topic/);
  await page.getByLabel('Your question', { exact: true }).fill('Why is the sky blue?');
  const pending = page.waitForResponse(
    (result) => result.url() === `${base}/api/ask/` && result.request().method() === 'POST',
  );
  const started = Date.now();
  await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
  const api = await pending;
  assert.equal(api.status(), 200);
  const answer = await api.json();
  assert.equal(answer.mode, 'answer');
  assert.equal(answer.method, 'datadog-general-answer');
  assert.equal(answer.provider?.id, 'datadog');
  assert.equal(answer.provider?.status, 'live');
  assert.equal(answer.citations.length, 0);
  assert.ok(/scatter/i.test(answer.message) && /blue/i.test(answer.message));
  const elapsedMs = Date.now() - started;
  await page.getByRole('heading', { name: 'General AI answer', exact: true }).waitFor();
  assert.equal(
    await page.getByTestId('answer-provider').last().innerText(),
    'Datadog · general answer',
  );
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  assert.equal(accessibility.violations.length, 0);
  assert.equal(pageErrors, 0);
  assert.ok(![...hosts].some((host) => /datadog|anthropic|openai|googlesyndication/.test(host)));
  const receipt = {
    checkedAt: new Date().toISOString(),
    status: 'passed',
    url: `${base}/ask/`,
    topic: 'Why the sky is blue',
    provider: answer.provider,
    method: answer.method,
    elapsedMs,
    generalGenerationEnabled: true,
    liveGeneralInferenceVerified: true,
    checks: {
      relevantAnswer: true,
      generalLabel: true,
      noInventedCitations: true,
      privacyDisclosure: true,
      mobileOverflow: false,
      axeViolations: 0,
      pageErrors,
      noBrowserProviderOrAdRequests: true,
    },
    browserHosts: [...hosts].sort(),
    credentialsOrResponseBodyRecorded: false,
  };
  await writeFile(
    'docs/verification/ginie-open-topic-live-browser.json',
    JSON.stringify(receipt, null, 2) + '\n',
  );
  console.log(JSON.stringify(receipt));
} finally {
  await browser.close();
}
