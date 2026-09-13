import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

const shared = globalThis as typeof globalThis & { __insightginieSecurityKey?: Buffer };
const configuredSecret = process.env.ASK_SECURITY_SECRET;
const processSecret =
  configuredSecret && /^[a-f0-9]{64}$/i.test(configuredSecret)
    ? Buffer.from(configuredSecret, 'hex')
    : (shared.__insightginieSecurityKey ??= randomBytes(32));
export const SECURITY_COOKIE = 'ig_ask_security';
const duration = 10 * 60_000;
const signature = (message: string) =>
  createHmac('sha256', processSecret).update(message).digest('hex');

export function issueRequestToken(now = Date.now()) {
  const nonce = randomBytes(24).toString('hex');
  const value = `${nonce}.${now + duration}`;
  return { nonce, token: `${value}.${signature(value)}` };
}
export function validRequestToken(token: string, cookie: string, now = Date.now()) {
  const [nonce, expiry, mac, extra] = token.split('.');
  if (
    extra ||
    !/^[a-f0-9]{48}$/.test(nonce ?? '') ||
    !/^\d{13}$/.test(expiry ?? '') ||
    !/^[a-f0-9]{64}$/.test(mac ?? '')
  )
    return false;
  if (nonce !== cookie || Number(expiry) <= now || Number(expiry) > now + duration) return false;
  return timingSafeEqual(
    Buffer.from(mac, 'hex'),
    Buffer.from(signature(`${nonce}.${expiry}`), 'hex'),
  );
}
export function securityCookie(request: Request) {
  return (
    (request.headers.get('cookie') ?? '')
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SECURITY_COOKIE}=`))
      ?.slice(SECURITY_COOKIE.length + 1) ?? ''
  );
}
export function trustedOrigin(
  request: Request,
  siteOrigin = process.env.APP_SITE_ORIGIN ?? 'https://insightginie.com',
) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  return origin === siteOrigin && (!fetchSite || fetchSite === 'same-origin');
}

/** Rotating process-key HMAC only, never raw addresses in stored buckets or logs. */
export function requestBucket(request: Request) {
  const address = request.headers.get('cf-connecting-ip') ?? '';
  return signature(address.length <= 45 && isIP(address) ? address : 'unknown');
}
export function createRequestLimiter(maximum = 20, windowMs = 60_000, maxBuckets = 4096) {
  const buckets = new Map<string, { count: number; expires: number }>();
  let global = { count: 0, expires: 0 };
  return (key: string, now = Date.now()) => {
    if (global.expires <= now) {
      global = { count: 0, expires: now + windowMs };
      for (const [id, value] of buckets) if (value.expires <= now) buckets.delete(id);
    }
    if (global.count >= 500) return false;
    const found = buckets.get(key);
    if (!found || found.expires <= now) {
      if (!found && buckets.size >= maxBuckets) return false;
      buckets.set(key, { count: 1, expires: now + windowMs });
    } else {
      if (found.count >= maximum) return false;
      found.count += 1;
    }
    global.count += 1;
    return true;
  };
}

export async function readBoundedJson(
  request: Request,
  maxBytes = 8192,
  timeoutMs = 5000,
): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > maxBytes || !request.body) return undefined;
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const read = async () => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          void reader.cancel().catch(() => undefined);
          return undefined;
        }
        chunks.push(value);
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    } catch {
      return undefined;
    } finally {
      reader.releaseLock();
    }
  };
  try {
    return await Promise.race([
      read(),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => {
          void reader.cancel().catch(() => undefined);
          resolve(undefined);
        }, timeoutMs);
        timer.unref();
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
