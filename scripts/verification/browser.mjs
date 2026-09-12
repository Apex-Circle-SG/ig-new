import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
try {
  await mkdir('docs/verification', { recursive: true });
  const evidence = [];
  for (const [name, width, height, path] of [
    ['home-desktop', 1440, 1050, '/'],
    ['calculator-desktop', 1440, 1050, '/calc/individual-income-percentile/'],
    ['home-mobile', 390, 844, '/'],
    ['calculator-mobile', 390, 844, '/calc/individual-income-percentile/'],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:3000' + path);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `docs/verification/${name}.png`, fullPage: true });
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    evidence.push({ name, path, width, ...dimensions, errors });
    await page.close();
  }
  await writeFile(
    'docs/verification/browser-summary.json',
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(JSON.stringify(evidence));
} finally {
  await browser.close();
}
