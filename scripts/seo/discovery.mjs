import { createHash } from 'node:crypto';

export const SITE_ORIGIN = 'https://insightginie.com';
export const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;
export const KEY_LOCATION = `${SITE_ORIGIN}/indexnow-key.txt`;
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 50_000;
const MAX_SITEMAPS = 100;
const TIMEOUT_MS = 20_000;

function fail(code) {
  throw new Error(code);
}

export function canonicalUrl(value) {
  let url;
  let pathname;
  try {
    url = new URL(value);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    fail('invalid_url');
  }
  if (
    value.length > 2048 ||
    url.origin !== SITE_ORIGIN ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.href !== value ||
    /^\/(?:api|me|admin|_next|embed)(?:\/|$)/i.test(pathname)
  ) {
    fail('non_public_canonical_url');
  }
  return url.href;
}

function decodeEntities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity]) return named[entity];
    const hex = entity.startsWith('&#x');
    const code = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

export function parseSitemap(xml) {
  if (xml.length > 10_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) fail('invalid_sitemap_xml');
  const content = xml.replace(/<!--[\s\S]*?-->/g, '');
  const type = /<sitemapindex(?:\s|>)/i.test(content)
    ? 'index'
    : /<urlset(?:\s|>)/i.test(content)
      ? 'urls'
      : fail('invalid_sitemap_xml');
  const urls = [...content.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)].map((match) =>
    canonicalUrl(decodeEntities(match[1].trim())),
  );
  if (!urls.length) fail('empty_sitemap');
  if (urls.length > MAX_URLS || new Set(urls).size !== urls.length) fail('invalid_sitemap_entries');
  return { type, urls };
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4]);
  }
  return result;
}

export function validatePage(url, response, html) {
  if (response.status !== 200) fail('page_not_200');
  if (response.url && response.url !== url) fail('page_redirected');
  if (!/text\/html/i.test(response.headers.get('content-type') ?? '')) fail('page_not_html');
  if (/\b(?:noindex|none)\b/i.test(response.headers.get('x-robots-tag') ?? ''))
    fail('page_noindex_header');
  const content = html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const robots = [...content.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => attributes(match[0]))
    .filter((meta) => /^(?:robots|googlebot|bingbot)$/i.test(meta.name ?? ''));
  if (robots.some((meta) => /\b(?:noindex|none)\b/i.test(meta.content ?? '')))
    fail('page_noindex_meta');
  const canonicals = [...content.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => attributes(match[0]))
    .filter((link) => /(?:^|\s)canonical(?:\s|$)/i.test(link.rel ?? ''));
  if (canonicals.length !== 1 || canonicals[0].href !== url) fail('page_canonical_mismatch');
}

export function robotsAllowed(text, url, crawler) {
  const groups = [];
  let current;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    const divider = line.indexOf(':');
    if (divider < 0) continue;
    const name = line.slice(0, divider).trim().toLowerCase();
    const value = line.slice(divider + 1).trim();
    if (name === 'user-agent') {
      if (!current || current.hasRules) {
        current = { agents: [], rules: [], hasRules: false };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (name === 'allow' || name === 'disallow')) {
      current.hasRules = true;
      if (value) current.rules.push({ allow: name === 'allow', value });
    }
  }
  const matches = groups.map((group) => ({
    ...group,
    specificity: Math.max(
      -1,
      ...group.agents.map((agent) =>
        agent === '*' ? 0 : crawler.toLowerCase().includes(agent) ? agent.length : -1,
      ),
    ),
  }));
  const specificity = Math.max(-1, ...matches.map((group) => group.specificity));
  const pathname = new URL(url).pathname;
  const rules = matches
    .filter((group) => group.specificity === specificity && specificity >= 0)
    .flatMap((group) => group.rules)
    .filter((rule) => {
      const end = rule.value.endsWith('$');
      const path = end ? rule.value.slice(0, -1) : rule.value;
      const pattern = path
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*');
      return new RegExp(`^${pattern}${end ? '$' : ''}`).test(pathname);
    })
    .sort(
      (a, b) =>
        b.value.replace(/[*$]/g, '').length - a.value.replace(/[*$]/g, '').length ||
        Number(b.allow) - Number(a.allow),
    );
  return rules[0]?.allow ?? true;
}

async function request(fetcher, url, options = {}) {
  try {
    return await fetcher(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...options,
      headers: {
        'User-Agent': 'InsightGinie-Discovery/1.0 (+https://insightginie.com/about/)',
        ...options.headers,
      },
    });
  } catch {
    // Network errors sometimes embed request URLs or authorization details.
    fail('network_request_failed');
  }
}

async function getText(fetcher, url) {
  const response = await request(fetcher, url);
  if (response.status !== 200) fail('discovery_resource_not_200');
  return { response, text: await response.text() };
}

