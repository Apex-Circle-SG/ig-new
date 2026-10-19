import { FEEDS, normalize, searchQuery, publicOpportunity } from './catalog.mjs';

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
    const all = normalize(source, JSON.parse(body), started).slice(0, 150);
    const batches = Math.max(1, Math.ceil(all.length / 25));
    const selected = batchIndex ?? Math.floor(Date.parse(started) / (3 * 3600000)) % batches;
    const records = all.slice(selected * 25, (selected + 1) * 25);
    if (!records.length) throw new Error('Feed contains no eligible recent remote records');
    const fields = Object.keys(records[0]);
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
      "DELETE FROM opportunities WHERE status='stale' AND julianday(last_seen_at) < julianday('now','-60 days')",
    ),
  ]);
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/admin/ingest' && request.method === 'POST') {
        if (!(await allowed(request, env.INGEST_SECRET)))
          return json({ error: 'Unauthorized' }, 401, false);
        const source = url.searchParams.get('source');
        if (!source || !Object.hasOwn(FEEDS, source))
          return json({ error: 'Choose a supported source' }, 400, false);
        const batch = url.searchParams.has('batch')
          ? Number(url.searchParams.get('batch'))
          : undefined;
        if (batch !== undefined && (!Number.isInteger(batch) || batch < 0 || batch > 5))
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
        const counts = await env.DB.prepare(
          "SELECT COUNT(*) AS total FROM opportunities WHERE status='active' AND julianday(last_seen_at)>julianday('now','-7 days')",
        ).first();
        const ideas = await env.DB.prepare('SELECT COUNT(*) AS total FROM ideas').first();
        const platforms = await env.DB.prepare('SELECT COUNT(*) AS total FROM platforms').first();
        const sources = await env.DB.prepare(
          'SELECT id,name,status,last_success,last_error,last_count,url,category FROM sources ORDER BY name',
        ).all();
        return json({
          opportunities: counts.total,
          ideas: ideas.total,
          platforms: platforms.total,
          sources: sources.results,
          updated_at: new Date().toISOString(),
        });
      }
      if (url.pathname === '/v1/opportunities') {
        const query = searchQuery(url.searchParams);
        const category = url.searchParams.get('category');
        if (category && category !== 'jobs')
          return json({ items: [], total: 0, page: query.page, pages: 0 });
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
          'SELECT o.*,s.name AS source_name FROM opportunities o JOIN sources s ON o.source_id=s.id WHERE o.id=?',
        )
          .bind(id)
          .first();
        return row ? json(publicOpportunity(row)) : json({ error: 'Not found' }, 404);
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
    // Stagger provider imports so one feed and its bounded writes fit each run.
    const keys = Object.keys(FEEDS);
    const slot = Math.floor(event.scheduledTime / 3600000) % keys.length;
    await ingestSource(env, keys[slot]);
    await cleanup(env);
  },
};
export default worker;
