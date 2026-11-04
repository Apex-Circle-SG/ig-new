import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it, vi } from 'vitest';
import { exportMetrics } from '../../scripts/cloudflare/metrics';

it('sends only approved daily aggregates and runs at most once per five minutes', async () => {
  const sql = new DatabaseSync(':memory:');
  try {
    sql.exec(readFileSync('scripts/cloudflare/site-state.sql', 'utf8'));
    sql.prepare('INSERT INTO site_counts(kind,day,key,count) VALUES (?,?,?,?)').run('operations', '2026-11-04', 'ask_answer', 3);
    sql.prepare('INSERT INTO request_limits(bucket,expires,count) VALUES (?,?,?)').run('expired-hmac', 100, 1);
    const db = { prepare: (query: string) => ({ bind: (...args: (string | number)[]) => ({
      all: async <T>() => ({ success: true, results: sql.prepare(query).all(...args) as T[] }),
      run: async () => ({ success: true, meta: { changes: Number(sql.prepare(query).run(...args).changes) } }),
    }) }) };
    const send: typeof fetch = vi.fn(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      expect(payload.series.find((item: {metric: string}) => item.metric === 'insightginie.operations.ask_answer.daily').points[0].value).toBe(3);
      expect(JSON.stringify(payload)).not.toContain('expired-hmac');
      return new Response(null, {status: 202});
    });
    const now = Date.parse('2026-11-04T10:00:00Z');
    expect(await exportMetrics({SITE_DB:db, DD_API_KEY:'test', DD_METRICS_ENABLED:'true'}, now, send)).toBe('delivered');
    expect(await exportMetrics({SITE_DB:db, DD_API_KEY:'test', DD_METRICS_ENABLED:'true'}, now + 1000, send)).toBe('rate_limited');
    expect(send).toHaveBeenCalledTimes(1);
    expect(sql.prepare('SELECT COUNT(*) AS n FROM request_limits').get()).toMatchObject({n:0});
    const retry: typeof fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(new Response(null, { status: 202 }));
    expect(await exportMetrics({SITE_DB:db, DD_API_KEY:'test', DD_METRICS_ENABLED:'true'}, now + 300_000, retry, async () => {})).toBe('delivered');
    expect(retry).toHaveBeenCalledTimes(2);
    sql.prepare('INSERT INTO site_counts(kind,day,key,count) VALUES (?,?,?,?)').run('operations', '2026-11-04', 'unexpected', 4);
    const blocked: typeof fetch = vi.fn();
    await expect(exportMetrics({SITE_DB:db, DD_API_KEY:'test', DD_METRICS_ENABLED:'true'}, now + 600_000, blocked)).rejects.toThrow('Invalid aggregate');
    expect(blocked).not.toHaveBeenCalled();
  } finally { sql.close(); }
});
