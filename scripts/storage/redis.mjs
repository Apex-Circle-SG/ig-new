export async function redisCommand(env, command) {
  const endpoint = new URL(env.UPSTASH_REDIS_REST_URL);
  if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.upstash.io'))
    throw new Error('Invalid cache endpoint');
  const response = await fetch(endpoint.origin, {
    method: 'POST',
    redirect: 'manual',
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

const LIMIT = `
local global = redis.call('INCR', KEYS[1])
if global == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
if global > 500 then return 0 end
local client = redis.call('INCR', KEYS[2])
if client == 1 then redis.call('PEXPIRE', KEYS[2], ARGV[1]) end
if client > tonumber(ARGV[2]) then return 0 end
return 1`;

export async function rateLimit(env, namespace, key, maximum, windowMs) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)));
  const digest = [...hash].map((x) => x.toString(16).padStart(2, '0')).join('');
  const prefix = `insightginie:limits:v1:${env.TIDB_NAMESPACE ?? 'site'}:${namespace}:`;
  try {
    return (
      (await redisCommand(env, [
        'EVAL',
        LIMIT,
        2,
        prefix + 'global',
        prefix + digest,
        windowMs,
        maximum,
      ])) === 1
    );
  } catch {
    return false;
  } // Fail closed: Redis outages must not bypass abuse limits.
}
