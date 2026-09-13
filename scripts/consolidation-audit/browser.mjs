import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const output = process.env.AUDIT_OUTPUT ?? 'docs/audits/2026-09-13-consolidation';
const paths = ['/', '/calc/', '/calc/individual-income-percentile/', '/data/', '/data/census-cps/', '/data/us-income-distribution/', '/methodology/', '/methodology/individual-income/', '/about/', '/editorial-policy/', '/privacy/', '/terms/', '/contact/'];
const targets = [
  ...paths.map((path) => ({ url: `https://insightginie.com${path}`, kind: 'main-public', width: 390 })),
  { url: 'https://insightginie.com/', kind: 'main-desktop', width: 1280 },
  { url: 'https://insightginie.com/calc/individual-income-percentile/', kind: 'main-narrow', width: 320 },
  ...['/', '/how-does-ai-work-dougdoug-style-systems-explained/', '/about/', '/contact/', '/editorial-policy/', '/privacy-policy/', '/page/2/', '/?s=income'].map((path) => ({ url: `https://blog.insightginie.com${path}`, kind: 'blog-template-sample', width: 390 })),
];
const browser = await chromium.launch({ headless: true });
const records = [];
const hash = (text) => createHash('sha256').update(text).digest('hex');
try {
  await mkdir(output, { recursive: true });
  for (const target of targets) {
    const context = await browser.newContext({ viewport: { width: target.width, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    const blocked = new Set();
    page.on('pageerror', (error) => errors.push(error.message.slice(0, 300)));
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (/googlesyndication|doubleclick|google-analytics|googletagmanager|googletagservices|cloudflareinsights/.test(url.hostname) || url.pathname === '/api/events/') {
        blocked.add(url.hostname + url.pathname);
        return route.abort();
      }
      return route.continue();
    });
    const record = { ...target, measuredAt: new Date().toISOString(), errors, status: null };
    try {
      const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      record.status = response?.status();
      const source = (await response?.text()) ?? '';
      await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(400);
      const sourceMetadata = await page.evaluate((html) => {
        const d = new DOMParser().parseFromString(html, 'text/html');
        return { title: d.title, canonical: d.querySelector('link[rel="canonical"]')?.getAttribute('href'), h1: [...d.querySelectorAll('h1')].map((e) => e.textContent.trim()), images: d.images.length, text: (d.querySelector('main') ?? d.body).textContent.replace(/\s+/g, ' ').trim() };
      }, source);
      record.rendered = await page.evaluate(() => ({
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        h1: [...document.querySelectorAll('h1')].map((e) => e.textContent.trim()),
        language: document.documentElement.lang,
        overflow: document.documentElement.scrollWidth > innerWidth,
        wordCount: (document.querySelector('main') ?? document.body).innerText.trim().split(/\s+/).length,
        text: (document.querySelector('main') ?? document.body).innerText.replace(/\s+/g, ' ').trim(),
        images: [...document.images].map((img) => ({ src: img.currentSrc || img.src, alt: img.getAttribute('alt'), width: img.width, height: img.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, complete: img.complete })),
      }));
      record.sourceVersusRendered = {
        titleChanged: sourceMetadata.title !== record.rendered.title,
        canonicalChanged: sourceMetadata.canonical !== record.rendered.canonical,
        h1Changed: JSON.stringify(sourceMetadata.h1) !== JSON.stringify(record.rendered.h1),
        imageCountChanged: sourceMetadata.images !== record.rendered.images.length,
        sourceTextHash: hash(sourceMetadata.text),
        renderedTextHash: hash(record.rendered.text),
        note: 'Source textContent and visible innerText differ in hidden elements and scripts; differing hashes alone do not prove cloaking.',
      };
      delete record.rendered.text;
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      record.accessibility = { violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, description: v.description, helpUrl: v.helpUrl, nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })) })), incomplete: axe.incomplete.map((v) => v.id), passedRules: axe.passes.length, note: 'Automated findings are not a WCAG conformance certification.' };
      if (target.url === 'https://blog.insightginie.com/' || target.kind === 'main-desktop') {
        record.screenshot = `${target.kind}-${target.width}.png`;
        await page.screenshot({ path: `${output}/${record.screenshot}`, fullPage: true });
      }
    } catch (error) { record.error = error.message.slice(0, 500); }
    record.blockedTelemetryAndAdRequests = [...blocked];
    records.push(record);
    await writeFile(`${output}/browser-audit.json`, JSON.stringify({ coverage: 'All 13 approved main pages plus explicitly listed viewport/blog-template samples; not every blog URL.', adPolicy: 'Ad/analytics requests blocked during automated crawling to avoid generating impressions or analytics events.', records }, null, 2) + '\n');
    console.log(JSON.stringify({ url: target.url, status: record.status, violations: record.accessibility?.violations.length, error: record.error }));
    await context.close();
  }
} finally { await browser.close(); }
