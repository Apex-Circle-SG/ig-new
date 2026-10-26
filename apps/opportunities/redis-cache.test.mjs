import test from 'node:test';
import assert from 'node:assert/strict';
import { cachedPublic, cacheDescriptor, invalidateCatalog } from './redis-cache.mjs';
const env = {
  UPSTASH_REDIS_REST_URL: 'https://cache.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'private-test-token',
};
function redisMock() {
  const values = new Map(),
    commands = [];
  return {
    values,
    commands,
    fetch: async (_url, options) => {
      assert.equal(options.redirect, 'manual');
      const command = JSON.parse(options.body);
      commands.push(command);
      if (command[0] === 'GET') return Response.json({ result: values.get(command[1]) || null });
      values.set(command[1], command[2]);
      return Response.json({ result: 'OK' });
    },
  };
}
test('Redis hit avoids D1 load, canonical order shares key, generation invalidates', async () => {
  const old = globalThis.fetch,
    mock = redisMock();
  globalThis.fetch = mock.fetch;
  let loads = 0;
  const load = async () => {
    loads++;
    return Response.json({ items: [{ title: 'Remote work' }] });
  };
  try {
    const a = new Request('https://api.test/v1/opportunities?category=jobs&paid=1');
    const b = new Request('https://api.test/v1/opportunities?paid=1&category=jobs');
    assert.equal((await cachedPublic(a, env, load)).headers.get('X-Catalog-Cache'), 'MISS');
    assert.equal((await cachedPublic(b, env, load)).headers.get('X-Catalog-Cache'), 'HIT');
    assert.equal(loads, 1);
    await invalidateCatalog(env);
    assert.equal((await cachedPublic(a, env, load)).headers.get('X-Catalog-Cache'), 'MISS');
    assert.equal(loads, 2);
    assert.ok(
      mock.commands.filter((c) => c[0] === 'SET' && c.includes('EX')).every((c) => c.at(-1) <= 600),
    );
  } finally {
    globalThis.fetch = old;
  }
});
test('Redis outage fails open; admin, posting, health and unknown filters bypass', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => {
    throw Error('offline');
  };
  try {
    const r = await cachedPublic(new Request('https://api.test/v1/stats'), env, () =>
      Response.json({ live: true }),
    );
    assert.equal((await r.json()).live, true);
    for (const path of [
      '/admin/social-preview',
      '/v1/automation',
      '/health',
      '/v1/opportunities?unknown=x',
    ])
      assert.equal(cacheDescriptor(new URL('https://api.test' + path)), null);
  } finally {
    globalThis.fetch = old;
  }
});
test('errors are not cached and expired listings get no Redis write', async () => {
  const old = globalThis.fetch,
    mock = redisMock();
  globalThis.fetch = mock.fetch;
  try {
    const req = new Request('https://api.test/v1/opportunities');
    await cachedPublic(req, env, () => Response.json({ error: 'down' }, { status: 503 }));
    await cachedPublic(req, env, () =>
      Response.json({
        items: [
          {
            last_seen_at: new Date().toISOString(),
            expires_at: new Date(Date.now() - 1000).toISOString(),
          },
        ],
      }),
    );
    assert.equal(mock.commands.filter((c) => c[0] === 'SET').length, 0);
  } finally {
    globalThis.fetch = old;
  }
});
test('concurrent misses coalesce, HEAD has no body, token stays out of cache entries', async () => {
  const old = globalThis.fetch,
    mock = redisMock();
  globalThis.fetch = mock.fetch;
  let loads = 0;
  try {
    const req = new Request('https://api.test/v1/stats');
    const load = async () => {
      loads++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return Response.json({ total: 3 });
    };
    await Promise.all(Array.from({ length: 8 }, () => cachedPublic(req, env, load)));
    assert.equal(loads, 1);
    const head = await cachedPublic(new Request(req.url, { method: 'HEAD' }), env, load);
    assert.equal(await head.text(), '');
    assert.ok(!JSON.stringify([...mock.values]).includes(env.UPSTASH_REDIS_REST_TOKEN));
  } finally {
    globalThis.fetch = old;
  }
});