export async function validateLiveSite(fetcher = fetch) {
  const { text: robots } = await getText(fetcher, `${SITE_ORIGIN}/robots.txt`);
  const queue = [SITEMAP_URL];
  const sitemapUrls = new Set();
  const urls = new Set();
  while (queue.length) {
    const sitemap = queue.shift();
    if (sitemapUrls.has(sitemap) || sitemapUrls.size >= MAX_SITEMAPS)
      fail('sitemap_cycle_or_limit');
    sitemapUrls.add(sitemap);
    const parsed = parseSitemap((await getText(fetcher, sitemap)).text);
    if (parsed.type === 'index') queue.push(...parsed.urls);
    else
      for (const url of parsed.urls) {
        if (urls.has(url)) fail('duplicate_canonical_url');
        urls.add(url);
      }
    if (urls.size > MAX_URLS) fail('sitemap_url_limit');
  }
  if (!urls.size) fail('empty_sitemap');
  const sorted = [...urls].sort();
  for (let index = 0; index < sorted.length; index += 4) {
    await Promise.all(
      sorted.slice(index, index + 4).map(async (url) => {
        if (!robotsAllowed(robots, url, 'Googlebot') || !robotsAllowed(robots, url, 'bingbot'))
          fail('page_blocked_by_robots');
        const { response, text } = await getText(fetcher, url);
        validatePage(url, response, text);
      }),
    );
  }
  return { urls: sorted, sitemaps: [...sitemapUrls].sort() };
}

export function urlBatches(urls) {
  const batches = [];
  for (let index = 0; index < urls.length; index += 10_000)
    batches.push(urls.slice(index, index + 10_000));
  return batches;
}

async function submitIndexNow({ fetcher, key, urls, submit }) {
  if (!key) return { provider: 'indexnow', status: 'skipped', reason: 'INDEXNOW_KEY_missing' };
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key))
    return { provider: 'indexnow', status: 'failed', reason: 'INDEXNOW_KEY_invalid' };
  const verification = await getText(fetcher, KEY_LOCATION);
  if (verification.text.trim() !== key)
    return { provider: 'indexnow', status: 'failed', reason: 'hosted_key_mismatch' };
  const batches = urlBatches(urls);
  if (!submit)
    return {
      provider: 'indexnow',
      status: 'ready',
      batchCount: batches.length,
      keyLocation: KEY_LOCATION,
    };
  const receipts = [];
  for (const batch of batches) {
    const response = await request(fetcher, INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'insightginie.com',
        key,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      }),
    });
    receipts.push({ httpStatus: response.status, urlCount: batch.length });
    if (![200, 202].includes(response.status)) break;
  }
  const failed = receipts.some((receipt) => ![200, 202].includes(receipt.httpStatus));
  return {
    provider: 'indexnow',
    status: failed
      ? 'failed'
      : receipts.some((receipt) => receipt.httpStatus === 202)
        ? 'accepted_pending_key_validation'
        : 'received',
    keyLocation: KEY_LOCATION,
    batches: receipts,
  };
}

async function submitGoogle({ fetcher, env, submit }) {
  const token = env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN;
  if (!token)
    return {
      provider: 'google-search-console',
      status: 'skipped',
      reason: 'GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN_missing',
    };
  const property = env.GOOGLE_SEARCH_CONSOLE_PROPERTY || 'sc-domain:insightginie.com';
  if (!['sc-domain:insightginie.com', `${SITE_ORIGIN}/`, SITE_ORIGIN].includes(property))
    fail('search_console_property_mismatch');
  if (!submit)
    return { provider: 'google-search-console', status: 'configured_not_authenticated', property };
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
  const response = await request(fetcher, endpoint, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    provider: 'google-search-console',
    status: response.ok ? 'received' : 'failed',
    httpStatus: response.status,
    property,
  };
}

async function submitBing({ fetcher, env, submit }) {
  const key = env.BING_WEBMASTER_API_KEY;
  if (!key)
    return {
      provider: 'bing-webmaster',
      status: 'skipped',
      reason: 'BING_WEBMASTER_API_KEY_missing',
    };
  if (!submit) return { provider: 'bing-webmaster', status: 'configured_not_authenticated' };
  const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitFeed?apikey=${encodeURIComponent(key)}`;
  const response = await request(fetcher, endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ siteUrl: SITE_ORIGIN, feedUrl: SITEMAP_URL }),
  });
  let accepted = false;
  try {
    const json = await response.json();
    accepted = response.ok && json.d === null;
  } catch {
    // Do not store untrusted response bodies or credential-bearing API URLs.
  }
  return {
    provider: 'bing-webmaster',
    status: accepted ? 'received' : 'failed',
    httpStatus: response.status,
  };
}

export async function discover({
  submit = false,
  env = process.env,
  fetcher = fetch,
  now = new Date(),
} = {}) {
  const receipt = {
    generatedAt: now.toISOString(),
    mode: submit ? 'submit' : 'dry-run',
    site: SITE_ORIGIN,
    sitemap: SITEMAP_URL,
    note: 'A received submission is a discovery notification, not proof or a promise of indexing.',
    validation: 'pending',
    providers: [],
  };
  try {
    const { urls, sitemaps } = await validateLiveSite(fetcher);
    Object.assign(receipt, {
      validation: 'passed',
      urlCount: urls.length,
      urls,
      sitemaps,
      urlsSha256: createHash('sha256').update(urls.join('\n')).digest('hex'),
    });
    for (const operation of [
      {
        provider: 'indexnow',
        run: () => submitIndexNow({ fetcher, key: env.INDEXNOW_KEY?.trim(), urls, submit }),
      },
      { provider: 'google-search-console', run: () => submitGoogle({ fetcher, env, submit }) },
      { provider: 'bing-webmaster', run: () => submitBing({ fetcher, env, submit }) },
    ]) {
      try {
        receipt.providers.push(await operation.run());
      } catch (error) {
        receipt.providers.push({
          provider: operation.provider,
          status: 'failed',
          reason: error.message,
        });
      }
    }
  } catch (error) {
    receipt.validation = 'failed';
    receipt.reason = error.message;
  }
  return receipt;
}
