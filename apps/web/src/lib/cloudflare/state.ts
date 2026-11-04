export type Database = {
  prepare(sql: string): {
    bind(...values: (string | number)[]): {
      first<T>(): Promise<T | null>;
      run(): Promise<{ success: boolean; meta: { changes: number } }>;
    };
  };
};

export function createCloudflareState(db: Database) {
  return {
    async acquire(owner: string, now: number, leaseMs: number) {
      const result = await db.prepare(
        'UPDATE ginie_state SET owner = ?, lease_until = ? WHERE id = 1 AND lease_until <= ?',
      ).bind(owner, now + leaseMs, now).run();
      if (!result.success) throw new Error('Could not acquire state lock');
      return result.meta.changes === 1;
    },
    async read(owner: string, now: number) {
      const row = await db.prepare(
        'SELECT value FROM ginie_state WHERE id = 1 AND owner = ? AND lease_until > ?',
      ).bind(owner, now).first<{ value: string }>();
      if (!row) throw new Error('State lock expired');
      return row.value;
    },
    async write(owner: string, now: number, value: string) {
      const result = await db.prepare(
        'UPDATE ginie_state SET value = ? WHERE id = 1 AND owner = ? AND lease_until > ?',
      ).bind(value, owner, now).run();
      if (!result.success || result.meta.changes !== 1) throw new Error('State lock expired');
    },
    async release(owner: string) {
      const result = await db.prepare(
        "UPDATE ginie_state SET owner = '', lease_until = 0 WHERE id = 1 AND owner = ?",
      ).bind(owner).run();
      if (!result.success) throw new Error('Could not release state lock');
    },
    async prune(kind: string, cutoff: string) {
      const result = await db.prepare('DELETE FROM site_counts WHERE kind = ? AND day < ?')
        .bind(kind, cutoff).run();
      if (!result.success) throw new Error('Could not prune counts');
    },
    async increment(kind: string, day: string, key: string) {
      const result = await db.prepare(
        'INSERT INTO site_counts(kind, day, key, count) VALUES (?, ?, ?, 1) ON CONFLICT(kind, day, key) DO UPDATE SET count = count + 1 WHERE count < 9007199254740991',
      ).bind(kind, day, key).run();
      if (!result.success || result.meta.changes !== 1) throw new Error('Could not update count');
    },
  };
}
