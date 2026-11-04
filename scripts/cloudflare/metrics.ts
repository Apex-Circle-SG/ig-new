import { OPERATION_CODES } from '../../apps/web/src/lib/operations';

type Statement = {
  bind(...values: (string | number)[]): {
    all<T>(): Promise<{ success: boolean; results: T[] }>;
    run(): Promise<{ success: boolean; meta: { changes: number } }>;
  };
};
type Environment = { SITE_DB: { prepare(sql: string): Statement }; DD_API_KEY: string; DD_METRICS_ENABLED: string };

export async function exportMetrics(env: Environment, now: number, send = fetch, sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))) {
  const db = env.SITE_DB;
  // Keep short-lived rate-limit buckets out of long-term storage.
  const deleted = await db.prepare('DELETE FROM request_limits WHERE expires <= ?').bind(now).run();
  if (!deleted.success) throw new Error('Rate limit cleanup failed');
  if (env.DD_METRICS_ENABLED !== 'true') return 'disabled';
  const claim = await db.prepare(`INSERT INTO scheduled_jobs(name, last_attempt) VALUES ('metrics', ?)
    ON CONFLICT(name) DO UPDATE SET last_attempt = excluded.last_attempt
    WHERE last_attempt <= excluded.last_attempt - 300000`).bind(now).run();
  if (!claim.success) throw new Error('Metrics lock failed');
  if (!claim.meta.changes) return 'rate_limited';

  const day = new Date(now).toISOString().slice(0, 10);
  const rows = await db.prepare("SELECT key, count FROM site_counts WHERE kind = 'operations' AND day = ?")
    .bind(day).all<{key: string; count: number}>();
  if (!rows.success) throw new Error('Metrics query failed');
  if (!rows.results.length) return 'no_data';
  const counts = new Map<string, number>();
  for (const row of rows.results) {
    if (!(OPERATION_CODES as readonly string[]).includes(row.key) || !Number.isSafeInteger(row.count) || row.count < 0 || row.count > 1_000_000_000)
      throw new Error('Invalid aggregate');
    counts.set(row.key, row.count);
  }
  const body = JSON.stringify({series: OPERATION_CODES.map((code) => ({
    metric: `insightginie.operations.${code}.daily`, type: 3,
    points: [{ timestamp: Math.floor(now / 1000), value: counts.get(code) ?? 0 }],
    tags: ['service:insightginie-web', 'env:production'],
  }))});
  if (!env.DD_API_KEY || body.length > 16_384) throw new Error('Invalid metrics configuration');
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await send('https://api.ap1.datadoghq.com/api/v2/series', {
      method: 'POST', headers: {'DD-API-KEY': env.DD_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json'},
      body, signal: AbortSignal.timeout(4000),
    });
    if (response.status === 202) return 'delivered';
    if (attempt === 0 && [429, 502, 503, 504].includes(response.status)) { await sleep(1000); continue; }
    throw new Error('Metrics delivery rejected');
  }
  throw new Error('Metrics delivery failed');
}

const worker = {
  async scheduled(_event: unknown, env: Environment) {
    await exportMetrics(env, Date.now());
  },
};

export default worker;
