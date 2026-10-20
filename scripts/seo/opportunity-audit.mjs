import { readFile, writeFile } from 'node:fs/promises';
import methods from '../../apps/opportunities/data/methods.json' with { type: 'json' };

const base = process.env.SEO_BASE_URL || 'https://insightginie.com';
if (!['https://insightginie.com', 'http://127.0.0.1:3011', 'http://127.0.0.1:3000'].includes(base))
  throw new Error('Choose the public site or a local release candidate');
const api = JSON.parse(
  await readFile(new URL('../../apps/opportunities/cloudflare.json', import.meta.url)),
).api_url;
async function get(url) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  return { status: response.status, headers: response.headers, text: await response.text() };
}
function pageFacts(page, path) {
  const robots = [...page.text.matchAll(/<meta\s+name="robots"\s+content="([^"]*)"/g)].map(
    (match) => match[1],
  );
  return {
    path,
    status: page.status,
    title: page.text.match(/<title>(.*?)<\/title>/s)?.[1],
    canonical: page.text.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)?.[1],
    robots,
    excludesIndexing: /noindex|none/i.test(
      robots.join(' ') + (page.headers.get('x-robots-tag') || ''),
    ),
  };
}
const sitemap = await get(base + '/sitemap.xml');
const sitemapUrls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const guides = [];
for (const item of methods) {
  const path = `/earn/${item.id}/`;
  guides.push({
    ...pageFacts(await get(base + path), path),
    inSitemap: sitemapUrls.includes('https://insightginie.com' + path),
  });
}
const first = await (await fetch(api + '/v1/opportunities?category=jobs&limit=50')).json();
let jobs = first.items;
for (let page = 2; page <= first.pages; page++) {
  const data = await (
    await fetch(api + `/v1/opportunities?category=jobs&limit=50&page=${page}`)
  ).json();
  jobs.push(...data.items);
}
const sampledJobs = [];
for (const job of jobs.slice(0, 5))
  sampledJobs.push(
    pageFacts(await get(base + `/opportunities/${job.id}/`), `/opportunities/${job.id}/`),
  );
const hubPaths = [
  '/opportunities/remote-contracts/',
  '/earn/paid-research/',
  '/earn/creative-services/',
  '/earn/digital-products/',
];
const hubs = [];
for (const path of hubPaths)
  hubs.push({
    ...pageFacts(await get(base + path), path),
    inSitemap: sitemapUrls.includes('https://insightginie.com' + path),
  });
const report = {
  checkedAt: new Date().toISOString(),
  base,
  scope:
    'Observed route metadata, catalog snapshot and sitemap coverage. This does not establish Google indexing, search rankings or traffic.',
  sitemap: { status: sitemap.status, urls: sitemapUrls.length, unique: new Set(sitemapUrls).size },
  guides,
  hubs,
  sampledJobs,
  catalog: {
    sourceTotalAtStart: first.total,
    recordsRead: jobs.length,
    truncatedExcerpts: jobs.filter((job) => /[…]|\.\.\./.test(job.excerpt)).length,
    excerptsUnder500Characters: jobs.filter((job) => job.excerpt.length < 500).length,
  },
  jobIndexingDecision:
    'Retain noindex on feed-only details. The catalog stores bounded source excerpts, not verified complete role descriptions. Original search hubs and reviewed earning guides provide the indexable discovery surface. Revisit selected detailed jobs when complete permitted descriptions and original editorial value are available.',
  references: [
    'https://developers.google.com/search/docs/appearance/structured-data/job-posting',
    'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
  ],
};
const phase = process.argv.includes('--after') ? 'after' : 'before';
await writeFile(
  new URL(`../../docs/verification/opportunity-seo-${phase}.json`, import.meta.url),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    phase,
    guides: guides.length,
    guidesInSitemap: guides.filter((x) => x.inSitemap).length,
    hubsInSitemap: hubs.filter((x) => x.inSitemap).length,
    catalog: report.catalog,
    sitemap: report.sitemap,
  }),
);
