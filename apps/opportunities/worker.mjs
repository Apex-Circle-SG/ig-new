import { FEEDS, normalize, searchQuery, publicOpportunity } from './catalog.mjs';
import { FEED_CONFIG } from './feed-config.mjs';
import { publishDaily } from './social.mjs';

function json(data, status = 200, cache = true) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': cache && status === 200 ? 'public, max-age=60, s-maxage=120' : 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}

async function allowed(request, secret) {
  const value = request.headers.get('Authorization');
  if (!secret || !value) return false;
  const encoder = new TextEncoder();
  const hash = async (x) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(x)));
  const [a, b] = await Promise.all([hash(value), hash(`Bearer ${secret}`)]);
  return a.reduce((v, x, i) => v | (x ^ b[i]), 0) === 0;
}

export async function ingestSource(env, source, batchIndex) {
  if (!Object.hasOwn(FEEDS, source)) throw new Error('Unknown source');
  const policy = await env.DB.prepare('SELECT status FROM sources WHERE id = ?')
    .bind(source)
    .first();
  if (policy?.status !== 'enabled') return { source, skipped: true };
  const started = new Date().toISOString();
  try {
    const response = await fetch(FEEDS[source], {
      headers: {
        'User-Agent': 'InsightGinie/1.0 (https://insightginie.com/opportunities/)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(18000),
      redirect: 'manual',
    });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
    const body = await response.text();
    if (body.length > 6000000) throw new Error('Feed exceeds configured size limit');
    const normalized = normalize(source, JSON.parse(body), started);
    const all = normalized.slice(0, 1000);
    if (source === 'github-bounties')
      await env.DB.prepare(
        "UPDATE opportunities SET status='closed' WHERE source_id='github-bounties' AND source_url NOT LIKE 'https://github.com/tenstorrent/%'",
      ).run();
    const batches = Math.max(1, Math.ceil(all.length / 25));
    const cursor = await env.DB.prepare('SELECT cursor FROM source_cursors WHERE source_id=?')
      .bind(source)
      .first();
    const selected = (batchIndex ?? cursor?.cursor ?? 0) % batches;
    const records = all.slice(selected * 25, (selected + 1) * 25);
    // A valid empty complete employer board is an absence signal, not a fetch failure.
    if (!records.length && !FEED_CONFIG[source].complete)
      throw new Error('Feed contains no eligible records');
    const fields = records.length ? Object.keys(records[0]) : [];
    const sql = `INSERT INTO opportunities (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')}) ON CONFLICT(source_id, external_id) DO UPDATE SET ${fields
      .filter((key) => !['id', 'source_id', 'external_id'].includes(key))
      .map((key) => `${key}=excluded.${key}`)
      .join(',')}`;
    for (let i = 0; i < records.length; i += 25) {
      await env.DB.batch(
        records
          .slice(i, i + 25)
          .map((record) => env.DB.prepare(sql).bind(...fields.map((key) => record[key]))),
      );
    }
    await env.DB.prepare(
      'INSERT INTO source_cursors VALUES(?,?) ON CONFLICT(source_id) DO UPDATE SET cursor=excluded.cursor',
    )
      .bind(source, (selected + 1) % batches)
      .run();
    const complete =
      FEED_CONFIG[source].complete &&
      normalized.length <= 1000 &&
      (FEED_CONFIG[source].kind !== 'bounties' ||
        JSON.parse(body).total_count <= JSON.parse(body).items.length) &&
      (FEED_CONFIG[source].kind !== 'greenhouse' ||
        Number(dataTotal(body)) === JSON.parse(body).jobs.length);
    if (complete) {
      const current = await env.DB.prepare(
        "SELECT id FROM opportunities WHERE source_id=? AND status='active' LIMIT 1200",
      )
        .bind(source)
        .all();
      const present = new Set(all.map((item) => item.id));
      const missing = current.results.filter((item) => !present.has(item.id)).slice(0, 25);
      if (missing.length)
        await env.DB.prepare(
          `UPDATE opportunities SET status='closed' WHERE id IN (${missing.map(() => '?').join(',')})`,
        )
          .bind(...missing.map((item) => item.id))
          .run();
    }
    await env.DB.prepare(
      'UPDATE sources SET last_success=?, last_error=NULL,last_count=? WHERE id=?',
    )
      .bind(started, records.length, source)
      .run();
    await env.DB.prepare('INSERT INTO ingestion_runs VALUES(?,?,?,?,?,?,?)')
      .bind(
        crypto.randomUUID(),
        source,
        started,
        new Date().toISOString(),
        'success',
        records.length,
        null,
      )
      .run();
    return {
      source,
      records: records.length,
      available: all.length,
      batch: selected,
      batches,
      status: 'success',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 120) : 'Import failed';
    await env.DB.prepare('UPDATE sources SET last_error=? WHERE id=?').bind(message, source).run();
    await env.DB.prepare('INSERT INTO ingestion_runs VALUES(?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), source, started, new Date().toISOString(), 'failed', 0, message)
      .run();
    return { source, status: 'failed', error: message };
  }
}

async function cleanup(env) {
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE opportunities SET status='stale' WHERE status='active' AND julianday(last_seen_at) < julianday('now','-7 days')",
    ),
    env.DB.prepare(
      "DELETE FROM ingestion_runs WHERE julianday(started_at) < julianday('now','-30 days')",
    ),
    env.DB.prepare(
      "DELETE FROM opportunities WHERE status IN ('stale','closed') AND julianday(last_seen_at) < julianday('now','-60 days')",
    ),
  ]);
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/admin/check-methods' && request.method === 'POST') {
        if (!(await allowed(request, env.INGEST_SECRET)))
          return json({ error: 'Unauthorized' }, 401, false);
        const slot = Number(url.searchParams.get('slot'));
        if (!Number.isInteger(slot) || slot < 0 || slot > 3)
          return json({ error: 'Invalid slot' }, 400, false);
        const now = Date.now();
        const current = Math.floor(now / (6 * 3600000)) % 4;
        return json(
          await checkMethods(env, now - ((current - slot + 4) % 4) * 6 * 3600000),
          200,
          false,
        );
      }
      if (url.pathname === '/admin/social-preview' && request.method === 'POST') {
        if (!(await allowed(request, env.INGEST_SECRET)))
          return json({ error: 'Unauthorized' }, 401, false);
        return json(await publishDaily(env, Date.now(), { dryRun: true }), 200, false);
      }
      if (url.pathname === '/admin/ingest' && request.method === 'POST') {
        if (!(await allowed(request, env.INGEST_SECRET)))
          return json({ error: 'Unauthorized' }, 401, false);
        const source = url.searchParams.get('source');
        if (!source || !Object.hasOwn(FEEDS, source))
          return json({ error: 'Choose a supported source' }, 400, false);
        const batch = url.searchParams.has('batch')
          ? Number(url.searchParams.get('batch'))
          : undefined;
        if (batch !== undefined && (!Number.isInteger(batch) || batch < 0 || batch > 39))
          return json({ error: 'Invalid batch' }, 400, false);
        return json(await ingestSource(env, source, batch), 200, false);
      }
      if (request.method !== 'GET' && request.method !== 'HEAD')
        return json({ error: 'Method not allowed' }, 405, false);
      if (url.pathname === '/health') {
        const result = await env.DB.prepare(
          'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1',
        ).first();
        return json({ status: 'ok', schema: result.version }, 200, false);
      }
      if (url.pathname === '/v1/stats') {
        const query = searchQuery(new URLSearchParams());
        const counts = await env.DB.prepare(
          `SELECT COUNT(*) AS total FROM opportunities o WHERE ${query.where}`,
        ).first();
        const categories = await env.DB.prepare(
          `SELECT o.category,COUNT(*) AS total FROM opportunities o WHERE ${query.where} GROUP BY o.category`,
        ).all();
        const methods = await env.DB.prepare(
          'SELECT COUNT(*) AS total FROM earning_methods',
        ).first();
        const ideas = await env.DB.prepare('SELECT COUNT(*) AS total FROM ideas').first();
        const platforms = await env.DB.prepare('SELECT COUNT(*) AS total FROM platforms').first();
        const sources = await env.DB.prepare(
          'SELECT id,name,status,last_success,last_error,last_count,url,category FROM sources ORDER BY name',
        ).all();
        return json({
          opportunities: counts.total,
          categories: categories.results,
          methods: methods.total,
          ideas: ideas.total,
          platforms: platforms.total,
          sources: sources.results,
          updated_at: new Date().toISOString(),
        });
      }
      if (url.pathname === '/v1/opportunities') {
        const query = searchQuery(url.searchParams);
        const total = await env.DB.prepare(
          `SELECT COUNT(*) AS total FROM opportunities o WHERE ${query.where}`,
        )
          .bind(...query.values)
          .first();
        const result = await env.DB.prepare(
          `SELECT o.*,s.name AS source_name FROM opportunities o JOIN sources s ON o.source_id=s.id WHERE ${query.where} ORDER BY o.published_at DESC,o.id LIMIT ? OFFSET ?`,
        )
          .bind(...query.values, query.limit, query.offset)
          .all();
        return json({
          items: result.results.map(publicOpportunity),
          total: total.total,
          page: query.page,
          pages: Math.ceil(total.total / query.limit),
        });
      }
      if (url.pathname.startsWith('/v1/opportunities/')) {
        const id = url.pathname.slice('/v1/opportunities/'.length);
        if (!/^[a-zA-Z0-9_-]{1,200}$/.test(id)) return json({ error: 'Not found' }, 404);
        const row = await env.DB.prepare(
          'SELECT o.*,s.name AS source_name,s.status AS source_status FROM opportunities o JOIN sources s ON o.source_id=s.id WHERE o.id=?',
        )
          .bind(id)
          .first();
        if (
          row &&
          (row.source_status !== 'enabled' ||
            Date.parse(row.last_seen_at) < Date.now() - 7 * 86400000 ||
            (row.expires_at && Date.parse(row.expires_at) <= Date.now()))
        )
          row.status = 'stale';
        return row ? json(publicOpportunity(row)) : json({ error: 'Not found' }, 404);
      }
      if (url.pathname === '/v1/methods') {
        const rows = await env.DB.prepare(
          'SELECT * FROM earning_methods ORDER BY category,title',
        ).all();
        return json({
          items: rows.results.map((row) => ({
            ...JSON.parse(row.data),
            last_checked: row.last_checked,
            check_status: row.check_status,
          })),
        });
      }
      if (url.pathname === '/v1/automation') {
        const posts = await env.DB.prepare(
          'SELECT day,status,finished_at,error_code FROM social_posts ORDER BY day DESC LIMIT 7',
        ).all();
        return json({
          ingestion:
            'Every 10 minutes, one source and rotating batch; every source visited within two hours',
          methodChecks: 'Every method checked daily in four batches',
          linkedin: {
            enabled: env.LINKEDIN_ENABLED === 'true',
            schedule: 'Daily 09:00 Asia/Singapore',
            recent: posts.results,
          },
        });
      }
      if (url.pathname === '/v1/ideas') {
        const result = await env.DB.prepare('SELECT * FROM ideas ORDER BY category,title').all();
        return json({
          items: result.results.map((row) => ({ ...row, skills: JSON.parse(row.skills) })),
        });
      }
      if (url.pathname === '/v1/platforms')
        return json({
          items: (await env.DB.prepare('SELECT * FROM platforms ORDER BY category,name').all())
            .results,
        });
      return json({ error: 'Not found' }, 404);
    } catch {
      return json({ error: 'Catalog temporarily unavailable' }, 503, false);
    }
  },
  async scheduled(event, env) {
    if (event.cron === '0 1 * * *') return publishDaily(env, event.scheduledTime);
    if (event.cron === '10 0,6,12,18 * * *') {
      await checkMethods(env, event.scheduledTime);
      await cleanup(env);
      return;
    }
    const keys = Object.keys(FEEDS);
    const slot = Math.floor(event.scheduledTime / 600000) % keys.length;
    await ingestSource(env, keys[slot]);
  },
};
function dataTotal(body) {
  const data = JSON.parse(body);
  return data.meta?.total ?? data.jobs?.length;
}
export async function checkMethods(env, time) {
  const rows = await env.DB.prepare('SELECT id,data FROM earning_methods ORDER BY id').all();
  const slot = Math.floor(time / (6 * 3600000)) % 4;
  const selected = rows.results.filter((_, i) => i % 4 === slot);
  const statements = [];
  for (const row of selected) {
    const method = JSON.parse(row.data);
    let status = 'unavailable',
      http = null;
    try {
      let response = await fetch(method.source_url, {
        method: 'HEAD',
        headers: {
          'User-Agent':
            'InsightGinie source-check (https://insightginie.com/opportunities/sources/)',
        },
        signal: AbortSignal.timeout(8000),
        redirect: 'manual',
      });
      if ([403, 404, 405, 410].includes(response.status)) {
        response = await fetch(method.source_url, {
          method: 'GET',
          headers: { Range: 'bytes=0-1023', 'User-Agent': 'InsightGinie source-check' },
          signal: AbortSignal.timeout(8000),
          redirect: 'manual',
        });
        await response.body?.cancel();
      }
      http = response.status;
      status =
        http === 200 || http === 206
          ? 'reachable'
          : [301, 302, 303, 307, 308].includes(http)
            ? 'redirected'
            : [404, 410].includes(http)
              ? 'removed'
              : 'check-needed';
    } catch {
      status = 'check-needed';
    }
    statements.push(
      env.DB.prepare(
        'UPDATE earning_methods SET last_checked=?,check_status=?,last_http_status=? WHERE id=?',
      ).bind(new Date(time).toISOString(), status, http, row.id),
    );
  }
  if (statements.length) await env.DB.batch(statements);
  return { checked: statements.length };
}
export default worker;
