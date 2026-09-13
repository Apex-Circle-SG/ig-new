import { mkdir, readFile, writeFile, rename, open, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import {
  createSnapshot,
  normalizeWordPressPost,
  sha256,
  validateSnapshot,
} from '../../apps/web/src/lib/content/normalize';
import {
  WORDPRESS_ORIGIN,
  type ContentRecord,
  type ContentSnapshot,
} from '../../apps/web/src/lib/content/schema';

export class SourceRateLimitError extends Error {
  constructor(public retryAfter: string | null) {
    super('wordpress_rate_limited');
  }
}

export async function fetchPost(id: number, fetcher: typeof fetch = fetch) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('invalid_post_id');
  const endpoint = new URL(`/wp-json/wp/v2/posts/${id}`, WORDPRESS_ORIGIN);
  endpoint.searchParams.set('_embed', 'author,wp:featuredmedia,wp:term');
  const response = await fetcher(endpoint.href, {
    method: 'GET',
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: 'application/json',
      'User-Agent': 'InsightGinie-ReadOnly-ContentSync/1.0 (+https://insightginie.com/about/)',
    },
  });
  if (response.status === 429) throw new SourceRateLimitError(response.headers.get('retry-after'));
  if (!response.ok) throw new Error(`wordpress_http_${response.status}`);
  if (!/application\/json/i.test(response.headers.get('content-type') ?? ''))
    throw new Error('wordpress_response_not_json');
  if (Number(response.headers.get('content-length')) > 3_000_000)
    throw new Error('wordpress_payload_too_large');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('wordpress_response_empty');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 3_000_000) {
        await reader.cancel();
        throw new Error('wordpress_payload_too_large');
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = Buffer.concat(chunks).toString('utf8');
  const raw: unknown = JSON.parse(body);
  const record = normalizeWordPressPost(raw, new Date().toISOString());
  if (record.wpId !== id) throw new Error('wordpress_response_id_mismatch');
  return { raw, record };
}

export async function readLastGood(root: string): Promise<ContentSnapshot | null> {
  try {
    return validateSnapshot(JSON.parse(await readFile(join(root, 'last-good.json'), 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function writeImmutable(path: string, value: unknown) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  try {
    await writeFile(path, text, { flag: 'wx' });
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code !== 'EEXIST' ||
      (await readFile(path, 'utf8')) !== text
    )
      throw error;
  }
}

export async function publishSnapshot(
  root: string,
  records: ContentRecord[],
  generatedAt?: string,
) {
  // Validation completes before the immutable version or current pointer changes.
  const snapshot = createSnapshot(records, generatedAt);
  await mkdir(join(root, 'versions'), { recursive: true });
  const previous = await readLastGood(root);
  if (previous?.versionId === snapshot.versionId) return { snapshot: previous, changed: false };
  await writeImmutable(join(root, 'versions', `${snapshot.versionId}.json`), snapshot);
  const temporary = join(root, `.last-good-${process.pid}-${Date.now()}.tmp`);
  const handle = await open(temporary, 'wx');
  try {
    await handle.writeFile(`${JSON.stringify(snapshot, null, 2)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, join(root, 'last-good.json'));
  return { snapshot, changed: true };
}

export async function saveRaw(root: string, raw: unknown) {
  const checksum = sha256(JSON.stringify(raw));
  await mkdir(join(root, 'raw'), { recursive: true });
  await writeImmutable(join(root, 'raw', `${checksum}.json`), raw);
  return checksum;
}

export async function withSyncLock<T>(root: string, run: () => Promise<T>): Promise<T> {
  await mkdir(root, { recursive: true });
  const path = join(root, '.sync.lock');
  const lock = await open(path, 'wx');
  try {
    await lock.writeFile(String(process.pid));
    return await run();
  } finally {
    await lock.close();
    await unlink(path);
  }
}
