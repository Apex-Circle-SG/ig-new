import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canonicalUrl,
  discover,
  INDEXNOW_ENDPOINT,
  KEY_LOCATION,
  parseSitemap,
  robotsAllowed,
  SITE_ORIGIN,
  SITEMAP_URL,
  urlBatches,
} from './discovery.mjs';

const urls = [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/calc/individual-income-percentile/`];
const key = 'a'.repeat(32);
const sitemap = (entries) =>
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
const html = (url, meta = '') =>
  `<html><head>${meta}<link rel="canonical" href="${url}"></head><body><h1>Income comparison</h1></body></html>`;

function fixture(overrides = {}) {
  const requests = [];
  const resources = {
    [`${SITE_ORIGIN}/robots.txt`]: ['User-agent: *\nAllow: /\nDisallow: /me/'],
    [SITEMAP_URL]: [sitemap(urls), { headers: { 'Content-Type': 'application/xml' } }],
    [KEY_LOCATION]: [`${key}\n`],
    ...Object.fromEntries(
      urls.map((url) => [url, [html(url), { headers: { 'Content-Type': 'text/html' } }]]),
    ),
    ...overrides,
  };
  const fetcher = async (url, options) => {
    requests.push({ url, options });
    if (url === INDEXNOW_ENDPOINT) return new Response('', { status: 202 });
    if (url.startsWith('https://www.googleapis.com/')) return new Response(null, { status: 204 });
    if (url.startsWith('https://ssl.bing.com/')) return Response.json({ d: null });
    if (!resources[url]) throw new Error('Unexpected request');
    return new Response(...resources[url]);
  };
  return { fetcher, requests };
}

test('rejects off-host, query, profile and noncanonical URLs before requesting them', () => {
  for (const value of [
    'https://evil.example/',
    'https://insightginie.com.evil.example/',
    `${SITE_ORIGIN}/?income=75000`,
    `${SITE_ORIGIN}/#income`,
    `${SITE_ORIGIN}/me/profile/`,
    `${SITE_ORIGIN}/%6de/profile/`,
    `${SITE_ORIGIN}/api/health`,
    `${SITE_ORIGIN}/embed/tool/`,
    `${SITE_ORIGIN}/data/../me/`,
    'http://insightginie.com/',
  ])
    assert.throws(() => canonicalUrl(value));
  assert.equal(canonicalUrl(urls[1]), urls[1]);
});

test('refuses empty, duplicate, or entity-declaring sitemaps', () => {
  assert.throws(() => parseSitemap('<urlset></urlset>'), /empty_sitemap/);
  assert.throws(() => parseSitemap(sitemap([urls[0], urls[0]])), /invalid_sitemap_entries/);
  assert.throws(
    () => parseSitemap('<!DOCTYPE doc [<!ENTITY test SYSTEM "file:///etc/passwd">]><urlset/>'),
    /invalid_sitemap_xml/,
  );
});

test('resolves specific robots agents, longest paths and equal-specificity allow', () => {
  const robots =
    'User-agent: *\nDisallow: /\nUser-agent: *\nAllow: /\nDisallow: /calc/\nAllow: /calc/individual-income-percentile/\nUser-agent: adsbot-google\nDisallow: /';
  assert.equal(robotsAllowed(robots, urls[0], 'Googlebot'), true);
  assert.equal(robotsAllowed(robots, `${SITE_ORIGIN}/calc/`, 'bingbot'), false);
  assert.equal(robotsAllowed(robots, urls[1], 'Googlebot'), true);
  assert.equal(robotsAllowed(robots, urls[0], 'AdsBot-Google'), false);
  assert.equal(
    robotsAllowed(
      'User-agent: *\nDisallow:\nUser-agent: AdsBot-Google\nDisallow: /',
      urls[0],
      'Googlebot',
    ),
    true,
  );
});

