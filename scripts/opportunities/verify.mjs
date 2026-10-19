import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const config = JSON.parse(
  await readFile(new URL('../../apps/opportunities/cloudflare.json', import.meta.url), 'utf8'),
);
const base = config.api_url;
const request = async (path) => {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  return response.json();
};
const health = await request('/health');
assert.equal(health.status, 'ok');
const stats = await request('/v1/stats');
assert(stats.opportunities > 0);
assert.equal(stats.ideas, 60);
assert.equal(stats.platforms, 21);
const sources = stats.sources.filter((source) => source.status === 'enabled');
assert.equal(sources.length, 3);
assert(sources.every((source) => source.last_success && !source.last_error));
const results = await request('/v1/opportunities?source=jobicy&limit=3');
assert(results.items.length > 0);
assert(
  results.items.every(
    (item) => item.source_id === 'jobicy' && item.source_url.startsWith('https://jobicy.com/'),
  ),
);
const none = await request('/v1/opportunities?q=zzzznotanactualkeywordzzzz');
assert.equal(none.total, 0);
await request('/v1/opportunities?q=%22%20OR%20%28%29%20%2A');
const ideas = await request('/v1/ideas');
assert(
  ideas.items.every((idea) => idea.status === 'unvalidated' && idea.experiment && idea.caveat),
);
assert.equal(new Set(ideas.items.map((idea) => idea.id)).size, 60);
const denied = await fetch(base + '/admin/ingest?source=jobicy', { method: 'POST' });
assert.equal(denied.status, 401);
const unknown = await fetch(base + '/v1/opportunities/jobicy-not-an-existing-id');
assert.equal(unknown.status, 404);
const report = {
  verifiedAt: new Date().toISOString(),
  apiUrl: base,
  database: config.database_name,
  status: 'passed',
  counts: {
    opportunities: stats.opportunities,
    ideas: stats.ideas,
    platforms: stats.platforms,
    liveSources: sources.length,
    researchedSources: stats.sources.length,
  },
  checks: [
    'health and schema',
    'active source status',
    'source filter and approved outbound hosts',
    'empty search',
    'escaped search syntax',
    'idea classification',
    'private write denial',
    'unknown listing 404',
  ],
};
await mkdir(new URL('../../docs/verification/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../../docs/verification/opportunities-api.json', import.meta.url),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
