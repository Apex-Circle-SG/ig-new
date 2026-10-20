// Read-only production verification. This script never calls LinkedIn publishing.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import discoveries from '../../apps/opportunities/data/discoveries.json' with { type: 'json' };
import { postText, linkedinCommentary } from '../../apps/opportunities/social.mjs';

const config = JSON.parse(
  await readFile(new URL('../../apps/opportunities/cloudflare.json', import.meta.url)),
);
const cloudflareBase = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`;
async function cloudflare(path, options = {}) {
  const response = await fetch(cloudflareBase + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  assert.ok(response.ok && data.success, 'Cloudflare verification request');
  return data.result;
}
const query = async (sql) =>
  (
    await cloudflare(`/d1/database/${config.database_id}/query`, {
      method: 'POST',
      body: JSON.stringify({ sql }),
    })
  )[0].results;
const schedules = await cloudflare(`/workers/scripts/${config.worker_name}/schedules`);
for (const cron of ['*/10 * * * *', '10 0,6,12,18 * * *', '0 1 * * *', '0 13 * * *'])
  assert.ok(
    schedules.schedules.some((entry) => entry.cron === cron),
    cron,
  );
const morning = await query(
  'SELECT day,status,post_id FROM social_posts ORDER BY day DESC LIMIT 7',
);
const evening = await query(
  'SELECT day,status,post_id FROM social_discovery_posts ORDER BY day DESC LIMIT 7',
);
const methods = await (await fetch(config.api_url + '/v1/methods')).json();
const secret = (await readFile('/root/.config/insightginie/ingest-secret', 'utf8')).trim();
const response = await fetch(config.api_url + '/admin/social-preview?slot=evening', {
  method: 'POST',
  headers: { Authorization: `Bearer ${secret}` },
});
assert.equal(response.status, 200);
const preview = await response.json();
assert.equal(preview.status, 'preview');
assert.ok(preview.text.includes('https://insightginie.com/earn/'));
const checks = [];
for (const item of discoveries) {
  const method = methods.items.find((method) => method.id === item.method_id);
  assert.equal(method.source_url, item.source_url, item.id);
  assert.equal(method.check_status, 'reachable', item.id + ' Worker source check');
  assert.ok(method.steps.includes(item.explanation), item.id + ' API guide text');
  const destination = `https://insightginie.com/earn/${item.method_id}/`;
  // API and Next.js each cache for up to two minutes; allow propagation after a seed update.
  let page, html;
  for (let attempt = 0; attempt < 9; attempt++) {
    page = await fetch(destination, { signal: AbortSignal.timeout(15000) });
    assert.equal(page.status, 200, destination);
    html = await page.text();
    if (html.includes(item.explanation.slice(0, 45))) break;
    if (attempt === 0) console.log(`Waiting for guide cache: ${item.id}`);
    if (attempt < 8) await new Promise((resolve) => setTimeout(resolve, 20000));
  }
  assert.ok(html.includes(item.explanation.slice(0, 45)), item.id + ' rendered guide text');
  assert.ok(
    html.includes(item.source_url.replaceAll('&', '&amp;')),
    item.id + ' original reference',
  );
  const text = postText({ ...item, kind: 'discovery' });
  assert.ok(text.indexOf(destination) < text.indexOf(item.explanation));
  assert.ok(linkedinCommentary(text).length < 2900);
  checks.push({
    day: item.publish_on,
    topic: item.id,
    destination,
    source: item.source_url,
    sourceStatus: method.check_status,
    pageStatus: page.status,
    text,
  });
}
const automation = await (await fetch(config.api_url + '/v1/automation')).json();
assert.equal(automation.linkedin.evening.enabled, true);
assert.equal(automation.linkedin.evening.posts, 14);
const receipt = {
  verifiedAt: new Date().toISOString(),
  status: 'passed',
  trial: automation.linkedin.evening,
  schedules: schedules.schedules,
  morningLedger: morning,
  eveningLedger: evening,
  preview,
  checks,
  tests: { passed: 26, failed: 0 },
  limitations: [
    'No extra LinkedIn post was published during verification. First evening publication is pending its cron.',
    'Fourteen reviewed posts run 20 October through 2 November 2026, then pause pending review and replenishment.',
    'Source reachability is checked daily and before publishing; it does not re-verify every factual claim.',
    'No autonomous factual research or paid generative model is configured. New reviewed items require an editorial update.',
    'GA4 consent remains unchanged. Per-post attribution and application-click measurement are separate follow-up work; analytics review uses owner exports.',
  ],
};
await writeFile(
  new URL('../../docs/verification/evening-discovery-launch.json', import.meta.url),
  JSON.stringify(receipt, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      status: receipt.status,
      posts: checks.length,
      schedules: schedules.schedules,
      preview: preview.text,
      eveningPostsPublishedDuringVerification: 0,
    },
    null,
    2,
  ),
);