test('dry run validates hosted key and pages but never POSTs, PUTs, or exposes credentials', async () => {
  const { fetcher, requests } = fixture();
  const receipt = await discover({
    fetcher,
    env: {
      INDEXNOW_KEY: key,
      GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN: 'google-private-value',
      BING_WEBMASTER_API_KEY: 'bing-private-value',
    },
  });
  assert.equal(receipt.validation, 'passed');
  assert.equal(receipt.urlCount, 2);
  assert.equal(receipt.providers[0].status, 'ready');
  assert.equal(
    requests.every(({ options }) => !options.method),
    true,
  );
  for (const value of [key, 'google-private-value', 'bing-private-value'])
    assert.equal(JSON.stringify(receipt).includes(value), false);
});

test('an empty live sitemap refuses every provider submission', async () => {
  const { fetcher, requests } = fixture({ [SITEMAP_URL]: ['<urlset></urlset>'] });
  const receipt = await discover({ submit: true, fetcher, env: { INDEXNOW_KEY: key } });
  assert.equal(receipt.reason, 'empty_sitemap');
  assert.equal(
    requests.some(({ options }) => options.method),
    false,
  );
});

test('a noindex HTTP header blocks submission', async () => {
  const { fetcher, requests } = fixture({
    [urls[1]]: [
      html(urls[1]),
      { headers: { 'Content-Type': 'text/html', 'X-Robots-Tag': 'noindex, nofollow' } },
    ],
  });
  const receipt = await discover({ submit: true, fetcher, env: { INDEXNOW_KEY: key } });
  assert.equal(receipt.reason, 'page_noindex_header');
  assert.equal(
    requests.some(({ options }) => options.method),
    false,
  );
});

test('a noindex HTML tag blocks submission regardless of attribute order or casing', async () => {
  const { fetcher } = fixture({
    [urls[1]]: [
      html(urls[1], "<META CONTENT='NOINDEX,follow' NAME='googlebot'>"),
      { headers: { 'Content-Type': 'text/html' } },
    ],
  });
  const receipt = await discover({ submit: true, fetcher, env: { INDEXNOW_KEY: key } });
  assert.equal(receipt.reason, 'page_noindex_meta');
});

test('canonical mismatch, redirect, and crawler disallow each block submission', async () => {
  const cases = [
    [
      { [urls[1]]: [html(urls[0]), { headers: { 'Content-Type': 'text/html' } }] },
      'page_canonical_mismatch',
    ],
    [
      { [urls[1]]: ['', { status: 307, headers: { Location: urls[0] } }] },
      'discovery_resource_not_200',
    ],
    [
      { [`${SITE_ORIGIN}/robots.txt`]: ['User-agent: *\nDisallow: /calc/'] },
      'page_blocked_by_robots',
    ],
  ];
  for (const [override, reason] of cases) {
    const { fetcher, requests } = fixture(override);
    const receipt = await discover({ submit: true, fetcher, env: { INDEXNOW_KEY: key } });
    assert.equal(receipt.reason, reason);
    assert.equal(
      requests.some(({ options }) => options.method),
      false,
    );
  }
});

test('nested sitemap index validates all leaves and refuses sitemap cycles', async () => {
  const child = `${SITE_ORIGIN}/sitemaps/calculators.xml`;
  const { fetcher } = fixture({
    [SITEMAP_URL]: [`<sitemapindex><sitemap><loc>${child}</loc></sitemap></sitemapindex>`],
    [child]: [sitemap(urls)],
  });
  assert.equal((await discover({ fetcher, env: {} })).urlCount, 2);
  const cyclic = fixture({
    [SITEMAP_URL]: [`<sitemapindex><sitemap><loc>${SITEMAP_URL}</loc></sitemap></sitemapindex>`],
  });
  assert.equal(
    (await discover({ fetcher: cyclic.fetcher, env: {} })).reason,
    'sitemap_cycle_or_limit',
  );
});

