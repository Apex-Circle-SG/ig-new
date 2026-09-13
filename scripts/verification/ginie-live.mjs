/** Read-only browser verification plus two synthetic Ask submissions; no trace/cookies persisted. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.VERIFY_BASE_URL ?? 'https://insightginie.com';
if (!['https://insightginie.com', 'http://127.0.0.1:3011'].includes(base))
  throw new Error('Unapproved verification origin');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const outboundHosts = new Set();
  page.on('request', (request) => outboundHosts.add(new URL(request.url()).hostname));
  const response = await page.goto(`${base}/ask/`);
  assert.equal(response.status(), 200);
  const html = await response.text();
  assert.match(await page.title(), /Ask Ginie/);
  assert.doesNotMatch(html, /rocket-loader\.min\.js|text\/rocketscript/);
  assert.match(response.headers()['cache-control'] ?? '', /no-transform/);
  await page.getByLabel('Your question', { exact: true }).fill('How do I calculate cash runway?');
  const answerResponse = page.waitForResponse(
    (result) => result.url() === `${base}/api/ask/` && result.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
  const providerResponse = await answerResponse;
  assert.equal(providerResponse.status(), 200);
  const answer = await providerResponse.json();
  assert.equal(answer.provider.id, 'datadog');
  assert.equal(answer.method, 'datadog-grounded-selection');
  assert.ok(answer.citations.some((source) => source.path === '/tools/cash-runway/'));
  await page.getByTestId('answer-provider').last().waitFor();
  assert.match(await page.getByTestId('answer-provider').last().textContent(), /Datadog/);
  await page.setViewportSize({ width: 390, height: 850 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mkdir('artifacts/ginie-live', { recursive: true });
  await page.screenshot({ path: 'artifacts/ginie-live/ask-mobile.png', fullPage: true });
  await page.getByLabel('Your question', { exact: true }).fill('What gain recovers a 50% loss?');
  const calculationResponse = page.waitForResponse(
    (result) => result.url() === `${base}/api/ask/` && result.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Ask Ginie', exact: true }).click();
  const calculated = await (await calculationResponse).json();
  assert.equal(calculated.method, 'deterministic-calculator');
  assert.equal(calculated.provider.id, 'local');
  assert.match(calculated.message, /100%/);
  assert.ok(
    ![...outboundHosts].some((host) => /datadog|anthropic|openai|googlesyndication/.test(host)),
  );
  const receipt = {
    checkedAt: new Date().toISOString(),
    status: 'passed',
    base,
    checks: {
      httpsOrLoopbackPage: true,
      ginieName: true,
      datadogAnswer: true,
      sourceCitations: true,
      deterministicCalculator: true,
      mobileOverflow: false,
      noBrowserProviderOrAdRequests: true,
      cloudflareTransformationGuard: true,
    },
    provider: answer.provider,
    method: answer.method,
    browserHosts: [...outboundHosts].sort(),
    syntheticQuestionsOnly: true,
    credentialsOrCookiesRecorded: false,
  };
  await writeFile(
    'docs/verification/ginie-live-browser.json',
    JSON.stringify(receipt, null, 2) + '\n',
  );
  console.log(JSON.stringify(receipt));
} finally {
  await browser.close();
}
