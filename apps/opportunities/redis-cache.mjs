// Public catalog data only. Never cache credentials, chat or posting state.
const PREFIX = 'insightginie:catalog:v1:';
const pending = new Map();
export async function redisCommand(env, command) {
  const endpoint = new URL(env.UPSTASH_REDIS_REST_URL);
  if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.upstash.io'))
    throw new Error('Invalid cache endpoint');
  const response = await fetch(endpoint.origin, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(1500),
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('Cache unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Cache command failed');
  return data.result;
}
export async function invalidateCatalog(env) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return;
  try {
    await redisCommand(env, ['SET', PREFIX + 'generation', crypto.randomUUID()]);
  } catch {
    /* Cached data still expires within its bounded TTL. */
  }
}
export function cacheDescriptor(url) {
  if (['/v1/stats', '/v1/methods', '/v1/ideas', '/v1/platforms'].includes(url.pathname))
    return { identity: url.pathname, ttl: 600 };
  if (url.pathname === '/v1/opportunities') {
    const allowed = ['q', 'category', 'location', 'arrangement', 'paid', 'page', 'limit'];
    const params = new URLSearchParams();
    for (const name of allowed)
      if (url.searchParams.has(name)) params.set(name, url.searchParams.get(name).slice(0, 200));
    params.sort();
    // Never merge unknown filters or truncate queries into a different cached answer.
    if ([...url.searchParams].some(([k, v]) => !allowed.includes(k) || v.length > 200)) return null;
    return { identity: url.pathname + '?' + params, ttl: 600 };
  }
  return null;
}
export async function cachedPublic(request, env, load) {
  const spec = ['GET', 'HEAD'].includes(request.method) && cacheDescriptor(new URL(request.url));
  if (!spec || !env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return load();
  let key;
  try {
    const generation = (await redisCommand(env, ['GET', PREFIX + 'generation'])) || 'initial';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(spec.identity));
    key =
      PREFIX +
      generation +
      ':' +
      [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
    const hit = await redisCommand(env, ['GET', key]);
    if (hit) {
      const entry = JSON.parse(hit);
      if (entry.expiresAt > Date.now() && typeof entry.body === 'string')
        return new Response(request.method === 'HEAD' ? null : entry.body, {
          headers: { ...entry.headers, 'X-Catalog-Cache': 'HIT' },
        });
    }
  } catch {
    return load();
  }
  // Coalesce simultaneous cache misses inside each Worker isolate.
  if (!pending.has(key))
    pending.set(
      key,
      (async () => {
        const response = await load();
        const body = await response.clone().text();
        const headers = Object.fromEntries(response.headers);
        let ttl = spec.ttl;
        if (response.ok) {
          const data = JSON.parse(body);
          // Do not serve listed jobs past an explicit expiry or stale threshold.
          for (const item of data.items || [])
            if (item.last_seen_at) {
              for (const deadline of [
                Date.parse(item.last_seen_at) + 7 * 86400000,
                Date.parse(item.expires_at),
              ])
                if (Number.isFinite(deadline))
                  ttl = Math.min(ttl, Math.floor((deadline - Date.now()) / 1000));
            }
          if (ttl > 0 && body.length < 750000)
            try {
              await redisCommand(env, [
                'SET',
                key,
                JSON.stringify({ body, headers, expiresAt: Date.now() + ttl * 1000 }),
                'EX',
                ttl,
              ]);
            } catch {
              /* D1 result remains usable if Redis fails. */
            }
        }
        return { body, headers, status: response.status };
      })().finally(() => pending.delete(key)),
    );
  const result = await pending.get(key);
  return new Response(request.method === 'HEAD' ? null : result.body, {
    status: result.status,
    headers: { ...result.headers, 'X-Catalog-Cache': result.status === 200 ? 'MISS' : 'BYPASS' },
  });
}