test('missing credentials are explicit skips, never claimed as submissions', async () => {
  const { fetcher } = fixture();
  const receipt = await discover({ submit: true, fetcher, env: {} });
  assert.equal(receipt.validation, 'passed');
  assert.equal(receipt.providers.length, 3);
  assert.equal(
    receipt.providers.every(({ status }) => status === 'skipped'),
    true,
  );
});

test('IndexNow accepts only the hosted matching key and posts validated canonical URLs', async () => {
  const { fetcher, requests } = fixture();
  const receipt = await discover({ submit: true, fetcher, env: { INDEXNOW_KEY: key } });
  assert.equal(receipt.providers[0].status, 'accepted_pending_key_validation');
  const posted = requests.find(({ url }) => url === INDEXNOW_ENDPOINT);
  assert.equal(posted.options.method, 'POST');
  assert.deepEqual(JSON.parse(posted.options.body), {
    host: 'insightginie.com',
    key,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  });
  assert.equal(JSON.stringify(receipt).includes(key), false);
  const bad = fixture({ [KEY_LOCATION]: ['different-ownership-key'] });
  const refused = await discover({
    submit: true,
    fetcher: bad.fetcher,
    env: { INDEXNOW_KEY: key },
  });
  assert.equal(refused.providers[0].reason, 'hosted_key_mismatch');
  assert.equal(
    bad.requests.some(({ options }) => options.method),
    false,
  );
});

test('IndexNow requests never exceed 10,000 URLs', () => {
  const many = Array.from({ length: 20_001 }, (_, index) => `${SITE_ORIGIN}/public/${index}/`);
  const batches = urlBatches(many);
  assert.deepEqual(
    batches.map((batch) => batch.length),
    [10_000, 10_000, 1],
  );
  assert.deepEqual(batches.flat(), many);
});

test('rate-limit response is recorded without automatic retries or false success', async () => {
  const base = fixture();
  let posts = 0;
  const fetcher = async (url, options) => {
    if (url === INDEXNOW_ENDPOINT) {
      posts += 1;
      return new Response('Slow down', { status: 429 });
    }
    return base.fetcher(url, options);
  };
  const receipt = await discover({ submit: true, fetcher, env: { INDEXNOW_KEY: key } });
  assert.equal(posts, 1);
  assert.equal(receipt.providers[0].status, 'failed');
  assert.equal(receipt.providers[0].batches[0].httpStatus, 429);
});

test('optional webmaster APIs use the documented methods and redact response receipts', async () => {
  const { fetcher, requests } = fixture();
  const env = {
    GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN: 'private-google-token',
    BING_WEBMASTER_API_KEY: 'private-bing-key',
  };
  const receipt = await discover({ submit: true, fetcher, env });
  assert.equal(receipt.providers[1].status, 'received');
  assert.equal(receipt.providers[2].status, 'received');
  assert.equal(
    requests.find(({ url }) => url.startsWith('https://www.googleapis.com/')).options.method,
    'PUT',
  );
  const bing = requests.find(({ url }) => url.startsWith('https://ssl.bing.com/'));
  assert.equal(new URL(bing.url).pathname, '/webmaster/api.svc/json/SubmitFeed');
  assert.deepEqual(JSON.parse(bing.options.body), { siteUrl: SITE_ORIGIN, feedUrl: SITEMAP_URL });
  assert.equal(JSON.stringify(receipt).includes(env.BING_WEBMASTER_API_KEY), false);
  assert.equal(JSON.stringify(receipt).includes(env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN), false);
});

test('network exceptions never leak credentials or raw request URLs', async () => {
  const base = fixture();
  const fetcher = async (url, options) => {
    if (url.startsWith('https://ssl.bing.com/')) throw new Error(`failed ${url}`);
    return base.fetcher(url, options);
  };
  const receipt = await discover({
    submit: true,
    fetcher,
    env: { BING_WEBMASTER_API_KEY: 'private-key' },
  });
  assert.equal(receipt.providers[2].reason, 'network_request_failed');
  assert.equal(JSON.stringify(receipt).includes('private-key'), false);
});
