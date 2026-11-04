import { readFile, readdir, writeFile, open } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { OPERATION_CODES } from '../observability/privacy.mjs';

const database = '77d1bf25-2cd3-4fa0-ae49-84570dd0f311';
const baselineFile = new URL('../../artifacts/cloudflare-preview/live-baseline.json', import.meta.url);
const paths = { analytics: '/var/lib/insightginie/analytics', operations: '/var/lib/insightginie/operations' };

async function collect() {
  const aggregates = {};
  for (const [kind, directory] of Object.entries(paths)) {
    aggregates[kind] = {};
    for (const name of (await readdir(directory)).filter((item) => /^\d{4}-\d{2}-\d{2}\.json$/.test(item))) {
      const value = JSON.parse(await readFile(`${directory}/${name}`, 'utf8'));
      if (value.day !== name.slice(0, 10) || !value.counts || typeof value.counts !== 'object' || Array.isArray(value.counts)) throw Error('Invalid daily aggregate');
      for (const [key, count] of Object.entries(value.counts)) {
        if (!Number.isSafeInteger(count) || count < 0 || key.length > 200 || (kind === 'operations' && !OPERATION_CODES.includes(key)) || (kind === 'analytics' && key.split('|').length !== 4)) throw Error('Invalid aggregate counter');
      }
      aggregates[kind][value.day] = value.counts;
    }
  }
  const state = JSON.parse(await readFile('/var/lib/insightginie/datadog-ask/selection-state.json', 'utf8'));
  if (state.version !== 1 || !state.budget || !Array.isArray(state.cache) || state.cache.length > 64 || !Number.isSafeInteger(state.budget.dailyRuns) || !Number.isSafeInteger(state.budget.monthlyRuns)) throw Error('Invalid Ginie ledger');
  const metrics = JSON.parse(await readFile('/var/lib/insightginie/observability/metrics-state.json', 'utf8'));
  if (!Number.isSafeInteger(metrics.lastAttemptAt) || metrics.lastAttemptAt < 0) throw Error('Invalid metrics ledger');
  return {aggregates, state, metrics};
}

async function query(batch) {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) throw Error('Cloudflare credentials missing');
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${database}/query`, {
    method: 'POST', headers: {Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json'}, body: JSON.stringify({batch}), signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json();
  if (!response.ok || !result.success || result.result.some((item) => !item.success)) throw Error(`Cloudflare state sync failed (${response.status})`);
}

const mode = process.argv[2] ?? '--dry-run';
if (!['--dry-run', '--baseline', '--delta'].includes(mode)) throw Error('Use --dry-run, --baseline, or --delta');
const current = await collect();
if (mode === '--dry-run') {
  console.log(JSON.stringify({status:'ready', analyticsDays:Object.keys(current.aggregates.analytics).length, operationDays:Object.keys(current.aggregates.operations).length}));
} else if (mode === '--baseline') {
  const pid = Number(execFileSync('systemctl', ['show', 'insightginie-web.service', '-p', 'MainPID', '--value'], {encoding:'utf8'}).trim());
  if (!pid || !(await readFile(`/proc/${pid}/environ`)).toString().split('\0').includes('ASK_DATADOG_ENABLED=false')) throw Error('Freeze the old Datadog provider before syncing');
  try { const h = await open('/var/lib/insightginie/datadog-ask/.selection.lock', 'r'); await h.close(); throw Error('Ginie request still holds the old state lock'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const batch = [
    {sql:'DELETE FROM site_counts'},
    {sql:'UPDATE ginie_state SET value=?, owner=?, lease_until=0 WHERE id=1',params:[JSON.stringify(current.state),'']},
    {sql:"INSERT INTO scheduled_jobs(name,last_attempt) VALUES ('metrics',?) ON CONFLICT(name) DO UPDATE SET last_attempt=excluded.last_attempt",params:[current.metrics.lastAttemptAt]},
  ];
  for (const [kind, days] of Object.entries(current.aggregates)) for (const [day, counts] of Object.entries(days)) batch.push({sql:'INSERT INTO site_counts(kind,day,key,count) SELECT ?,?,key,value FROM json_each(?)',params:[kind,day,JSON.stringify(counts)]});
  await writeFile(baselineFile, JSON.stringify(current), {mode:0o600});
  await query(batch);
  console.log(JSON.stringify({status:'baseline_synced',statements:batch.length}));
} else {
  const baseline = JSON.parse(await readFile(baselineFile, 'utf8'));
  const id = 'post-cutover-' + current.state.budget.month + '-' + current.metrics.lastAttemptAt;
  const batch = [{sql:'CREATE TABLE IF NOT EXISTS migration_runs (id TEXT PRIMARY KEY, complete INTEGER NOT NULL DEFAULT 0)'},{sql:'INSERT OR IGNORE INTO migration_runs(id,complete) VALUES (?,0)',params:[id]}];
  let deltas=0;
  for (const [kind, days] of Object.entries(current.aggregates)) for (const [day, counts] of Object.entries(days)) for (const [key, count] of Object.entries(counts)) {
    const before = baseline.aggregates[kind]?.[day]?.[key] ?? 0; const delta = count - before;
    if (!Number.isSafeInteger(delta) || delta < 0) throw Error('Old aggregate decreased; manual reconciliation required');
    if (delta) { batch.push({sql:'INSERT INTO site_counts(kind,day,key,count) SELECT ?,?,?,? WHERE (SELECT complete FROM migration_runs WHERE id=?)=0 ON CONFLICT(kind,day,key) DO UPDATE SET count=count+excluded.count',params:[kind,day,key,delta,id]}); deltas++; }
  }
  batch.push({sql:'UPDATE migration_runs SET complete=1 WHERE id=?',params:[id]});
  await query(batch);
  console.log(JSON.stringify({status:'delta_synced',counters:deltas}));
}
