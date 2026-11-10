import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTiDB, mysqlStatement } from './tidb.mjs';
import { rateLimit } from './redis.mjs';
import { searchQuery } from '../../apps/opportunities/catalog.mjs';

test('converts reviewed SQL without rewriting quoted content or allowing SQLite-only statements', () => {
  assert.match(
    mysqlStatement("SELECT key,count FROM site_counts WHERE key='site_counts'", 'site'),
    /SELECT `key`,`count` FROM `site_site_counts` WHERE `key`='site_counts'/,
  );
  assert.match(
    mysqlStatement(
      'INSERT INTO source_cursors VALUES(?,?) ON CONFLICT(source_id) DO UPDATE SET cursor=excluded.cursor',
      'opportunities',
    ),
    /ON DUPLICATE KEY UPDATE `cursor`=VALUES\(`cursor`\)/,
  );
  assert.match(
    mysqlStatement(
      "SELECT * FROM opportunities WHERE julianday(last_seen_at)>julianday('now','-7 days')",
      'opportunities',
    ),
    /604800/,
  );
  assert.equal(
    mysqlStatement('SELECT (SELECT COUNT(*) FROM ideas) AS ideas', 'opportunities'),
    'SELECT (SELECT COUNT(*) FROM `opportunities_ideas`) AS ideas',
  );
  assert.throws(
    () => mysqlStatement('SELECT rowid FROM opportunities', 'opportunities'),
    /Unsupported/,
  );
  assert.throws(() => mysqlStatement('SELECT 1', 'unknown'), /namespace/);
});

test('search retains bounded parameters and escapes regex metacharacters', () => {
  const q = searchQuery(
    new URLSearchParams({ q: 'C++ foo.bar', page: '9999', limit: '9999' }),
    'mysql',
  );
  assert.equal(q.limit, 50);
  assert.equal(q.page, 100);
  assert.equal(q.values.length, 2);
  assert.equal(q.values[0], '(^|[^[:alnum:]_])c\\+\\+');
  assert.equal(q.values[1], '(^|[^[:alnum:]_])foo\\.bar');
  assert.match(q.where, /duplicate.fingerprint_hash=o.fingerprint_hash/);
});

test('passes values separately and rolls back failed batches', async () => {
  const calls = [];
  let rolledBack = false,
    committed = false;
  const tx = {
    async execute(sql, values) {
      calls.push({ sql, values });
      if (values[0] === 'fail') throw Error('test failure');
      return { rowsAffected: 1 };
    },
    async rollback() {
      rolledBack = true;
    },
    async commit() {
      committed = true;
    },
  };
  const db = createTiDB({}, 'site', {
    async begin() {
      return tx;
    },
    async execute(sql, values) {
      calls.push({ sql, values });
      return [{ value: 1 }];
    },
  });
  const value = "a' OR 1=1 --";
  await db.prepare('SELECT value FROM ginie_state WHERE owner=?').bind(value).first();
  assert.deepEqual(calls[0].values, [value]);
  assert.ok(!calls[0].sql.includes(value));
  await assert.rejects(
    db.batch([db.prepare('UPDATE ginie_state SET owner=?').bind('fail')]),
    /test failure/,
  );
  assert.equal(rolledBack, true);
  assert.equal(committed, false);
});

test('Redis errors fail closed without SQL or in-memory bypass', async () => {
  assert.equal(await rateLimit({}, 'test', 'client', 3, 1000), false);
});
