// Private snapshots stay outside Git. Never replace or delete an existing source database.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { connectTiDB, TABLES } from './tidb.mjs';
import 'dotenv/config';

const file = process.argv[2];
const verifyOnly = process.argv.includes('--verify');
if (!file) throw new Error('Supply a private D1 table snapshot JSON path');
const snapshot = JSON.parse(await readFile(file, 'utf8'));
const namespace = {
  'insightginie-site-state': 'site',
  'insightginie-site-stage': 'stage',
  'insightginie-opportunities': 'opportunities',
}[snapshot.name];
if (!namespace) throw new Error('Unrecognized source database');
const expected = TABLES[namespace === 'stage' ? 'site' : namespace];
if (snapshot.tables.some((t) => !expected.includes(t.name)))
  throw new Error('Unreviewed source table');
const db = connectTiDB({
  ...process.env,
  TIDB_USERNAME: process.env.TIDB_MIGRATION_USERNAME ?? process.env.TIDB_USERNAME,
  TIDB_PASSWORD: process.env.TIDB_MIGRATION_PASSWORD ?? process.env.TIDB_PASSWORD,
});
const quote = (name) => {
  if (!/^[a-z_][a-z_0-9]*$/i.test(name)) throw new Error('Invalid identifier');
  return '`' + name + '`';
};
const tableName = (t) => quote(namespace + '_' + t.name);
const stringKeys = new Set([
  'id',
  'slug',
  'kind',
  'name',
  'day',
  'key',
  'bucket',
  'source_id',
  'external_id',
  'status',
  'published_at',
  'last_seen_at',
  'expires_at',
  'started_at',
  'last_checked',
  'category',
]);
const receipt = {
  source: snapshot.name,
  snapshotAt: snapshot.at,
  verifiedAt: new Date().toISOString(),
  tables: [],
};
const hash = (rows) => createHash('sha256').update(JSON.stringify(rows)).digest('hex');
for (const table of snapshot.tables) {
  const keys = table.columns
    .filter((c) => c.pk)
    .sort((a, b) => a.pk - b.pk)
    .map((c) => c.name);
  if (!keys.length) throw new Error('Table without a primary key needs review');
  const cols = table.columns.map((c) => c.name);
  if (table.name === 'library_tools') cols.push('_position');
  const order = keys.map(quote).join(',');
  const lengths = {
    id: 200,
    slug: 200,
    kind: 64,
    day: 32,
    source_id: 80,
    external_id: 200,
    status: 32,
    published_at: 40,
    last_seen_at: 40,
    expires_at: 40,
    started_at: 40,
    last_checked: 40,
    category: 100,
  };
  const ddl = table.columns.map((c) => {
    const integer = /INT/i.test(c.type);
    const type = integer
      ? 'BIGINT'
      : stringKeys.has(c.name)
        ? `VARCHAR(${lengths[c.name] ?? 255})`
        : c.dflt_value != null
          ? 'VARCHAR(8192)'
          : 'LONGTEXT';
    if (
      type.startsWith('VARCHAR') &&
      table.rows.some(
        (r) => r[c.name] != null && String(r[c.name]).length > Number(type.match(/\d+/)[0]),
      )
    )
      throw new Error('Review long indexed value in ' + table.name + '.' + c.name);
    const defaultValue = c.dflt_value != null ? ' DEFAULT ' + c.dflt_value : '';
    return quote(c.name) + ' ' + type + (c.notnull || c.pk ? ' NOT NULL' : ' NULL') + defaultValue;
  });
  ddl.push('PRIMARY KEY (' + order + ')');
  if (table.name === 'library_tools') ddl.push('`_position` BIGINT NOT NULL UNIQUE');
  if (table.name === 'ginie_state') ddl.push('CHECK (`id` = 1)');
  if (table.name === 'site_counts') ddl.push('CHECK (`count` >= 0)');
  if (table.name === 'opportunities') {
    ddl.push('UNIQUE KEY source_external (`source_id`,`external_id`)');
    ddl.push('KEY status_date (`status`,`published_at`,`id`)');
    ddl.push('KEY source_status (`source_id`,`status`,`last_seen_at`)');
    ddl.push('`fingerprint_hash` CHAR(64) GENERATED ALWAYS AS (SHA2(`fingerprint`,256)) VIRTUAL');
    ddl.push(
      'KEY fingerprint_eligibility (`fingerprint_hash`,`status`,`id`,`last_seen_at`,`expires_at`)',
    );
    ddl.push('FOREIGN KEY (`source_id`) REFERENCES `opportunities_sources` (`id`)');
  }
  if (table.name === 'request_limits') ddl.push('KEY expiry (`expires`)');
  if (table.name === 'ingestion_runs') ddl.push('KEY run_time (`started_at`)');
  if (table.name === 'social_posts' || table.name === 'social_discovery_posts') {
    ddl.push(
      "`claimed_opportunity` VARCHAR(255) GENERATED ALWAYS AS (IF(`status` IN ('publishing','published','uncertain'),`opportunity_id`,NULL)) VIRTUAL",
    );
    ddl.push('UNIQUE KEY claimed_opportunity (`claimed_opportunity`)');
  }
  if (!verifyOnly) {
    await db.execute(
      'CREATE TABLE IF NOT EXISTS ' +
        tableName(table) +
        ' (' +
        ddl.join(',') +
        ') CHARACTER SET utf8mb4 COLLATE utf8mb4_bin',
    );
    const [existing] = await db.execute('SELECT COUNT(*) AS n FROM ' + tableName(table));
    if (existing.n && !process.argv.includes('--sync'))
      throw new Error(
        'Destination contains rows; use --verify or explicitly authorize --sync from a frozen source',
      );
    const tx = await db.begin();
    try {
      for (let offset = 0; offset < table.rows.length; offset += 100) {
        const rows = table.rows.slice(offset, offset + 100);
        const values = rows.flatMap((r) => cols.map((c) => r[c]));
        await tx.execute(
          'INSERT INTO ' +
            tableName(table) +
            ' (' +
            cols.map(quote).join(',') +
            ') VALUES ' +
            rows.map(() => `(${cols.map(() => '?').join(',')})`).join(',') +
            ' ON DUPLICATE KEY UPDATE ' +
            cols
              .filter((c) => !keys.includes(c))
              .map((c) => `${quote(c)}=VALUES(${quote(c)})`)
              .join(','),
          values,
        );
      }
      // Remove only keys no longer present in the frozen source, inside the same transaction.
      if (process.argv.includes('--sync')) {
        const live = await tx.execute('SELECT ' + order + ' FROM ' + tableName(table));
        const sourceKeys = new Set(table.rows.map((r) => JSON.stringify(keys.map((k) => r[k]))));
        for (const row of live)
          if (!sourceKeys.has(JSON.stringify(keys.map((k) => row[k]))))
            await tx.execute(
              'DELETE FROM ' +
                tableName(table) +
                ' WHERE ' +
                keys.map((k) => quote(k) + '=?').join(' AND '),
              keys.map((k) => row[k]),
            );
      }
      await tx.commit();
    } catch (e) {
      await tx.rollback().catch(() => {});
      throw e;
    }
  }
  const target = await db.execute(
    'SELECT ' + cols.map(quote).join(',') + ' FROM ' + tableName(table) + ' ORDER BY ' + order,
  );
  const normalize = (rows) =>
    rows
      .map((r) => cols.map((c) => r[c]))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en'));
  const sourceHash = hash(normalize(table.rows)),
    targetHash = hash(normalize(target));
  if (sourceHash !== targetHash) throw new Error('Row verification failed for ' + table.name);
  receipt.tables.push({
    table: namespace + '_' + table.name,
    rows: target.length,
    sha256: sourceHash,
  });
  console.log(namespace + '_' + table.name, target.length, 'rows verified');
}
await writeFile(file.replace(/\.json$/, '-tidb-receipt.json'), JSON.stringify(receipt, null, 2), {
  mode: 0o600,
});
