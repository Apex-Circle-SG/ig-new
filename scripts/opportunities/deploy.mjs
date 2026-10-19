import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { build } from 'esbuild';

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
const literal = (value) =>
  value == null
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`;
for (const table of ['sources', 'platforms', 'ideas']) {
  const rows = JSON.parse(await readFile(resolve(directory, `data/${table}.json`), 'utf8'));
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
        .join(',')}`,
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
  body: JSON.stringify([{ cron: '17 * * * *' }]),
});
console.log(
  JSON.stringify({
    database: config.database_name,
    worker: config.worker_name,
    url: config.api_url,
    schedule: 'hourly at minute 17; each feed rotates every 3 hours',
    seeded: true,
  }),
);
if (process.argv.includes('--ingest')) {
  for (const source of ['jobicy', 'arbeitnow', 'remoteok']) {
    for (let batch = 0; batch < 6; batch++) {
      const response = await fetch(
        `${config.api_url}/admin/ingest?source=${source}&batch=${batch}`,
        { method: 'POST', headers: { Authorization: `Bearer ${secret}` } },
      );
      const result = await response.json();
      console.log(JSON.stringify(result));
      if (!response.ok || result.status !== 'success')
        throw new Error(`Initial import failed for ${source}`);
      if (batch + 1 >= result.batches) break;
    }
  }
}
