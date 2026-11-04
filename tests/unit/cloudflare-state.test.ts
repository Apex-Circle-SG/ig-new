import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { createCloudflareState, type Database } from '../../apps/web/src/lib/cloudflare/state';

it('serializes Ginie access, rejects expired writers and increments counts atomically', async () => {
  const sql = new DatabaseSync(':memory:');
  try {
    sql.exec(readFileSync('scripts/cloudflare/site-state.sql', 'utf8'));
    sql.prepare('INSERT INTO ginie_state(id,value) VALUES (1,?)').run('{}');
    const db: Database = { prepare: (query) => ({ bind: (...args) => ({
      first: async <T>() => (sql.prepare(query).get(...args) as T | undefined) ?? null,
      run: async () => ({ success: true, meta: { changes: Number(sql.prepare(query).run(...args).changes) } }),
    }) }) };
    const state = createCloudflareState(db);
    expect(await state.acquire('first', 100, 50)).toBe(true);
    expect(await state.acquire('second', 101, 50)).toBe(false);
    await state.write('first', 102, '{"budget":1}');
    expect(await state.read('first', 103)).toBe('{"budget":1}');
    expect(await state.acquire('second', 151, 50)).toBe(true);
    await expect(state.write('first', 152, '{}')).rejects.toThrow('expired');
    await state.release('first');
    expect(await state.read('second', 153)).toBe('{"budget":1}');
    await Promise.all(Array.from({ length: 20 }, () => state.increment('analytics', '2026-11-04', 'page_view')));
    expect(sql.prepare('SELECT count FROM site_counts').get()).toMatchObject({ count: 20 });
    await state.increment('operations', '2026-10-01', 'ask_answer');
    await state.prune('operations', '2026-10-02');
    expect(sql.prepare("SELECT count(*) AS n FROM site_counts WHERE kind = 'operations'").get()).toMatchObject({ n: 0 });
  } finally { sql.close(); }
});
