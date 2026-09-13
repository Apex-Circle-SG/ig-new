import { expect, test } from '@playwright/test';
import { PUBLIC_INDEXABLE_PATHS } from '@insightginie/seo';
import { FINANCE_TOOLS } from '@insightginie/calculators';

test('published pages serve unique metadata, valid schema and working internal links', async ({
  request,
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const origin = 'https://insightginie.com';
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const links = new Set<string>();
  const checked = new Map<string, number>();
  const evidence = [];
  const expectedSchema: Record<string, string[]> = {
    '/': ['WebSite'],
    '/calc/individual-income-percentile/': ['WebApplication', 'BreadcrumbList'],
    '/data/census-cps/': ['Dataset'],
    '/data/us-income-distribution/': ['Dataset'],
    '/research/': ['Dataset', 'BreadcrumbList'],
    '/ask/': ['BreadcrumbList'],
    '/authors/insightginie/': ['Organization'],
    ...Object.fromEntries(
      FINANCE_TOOLS.map((tool) => [`/tools/${tool.id}/`, ['WebApplication', 'BreadcrumbList']]),
    ),
  };

  // Parse fetched SSR HTML in an inert document: no ad impressions, source-site
  // image fetches, calculator interactions or artificial analytics events.
  for (const path of PUBLIC_INDEXABLE_PATHS) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), `${path} must be a successful canonical page`).toBe(200);
    checked.set(path, response.status());
    expect(response.headers()['x-robots-tag'] ?? '', path).not.toMatch(/noindex|none/i);
    expect(await response.text(), `${path} must retain executable CSP-nonced scripts`).not.toMatch(
      /rocket-loader\.min\.js|type="[a-f0-9]+-text\/javascript"/,
    );
    const facts = await page.evaluate(
      (html) => {
        const document = new DOMParser().parseFromString(html, 'text/html');
        return {
          title: document.title,
          description:
            document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
          canonicals: Array.from(document.querySelectorAll('link[rel="canonical"]')).map(
            (element) => element.getAttribute('href'),
          ),
          robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
          h1: Array.from(document.querySelectorAll('h1')).map((element) =>
            element.textContent?.trim(),
          ),
          mainText: document.querySelector('main')?.textContent?.trim().length ?? 0,
          links: Array.from(document.querySelectorAll('a[href]')).map(
            (element) => element.getAttribute('href') ?? '',
          ),
          schemas: Array.from(
            document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
          ).map((element) => ({
            text: element.textContent ?? '',
            nonce: element.nonce || element.getAttribute('nonce'),
          })),
        };
      },
      await response.text(),
    );
    expect(facts.title.length, `${path} title`).toBeGreaterThan(8);
    expect(facts.description.length, `${path} description`).toBeGreaterThan(35);
    expect(titles.has(facts.title), `${path} duplicates a title`).toBe(false);
    expect(descriptions.has(facts.description), `${path} duplicates a description`).toBe(false);
    titles.add(facts.title);
    descriptions.add(facts.description);
    expect(facts.canonicals, path).toEqual([`${origin}${path}`]);
    expect(facts.robots, path).not.toMatch(/noindex|none/i);
    expect(facts.h1, path).toHaveLength(1);
    expect(facts.h1[0]?.length ?? 0, path).toBeGreaterThan(3);
    expect(
      facts.mainText,
      `${path} must provide meaningful server-rendered content`,
    ).toBeGreaterThan(100);
    const nonce = response.headers()['content-security-policy']?.match(/'nonce-([^']+)'/)?.[1];
    const schemaTypes: string[] = [];
    for (const schema of facts.schemas) {
      expect(schema.nonce, `${path} JSON-LD nonce`).toBe(nonce);
      const decoded = JSON.parse(schema.text);
      for (const object of Array.isArray(decoded) ? decoded : [decoded]) {
        expect(object['@context'], `${path} schema context`).toBe('https://schema.org');
        schemaTypes.push(object['@type']);
        if (object['@type'] === 'WebApplication') expect(object.url).toBe(`${origin}${path}`);
      }
    }
    for (const type of expectedSchema[path] ?? [])
      expect(schemaTypes, `${path} schema`).toContain(type);
    for (const href of facts.links) {
      expect(href, `${path} unsafe link scheme`).not.toMatch(/^\s*(?:javascript|data):/i);
      const url = new URL(href, `${origin}${path}`);
      if (url.origin === origin) links.add(url.pathname);
    }
    evidence.push({
      path,
      status: response.status(),
      title: facts.title,
      canonical: facts.canonicals[0],
      schemas: schemaTypes,
      internalLinks: facts.links.length,
    });
  }

  expect(links.size).toBeLessThan(256);
  for (const path of links) {
    if (checked.has(path)) continue;
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), `Broken or noncanonical internal link: ${path}`).toBe(200);
    checked.set(path, response.status());
  }
  await testInfo.attach('technical-seo.json', {
    body: JSON.stringify({ checkedPages: evidence, internalDestinations: [...checked] }, null, 2),
    contentType: 'application/json',
  });
});

test('sitemap serves only reachable canonical pages and query/private pages stay excluded', async ({
  request,
  baseURL,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls.sort()).toEqual(
    PUBLIC_INDEXABLE_PATHS.map((path) => `https://insightginie.com${path}`).sort(),
  );
  expect(sitemap).not.toMatch(
    /private-tools|tools\/income|connecting-openclaw-to-qq|how-to-get-into-quantitative-trading/,
  );
  const index = await (await request.get('/sitemap-index.xml')).text();
  for (const group of ['tools', 'content', 'site'])
    expect(index).toContain(`https://insightginie.com/sitemaps/${group}.xml`);
  expect((await request.get('/sitemaps/unknown.xml')).status()).toBe(404);
  const privateTool = await request.get('/private-tools/cash-runway/');
  expect(privateTool.headers()['x-robots-tag']).toContain('noindex');
  const filtered = await request.get('/insights/?q=&category=');
  expect(await filtered.text()).toMatch(/name="robots" content="noindex/);
  const parameterized = await request.get('/tools/cash-runway/?filter=example');
  expect(parameterized.headers()['x-robots-tag']).toContain('noindex');
  const publicEdge = baseURL?.startsWith('https://insightginie.com');
  const hostAlias = await request.get(
    publicEdge ? 'https://www.insightginie.com/tools/cash-runway/' : '/tools/cash-runway/',
    { maxRedirects: 0, ...(publicEdge ? {} : { headers: { Host: 'www.insightginie.com' } }) },
  );
  // The configured Cloudflare alias uses301; the application's guard uses308.
  expect(publicEdge ? [301, 308] : [308]).toContain(hostAlias.status());
  expect(hostAlias.headers().location).toBe('https://insightginie.com/tools/cash-runway/');
});
