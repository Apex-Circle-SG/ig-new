import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';
const base = process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000';
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  await mkdir('artifacts/lighthouse', { recursive: true });
  const summaries = [];
  for (const [name, path] of [
    ['homepage', '/'],
    ['income-calculator', '/calc/individual-income-percentile/'],
  ]) {
    const result = await lighthouse(base + path, {
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      output: ['json', 'html'],
      logLevel: 'error',
    });
    if (!result) throw new Error('Lighthouse returned no report');
    await writeFile(`artifacts/lighthouse/${name}.json`, result.report[0]);
    await writeFile(`artifacts/lighthouse/${name}.html`, result.report[1]);
    const { lhr } = result;
    const summary = {
      name,
      url: lhr.finalDisplayedUrl,
      fetchedAt: lhr.fetchTime,
      mode: 'mobile simulated',
      scores: Object.fromEntries(
        Object.entries(lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)]),
      ),
      metrics: {
        lcpMs: lhr.audits['largest-contentful-paint'].numericValue,
        tbtMs: lhr.audits['total-blocking-time'].numericValue,
        cls: lhr.audits['cumulative-layout-shift'].numericValue,
      },
      failedAudits: Object.entries(lhr.audits)
        .filter(
          ([, audit]) =>
            audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === 'binary',
        )
        .map(([id, audit]) => ({ id, title: audit.title })),
    };
    summaries.push(summary);
    console.log(JSON.stringify(summary));
  }
  await writeFile(
    'docs/verification/lighthouse-summary.json',
    JSON.stringify(summaries, null, 2) + '\n',
  );
} finally {
  await chrome.kill();
}
