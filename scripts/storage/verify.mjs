import assert from 'node:assert/strict';
import 'dotenv/config';
import { connectTiDB, createTiDB } from './tidb.mjs';
import { rateLimit } from './redis.mjs';
import worker from '../../apps/opportunities/worker.mjs';
import { choosePost } from '../../apps/opportunities/social.mjs';
import { chooseDiscovery } from '../../apps/opportunities/discoveries.mjs';

const env = { ...process.env, DB: createTiDB(process.env, 'opportunities') };
for (const path of [
  '/health',
  '/v1/stats',
  '/v1/opportunities',
  '/v1/opportunities?q=engineer',
  '/v1/opportunities?q=C%2B%2B',
  '/v1/methods',
  '/v1/ideas',
  '/v1/platforms',
  '/v1/automation',
]) {
  const response = await worker.uncachedFetch(new Request('https://verify.invalid' + path), env);
  assert.equal(response.status, 200, path);
  const data = await response.json();
  if (path === '/v1/stats')
    for (const name of ['opportunities', 'methods', 'ideas', 'platforms'])
      assert.equal(typeof data[name], 'number', name);
  if ('total' in data) assert.equal(typeof data.total, 'number');
  if (data.items?.[0]) assert.ok(!('fingerprint_hash' in data.items[0]));
}
await choosePost(env, Date.now());
await chooseDiscovery(env, Date.now());
const tx = await connectTiDB(process.env).begin();
const db = createTiDB(process.env, 'stage', tx);
try {
  const now = Date.now();
  const claim = (owner) =>
    db
      .prepare('UPDATE ginie_state SET owner=?,lease_until=? WHERE id=1 AND lease_until<=?')
      .bind(owner, now + 10000, now)
      .run();
  assert.equal((await claim('verify-first')).meta.changes, 1);
  assert.equal((await claim('verify-second')).meta.changes, 0);
  assert.equal(
    (
      await db
        .prepare('UPDATE ginie_state SET value=? WHERE id=1 AND owner=? AND lease_until>?')
        .bind('{"test":true}', 'wrong-owner', now)
        .run()
    ).meta.changes,
    0,
  );
  const sql =
    'INSERT INTO site_counts(kind, day, key, count) VALUES (?, ?, ?, 1) ON CONFLICT(kind, day, key) DO UPDATE SET count = count + 1 WHERE count < 9007199254740991';
  const values = ['migration-verify', '2099-01-01', 'test'];
  await db
    .prepare(sql)
    .bind(...values)
    .run();
  await db
    .prepare(sql)
    .bind(...values)
    .run();
  assert.equal(
    (
      await db
        .prepare('SELECT count FROM site_counts WHERE kind=? AND day=? AND key=?')
        .bind(...values)
        .first()
    ).count,
    2,
  );
  await db
    .prepare('UPDATE site_counts SET count=9007199254740991 WHERE kind=? AND day=? AND key=?')
    .bind(...values)
    .run();
  assert.equal(
    (
      await db
        .prepare(sql)
        .bind(...values)
        .run()
    ).meta.changes,
    0,
  );
  const lock =
    "INSERT INTO scheduled_jobs(name, last_attempt) VALUES ('metrics', ?) ON CONFLICT(name) DO UPDATE SET last_attempt = excluded.last_attempt WHERE last_attempt <= excluded.last_attempt - 300000";
  assert.equal((await db.prepare(lock).bind(now).run()).meta.changes, 1);
  assert.equal(
    (
      await db
        .prepare(lock)
        .bind(now + 1)
        .run()
    ).meta.changes,
    0,
  );
  assert.equal(
    (
      await db
        .prepare(lock)
        .bind(now + 300000)
        .run()
    ).meta.changes,
    1,
  );
  // Claims for different days must still share a unique active opportunity claim.
  const posts = createTiDB(process.env, 'opportunities', tx);
  await posts
    .prepare(
      "INSERT OR IGNORE INTO social_posts(day,opportunity_id,status,started_at) VALUES(?,?,'publishing',?)",
    )
    .bind('2099-01-01', 'migration-verify', new Date(now).toISOString())
    .run();
  assert.equal(
    (
      await posts
        .prepare(
          "INSERT OR IGNORE INTO social_posts(day,opportunity_id,status,started_at) VALUES(?,?,'publishing',?)",
        )
        .bind('2099-01-02', 'migration-verify', new Date(now).toISOString())
        .run()
    ).meta.changes,
    0,
  );
} finally {
  await tx.rollback();
}
const verifyId = crypto.randomUUID();
const allowed = await Promise.all(
  Array.from({ length: 10 }, () =>
    rateLimit(process.env, 'verify-' + verifyId, 'synthetic-client', 3, 2000),
  ),
);
assert.equal(allowed.filter(Boolean).length, 3);
console.log(
  'Verified 9 catalogue routes, selection queries, lease ownership, atomic counters, saturation, scheduler and posting claims, and Redis concurrency. SQL fixtures rolled back; no posts sent.',
);
