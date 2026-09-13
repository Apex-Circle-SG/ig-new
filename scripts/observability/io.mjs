import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, open, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { ObservabilityError } from './config.mjs';

export async function readSmallJson(filename, fallback, maximumBytes = 65_536) {
  let file;
  try {
    file = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > maximumBytes)
      throw new ObservabilityError('invalid_state_file');
    const data = await file.readFile('utf8');
    if (Buffer.byteLength(data) > maximumBytes) throw new ObservabilityError('invalid_state_file');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw new ObservabilityError('state_read_failed');
  } finally {
    await file?.close();
  }
}
export async function atomicJson(filename, value) {
  const temporary = `${filename}.${randomUUID()}.tmp`;
  let file;
  try {
    file = await open(temporary, 'wx', 0o600);
    await file.writeFile(JSON.stringify(value));
    await file.sync();
    await file.close();
    file = undefined;
    await rename(temporary, filename);
  } finally {
    await file?.close();
    await unlink(temporary).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}
export async function withStateLock(directory, name, work) {
  if (!directory || !path.isAbsolute(directory))
    throw new ObservabilityError('missing_state_directory');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const lockPath = path.join(directory, `.${name}.lock`);
  let lock;
  try {
    lock = await open(lockPath, 'wx', 0o600);
  } catch {
    throw new ObservabilityError('operation_locked');
  }
  try {
    return await work();
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
export async function requestJson(
  fetcher,
  url,
  options,
  { timeoutMs = 5000, maxBytes = 65_536 } = {},
) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ObservabilityError('request_timeout'));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await fetcher(url, {
          ...options,
          signal: controller.signal,
          redirect: 'error',
        });
        const reader = response.body?.getReader();
        const chunks = [];
        let size = 0;
        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              size += value.byteLength;
              if (size > maxBytes) {
                controller.abort();
                void reader.cancel().catch(() => {});
                throw new ObservabilityError('response_too_large');
              }
              chunks.push(value);
            }
          } finally {
            reader.releaseLock();
          }
        }
        let data = null;
        const text = Buffer.concat(chunks).toString('utf8');
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new ObservabilityError('invalid_provider_response');
          }
        }
        return { status: response.status, data };
      })(),
      timeout,
    ]);
  } catch (error) {
    throw error instanceof ObservabilityError
      ? error
      : new ObservabilityError('provider_request_failed');
  } finally {
    clearTimeout(timer);
  }
}
