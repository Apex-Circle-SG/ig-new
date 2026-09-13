import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { join } from 'node:path';
import { eventNames, experienceIds } from '@insightginie/analytics';
import { PUBLIC_ROUTE_IDS } from '@insightginie/seo';

const maximumBodyBytes = 1024;
const routeIds = new Set(Object.values(PUBLIC_ROUTE_IDS));
const events = new Set<string>(['page_view', ...eventNames]);
const interactions = new Set(['form', 'example', 'what-if', 'copy-link']);
type AggregateKey = string;
type DailyCounts = { day: string; counts: Record<AggregateKey, number> };
type CollectionOptions = {
  directory?: string;
  now?: () => number;
  siteOrigin?: string;
  bodyTimeoutMs?: number;
};

function validEvent(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  const allowed = ['event', 'route_id', 'calculator_id', 'interaction'];
  if (Object.keys(event).some((key) => !allowed.includes(key))) return false;
  if (typeof event.event !== 'string' || !events.has(event.event)) return false;
  if (typeof event.route_id !== 'string' || !routeIds.has(event.route_id)) return false;
  if (event.event === 'page_view') return Object.keys(event).length === 2;
  if (
    typeof event.calculator_id !== 'string' ||
    !(experienceIds as readonly string[]).includes(event.calculator_id)
  )
    return false;
  return (
    !Object.hasOwn(event, 'interaction') ||
    (typeof event.interaction === 'string' && interactions.has(event.interaction))
  );
}

function eventKey(event: Record<string, string>) {
  return [event.route_id, event.event, event.calculator_id ?? '', event.interaction ?? ''].join(
    '|',
  );
}

function validKey(key: string) {
  const parts = key.split('|');
  if (parts.length !== 4) return false;
  const [route_id, event, calculator_id, interaction] = parts;
  return validEvent({
    route_id,
    event,
    ...(calculator_id ? { calculator_id } : {}),
    ...(interaction ? { interaction } : {}),
  });
}

async function readCounts(filename: string, day: string): Promise<DailyCounts> {
  let text: string;
  try {
    text = await readFile(filename, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { day, counts: {} };
    throw error;
  }
  const data = JSON.parse(text) as DailyCounts;
  if (
    !data ||
    data.day !== day ||
    !data.counts ||
    typeof data.counts !== 'object' ||
    Array.isArray(data.counts) ||
    Object.keys(data).some((key) => key !== 'day' && key !== 'counts') ||
    Object.entries(data.counts).some(
      ([key, count]) => !validKey(key) || !Number.isSafeInteger(count) || count < 0,
    )
  )
    throw new Error('Invalid aggregate file');
  return data;
}

async function readSmallJson(request: Request, timeoutMs: number) {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > maximumBodyBytes) {
    void request.body?.cancel().catch(() => undefined);
    return undefined;
  }
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const read = async () => {
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maximumBodyBytes) {
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
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      // Do not wait for an underlying connection's cancellation to settle.
      void reader.cancel().catch(() => undefined);
      resolve(undefined);
    }, timeoutMs);
    timer.unref();
  });
  try {
    return await Promise.race([read(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Single Node process only. No event rows, IP addresses or identifiers reach disk. */
export function createAggregateCollector(options: CollectionOptions) {
  const now = options.now ?? Date.now;
  const siteOrigin = options.siteOrigin ?? 'https://insightginie.com';
  const addresses = new Map<string, { expires: number; count: number }>();
  let nextPrune = 0;
  let writes: Promise<void> = Promise.resolve();
  let pendingWrites = 0;
  let activeBodyReaders = 0;
  const respond = (status: number) =>
    new Response(null, {
      status,
      headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });

  return async function collect(request: Request) {
    if (!options.directory) return respond(204);
    if (
      request.headers.get('x-insightginie-consent') !== 'allow' ||
      request.headers.get('sec-gpc') === '1' ||
      request.headers.get('dnt') === '1'
    )
      return respond(204);
    const origin = request.headers.get('origin');
    const fetchSite = request.headers.get('sec-fetch-site');
    const requestOrigin = new URL(request.url).origin;
    if (
      !origin ||
      (origin !== requestOrigin && origin !== siteOrigin) ||
      (fetchSite !== null && fetchSite !== 'same-origin')
    )
      return respond(403);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? ''))
      return respond(415);

    const timestamp = now();
    if (timestamp >= nextPrune) {
      for (const [address, limit] of addresses)
        if (limit.expires <= timestamp) addresses.delete(address);
      nextPrune = timestamp + 60_000;
    }
    // Cloudflare supplies this header through the local tunnel. It is used in
    // memory for one rate-limit window and is never added to events or logs.
    const suppliedAddress = request.headers.get('cf-connecting-ip') ?? '';
    const address =
      suppliedAddress.length <= 45 && isIP(suppliedAddress) ? suppliedAddress : 'unknown';
    const existing = addresses.get(address);
    if ((!existing && addresses.size >= 5000) || pendingWrites >= 100 || activeBodyReaders >= 100)
      return respond(429);
    if (existing && existing.expires > timestamp) {
      if (existing.count >= 60) return respond(429);
      existing.count += 1;
    } else {
      const limit = { expires: timestamp + 60_000, count: 1 };
      addresses.set(address, limit);
      setTimeout(() => {
        if (addresses.get(address) === limit) addresses.delete(address);
      }, 60_000).unref();
    }

    activeBodyReaders += 1;
    let event: unknown;
    try {
      event = await readSmallJson(request, options.bodyTimeoutMs ?? 5000);
    } finally {
      activeBodyReaders -= 1;
    }
    if (!validEvent(event)) return respond(400);
    if (pendingWrites >= 100) return respond(429);
    const day = new Date(timestamp).toISOString().slice(0, 10);
    const key = eventKey(event);
    const directory = options.directory;
    const write = async () => {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const filename = join(directory, `${day}.json`);
      const counts = await readCounts(filename, day);
      if ((counts.counts[key] ?? 0) >= Number.MAX_SAFE_INTEGER)
        throw new Error('Aggregate overflow');
      counts.counts[key] = (counts.counts[key] ?? 0) + 1;
      const temporary = join(directory, `.${day}.${process.pid}.${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, `${JSON.stringify(counts)}\n`, { mode: 0o600, flag: 'wx' });
        await rename(temporary, filename);
      } finally {
        await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        });
      }
      const cutoff = new Date(timestamp - 29 * 86_400_000).toISOString().slice(0, 10);
      for (const file of await readdir(directory)) {
        if (/^\d{4}-\d{2}-\d{2}\.json$/.test(file) && file.slice(0, 10) < cutoff)
          await unlink(join(directory, file)).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== 'ENOENT') throw error;
          });
      }
    };
    pendingWrites += 1;
    const committed = writes.then(write);
    writes = committed.catch(() => undefined);
    try {
      await committed;
      return respond(204);
    } catch {
      return respond(503);
    } finally {
      pendingWrites -= 1;
    }
  };
}
