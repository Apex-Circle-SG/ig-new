import { randomBytes } from 'node:crypto';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import { adminChallenge, authenticatedAdmin, htmlEscape as e } from '../../lib/admin';
import { getContentStatus, listContent } from '../../lib/content';
import { getSiteEntries } from '../../lib/site-index';
import { operationStore } from '../../lib/operations';
import { createRequestLimiter, privateJson, requestBucket } from '../../lib/request-security';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const allow = createRequestLimiter(30);

export async function GET(request: Request) {
  if (!allow(requestBucket(request))) return privateJson({ error: 'Try again shortly.' }, 429);
  if (!authenticatedAdmin(request)) return adminChallenge();
  const dataset = getIndividualIncomeDistribution();
  const content = getContentStatus();
  const operations = await operationStore.recent();
  const nonce = randomBytes(24).toString('base64');
  const table = (rows: [string, unknown][]) =>
    `<dl>${rows.map(([key, value]) => `<dt>${e(key)}</dt><dd>${e(value)}</dd>`).join('')}</dl>`;
  const html = `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>InsightGinie operations</title><style>
  *{box-sizing:border-box}body{font:16px/1.65 system-ui,sans-serif;color:#203149;background:#f4f6fa;margin:0}main{max-width:1100px;margin:auto;padding:30px 20px}h1{font-size:clamp(1.7rem,4vw,2.5rem)}h2{font-size:1.15rem}a{color:#503aab}section{background:white;border:1px solid #dce2ec;border-radius:14px;margin:20px 0;padding:22px}dl{display:grid;grid-template-columns:minmax(160px,1fr) 2fr;gap:8px}dt{font-weight:600}dd{margin:0;overflow-wrap:anywhere}button{font:inherit;background:#513cac;color:white;border:0;border-radius:8px;min-height:44px;padding:8px 16px;cursor:pointer}button:disabled{background:#e1e4eb;color:#555;cursor:not-allowed}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}.notice{background:#fff7df;padding:12px;border-radius:8px}table{border-collapse:collapse;width:100%}th,td{text-align:left;border-bottom:1px solid #eee;padding:8px}nav{display:flex;flex-wrap:wrap;gap:18px}a:focus-visible,button:focus-visible{outline:3px solid #7f65d0;outline-offset:3px}@media(max-width:550px){dl{grid-template-columns:1fr}dd{margin-bottom:12px}}</style></head><body><main><nav><a href="/">Public site</a><a href="/tools/">Tools</a><a href="/insights/">Content previews</a><a href="/content-index/">Published index</a></nav><h1>InsightGinie operations</h1><p>Authenticated operational status. Counts contain no questions, financial inputs or visitor identifiers.</p>
  <section><h2>Dataset and calculator status</h2>${table([
    ['Dataset', dataset?.datasetVersion.id ?? 'Data unavailable'],
    ['Validation', dataset?.datasetVersion.validationStatus ?? 'Unavailable'],
    ['Source year', dataset?.datasetVersion.year ?? 'Unavailable'],
    ['Retrieved', dataset?.datasetVersion.retrievedAt ?? 'Unavailable'],
    ['Finance formula engines', FINANCE_TOOLS.length],
    ['Reviewed public routes', getSiteEntries().length],
  ])}</section>
  <section><h2>Editorial migration</h2>${table([
    ['Mode', content.mode],
    ['Content snapshot', content.versionId ?? 'Unavailable'],
    ['Synced records', content.syncedPosts],
    ['Inventoried posts', content.inventoriedPosts],
    ['Full backup verified', content.fullBackupVerified],
    ['Restore test verified', content.restoreTestVerified],
    ['Blog redirects verified', content.blogRedirectsVerified],
  ])}<p class="notice">Publication requires a verified backup, restore test, direct blog redirects and per-URL approval. A preview is not a completed migration.</p><nav>${listContent(
    { limit: 5 },
  )
    .map((record) => `<a href="${e(record.path)}">Preview ${e(record.title)}</a>`)
    .join(
      '',
    )}</nav><p><button id="validate" type="button">Run local quality checks</button> <button type="button" disabled>Approve publication — prerequisites pending</button></p><pre id="quality" role="status" aria-live="polite">Run validation to inspect the current snapshot.</pre></section>
  <section><h2>Assistant and observability</h2>${table([
    [
      'Public assistant',
      process.env.ASK_ENABLED === 'false'
        ? 'Disabled'
        : 'Approved-content retrieval and deterministic calculations',
    ],
    ['Raw prompt persistence', 'Disabled'],
    [
      'Private Bits',
      'Separate operational adapter; recurring execution requires configured budget',
    ],
    [
      'Datadog aggregate export',
      process.env.DD_METRICS_ENABLED === 'true'
        ? 'Configured; inspect worker receipt for delivery'
        : 'Not enabled in web process',
    ],
    ['Browser RUM', 'Not enabled; no browser Datadog token'],
    ['Search Console / GA4 baseline', 'Data unavailable — account evidence required'],
    ['Ad RPM / revenue baseline', 'Data unavailable — AdSense account reports required'],
  ])}</section>
  <section><h2>Recent aggregate service events</h2>${operations.length ? `<div style="overflow:auto"><table><thead><tr><th>UTC day</th><th>Event</th><th>Count</th></tr></thead><tbody>${operations.flatMap((day) => Object.entries(day.counts).map(([code, count]) => `<tr><td>${e(day.day)}</td><td>${e(code)}</td><td>${e(count)}</td></tr>`)).join('')}</tbody></table></div>` : '<p>No recorded service events are available. This is not a traffic baseline.</p>'}</section>
  <script nonce="${nonce}">document.getElementById('validate').addEventListener('click',async()=>{const out=document.getElementById('quality');out.textContent='Checking…';try{const response=await fetch('/api/admin/checks/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});out.textContent=JSON.stringify(await response.json(),null,2);}catch{out.textContent='Checks unavailable; use the operational CLI.'}});</script></main></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,
    },
  });
}
