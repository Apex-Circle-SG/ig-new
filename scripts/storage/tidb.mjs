import { connect } from '@tidbcloud/serverless';

export const TABLES = {
  site: [
    'migration_snapshots',
    'ginie_state',
    'site_counts',
    'request_limits',
    'scheduled_jobs',
    'migration_runs',
    'library_tools',
    'library_knowledge',
    'library_sources',
  ],
  opportunities: [
    'schema_migrations',
    'sources',
    'opportunities',
    'ideas',
    'platforms',
    'ingestion_runs',
    'source_cursors',
    'earning_methods',
    'automation_state',
    'social_posts',
    'social_discovery_posts',
  ],
};

// Translate only the existing SQLite statement shapes; identifiers and values stay separate.
export function mysqlStatement(sql, namespace) {
  if (!['site', 'stage', 'opportunities'].includes(namespace))
    throw new Error('Invalid database namespace');
  sql = sql.replace(/julianday\(([^(),]+)(?:,\s*'(-\d+) days?')?\)/g, (_, value, days) => {
    const date =
      value.trim() === "'now'" ? 'UTC_TIMESTAMP(3)' : `REPLACE(REPLACE(${value},'T',' '),'Z','')`;
    return `(UNIX_TIMESTAMP(${date})${days ? ` - ${-Number(days) * 86400}` : ''})`;
  });
  sql = sql
    .replace(/\('method-'\|\|m\.id\)/g, "CONCAT('method-',m.id)")
    .replace(/json_extract\(([^,]+),\s*('[^']+')\)/gi, 'JSON_UNQUOTE(JSON_EXTRACT($1,$2))')
    .replace(/INSERT OR IGNORE INTO/gi, 'INSERT IGNORE INTO')
    .replace(/ON CONFLICT\([^)]*\) DO UPDATE SET/gi, 'ON DUPLICATE KEY UPDATE')
    .replace(/excluded\.([a-z_]+)/gi, 'VALUES($1)');
  sql = sql.replace(
    /count = count \+ 1 WHERE count < 9007199254740991/i,
    'count = IF(count < 9007199254740991, count + 1, count)',
  );
  sql = sql.replace(
    /last_attempt = VALUES\(last_attempt\)\s+WHERE last_attempt <= VALUES\(last_attempt\) - 300000/i,
    'last_attempt = IF(last_attempt <= VALUES(last_attempt) - 300000, VALUES(last_attempt), last_attempt)',
  );
  const tables = new Set(TABLES[namespace === 'stage' ? 'site' : namespace]);
  sql = sql.replace(/'(?:''|[^'])*'|\b[a-z_][a-z_0-9]*\b/gi, (token, index) => {
    if (token.startsWith("'")) return token;
    if (
      tables.has(token) &&
      (/\b(?:FROM|JOIN|UPDATE|INTO)\s*$/i.test(sql.slice(0, index)) ||
        /^\s*\./.test(sql.slice(index + token.length)))
    )
      return '`' + namespace + '_' + token + '`';
    if (
      ['key', 'cursor'].includes(token) ||
      (token === 'count' && !/^\s*\(/.test(sql.slice(index + token.length)))
    )
      return '`' + token + '`';
    return token;
  });
  if (
    /\b(?:julianday|RETURNING|rowid|MATCH|ON CONFLICT|excluded)\b/i.test(
      sql.replace(/'(?:''|[^'])*'/g, "''"),
    )
  )
    throw new Error('Unsupported database statement');
  return sql;
}

function safeInteger(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error('Database integer exceeds the safe range');
  return number;
}
export function connectTiDB(env) {
  return connect({
    host: env.TIDB_HOST,
    username: env.TIDB_USERNAME,
    password: env.TIDB_PASSWORD,
    database: env.TIDB_DATABASE,
    decoders: { BIGINT: safeInteger, 'UNSIGNED BIGINT': safeInteger },
    fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }),
  });
}

export function createTiDB(env, namespace, connection) {
  const conn = connection ?? connectTiDB(env);
  const result = (r) => ({
    success: true,
    results: r.rows ?? [],
    meta: { changes: r.rowsAffected > 0 ? 1 : 0 },
  });
  function prepare(sql, values = []) {
    const query = mysqlStatement(sql, namespace);
    return {
      query,
      values,
      bind(...args) {
        return prepare(sql, args);
      },
      async first() {
        return (await conn.execute(query, values))[0] ?? null;
      },
      async all() {
        return result(await conn.execute(query, values, { fullResult: true }));
      },
      async run() {
        return result(await conn.execute(query, values, { fullResult: true }));
      },
    };
  }
  return {
    dialect: 'mysql',
    prepare,
    async batch(statements) {
      const tx = await conn.begin();
      try {
        const results = [];
        for (const s of statements)
          results.push(result(await tx.execute(s.query, s.values, { fullResult: true })));
        await tx.commit();
        return results;
      } catch (error) {
        await tx.rollback().catch(() => {});
        throw error;
      }
    },
  };
}
