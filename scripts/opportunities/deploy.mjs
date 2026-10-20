import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { build } from 'esbuild';
import { FEEDS } from '../../apps/opportunities/feed-config.mjs';

const root = resolve(import.meta.dirname, '../..');
const directory = resolve(root, 'apps/opportunities');
const config = JSON.parse(await readFile(resolve(directory, 'cloudflare.json'), 'utf8'));
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) throw new Error('Configure the private Cloudflare environment first');
const base = `https://api.cloudflare.com/client/v4/accounts/${account}`;
async function api(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success)
    throw new Error(
      `Cloudflare ${response.status}: ${(data.errors ?? []).map((e) => e.message).join('; ')}`,
    );
  return data.result;
}
const query = (sql) =>
  api(`/d1/database/${config.database_id}/query`, {
    method: 'POST',
    body: JSON.stringify({ sql }),
  });
await query(await readFile(resolve(directory, 'migrations/0001_catalog.sql'), 'utf8'));
const versions = await query('SELECT version FROM schema_migrations');
if (!versions[0].results.some((row) => row.version === 2))
  await query(await readFile(resolve(directory, 'migrations/0002_automation.sql'), 'utf8'));
if (!versions[0].results.some((row) => row.version === 3))
  await query(
    await readFile(resolve(directory, 'migrations/0003_evening_discoveries.sql'), 'utf8'),
  );
const literal = (value) =>
  value == null
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`;
for (const table of ['sources', 'platforms', 'ideas', 'earning_methods']) {
  const seed = JSON.parse(
    await readFile(
      resolve(directory, `data/${table === 'earning_methods' ? 'methods' : table}.json`),
      'utf8',
    ),
  );
  const rows =
    table === 'earning_methods'
      ? seed.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          data: JSON.stringify(row),
        }))
      : seed;
  for (let i = 0; i < rows.length; i += 20) {
    const group = rows.slice(i, i + 20);
    const fields = Object.keys(group[0]);
    const values = group.map(
      (row) =>
        `(${fields.map((field) => literal(Array.isArray(row[field]) ? JSON.stringify(row[field]) : row[field])).join(',')})`,
    );
    await query(
      `INSERT INTO ${table} (${fields.join(',')}) VALUES ${values.join(',')} ON CONFLICT(id) DO UPDATE SET ${fields
        .filter((field) => field !== 'id')
        .map((field) => `${field}=excluded.${field}`)
        .join(
          ',',
        )}${table === 'earning_methods' ? ",last_checked=CASE WHEN json_extract(earning_methods.data,'$.source_url')=json_extract(excluded.data,'$.source_url') THEN earning_methods.last_checked ELSE NULL END,check_status=CASE WHEN json_extract(earning_methods.data,'$.source_url')=json_extract(excluded.data,'$.source_url') THEN earning_methods.check_status ELSE 'not-checked' END,last_http_status=CASE WHEN json_extract(earning_methods.data,'$.source_url')=json_extract(excluded.data,'$.source_url') THEN earning_methods.last_http_status ELSE NULL END" : ''}`,
    );
  }
}
const privateDir = resolve(
  process.env.XDG_CONFIG_HOME ?? resolve(process.env.HOME, '.config'),
  'insightginie',
);
await mkdir(privateDir, { recursive: true, mode: 0o700 });
let secret;
try {
  secret = (await readFile(resolve(privateDir, 'ingest-secret'), 'utf8')).trim();
} catch {
  secret = randomBytes(32).toString('hex');
  await writeFile(resolve(privateDir, 'ingest-secret'), secret + '\n', { mode: 0o600 });
}
let linkedinKey;
try {
  linkedinKey = (await readFile(resolve(privateDir, 'linkedin-state-key'), 'utf8')).trim();
} catch {
  linkedinKey = randomBytes(32).toString('hex');
  await writeFile(resolve(privateDir, 'linkedin-state-key'), linkedinKey, { mode: 0o600 });
}
let linkedin;
try {
  linkedin = await readFile(resolve(privateDir, 'linkedin.json'), 'utf8');
} catch {
  if (process.argv.includes('--enable-linkedin'))
    throw new Error('LinkedIn credentials not configured');
}
const bundled = await build({
  entryPoints: [resolve(directory, 'worker.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  write: false,
});
const form = new FormData();
form.set(
  'metadata',
  new Blob(
    [
      JSON.stringify({
        main_module: 'worker.mjs',
        compatibility_date: '2026-10-01',
        bindings: [
          { type: 'd1', name: 'DB', id: config.database_id },
          { type: 'secret_text', name: 'INGEST_SECRET', text: secret },
          {
            type: 'plain_text',
            name: 'LINKEDIN_EVENING_ENABLED',
            text: config.linkedin_evening_enabled === true ? 'true' : 'false',
          },
          {
            type: 'plain_text',
            name: 'LINKEDIN_ENABLED',
            text:
              (process.argv.includes('--enable-linkedin') || config.linkedin_enabled === true) &&
              !process.argv.includes('--disable-linkedin')
                ? 'true'
                : 'false',
          },
          ...(linkedin
            ? [
                { type: 'secret_text', name: 'LINKEDIN_CREDENTIALS', text: linkedin },
                { type: 'secret_text', name: 'LINKEDIN_STATE_KEY', text: linkedinKey },
              ]
            : []),
        ],
        observability: { enabled: true },
      }),
    ],
    { type: 'application/json' },
  ),
);
form.set(
  'worker.mjs',
  new Blob([bundled.outputFiles[0].text], { type: 'application/javascript+module' }),
  'worker.mjs',
);
await api(`/workers/scripts/${config.worker_name}`, { method: 'PUT', body: form });
await api(`/workers/scripts/${config.worker_name}/subdomain`, {
  method: 'POST',
  body: JSON.stringify({ enabled: true, previews_enabled: false }),
});
await api(`/workers/scripts/${config.worker_name}/schedules`, {
  method: 'PUT',
  body: JSON.stringify([
    { cron: '*/10 * * * *' },
    { cron: '10 0,6,12,18 * * *' },
    { cron: '0 1 * * *' },
    { cron: '0 13 * * *' },
  ]),
});
console.log(
  JSON.stringify({
    database: config.database_name,
    worker: config.worker_name,
    url: config.api_url,
    schedule:
      'Rotating imports every 10 minutes; daily method checks; LinkedIn 09:00 and evening trial 21:00 Asia/Singapore',
    linkedinEnabled:
      (process.argv.includes('--enable-linkedin') || config.linkedin_enabled === true) &&
      !process.argv.includes('--disable-linkedin'),
    seeded: true,
  }),
);
if (process.argv.includes('--ingest')) {
  for (const source of Object.keys(FEEDS)) {
    for (let batch = 0; batch < 40; batch++) {
      const response = await fetch(
        `${config.api_url}/admin/ingest?source=${source}&batch=${batch}`,
        { method: 'POST', headers: { Authorization: `Bearer ${secret}` } },
      );
      const result = await response.json();
      console.log(JSON.stringify(result));
      if (!response.ok || result.status !== 'success') {
        console.log(JSON.stringify({ source, initialImport: 'failed; retained previous data' }));
        break;
      }
      if (batch + 1 >= result.batches) break;
    }
  }
}

if (process.argv.includes('--check-methods')) {
  for (let slot = 0; slot < 4; slot++) {
    const response = await fetch(`${config.api_url}/admin/check-methods?slot=${slot}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    console.log(JSON.stringify({ methodChecks: await response.json() }));
  }
}
