import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const OPERATION_CODES = [
  'ask_answer',
  'ask_refusal',
  'ask_fallback',
  'ask_error',
  'feedback_source',
  'feedback_unclear',
  'feedback_unsafe',
  'ingest_success',
  'ingest_failure',
  'datadog_delivery_failure',
] as const;
export type OperationCode = (typeof OPERATION_CODES)[number];
type Counts = { day: string; counts: Partial<Record<OperationCode, number>> };

/** Aggregate service-health counts only. No free text or request context accepted. */
export function createOperationStore(directory?: string) {
  let queue = Promise.resolve();
  let pending = 0;
  async function read(day: string): Promise<Counts> {
    if (!directory) return { day, counts: {} };
    try {
      const value = JSON.parse(await readFile(join(directory, `${day}.json`), 'utf8')) as Counts;
      if (
        value.day !== day ||
        !value.counts ||
        Object.entries(value.counts).some(
          ([key, count]) =>
            !(OPERATION_CODES as readonly string[]).includes(key) ||
            !Number.isSafeInteger(count) ||
            count < 0,
        )
      )
        throw new Error('Invalid operation aggregate');
      return value;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { day, counts: {} };
      throw error;
    }
  }
  return {
    async record(code: OperationCode, now = new Date()) {
      if (!directory || pending >= 100 || !(OPERATION_CODES as readonly string[]).includes(code))
        return;
      pending += 1;
      const write = queue.then(async () => {
        const day = now.toISOString().slice(0, 10);
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const value = await read(day);
        value.counts[code] = Math.min(Number.MAX_SAFE_INTEGER, (value.counts[code] ?? 0) + 1);
        const temporary = join(directory, `.${randomUUID()}.tmp`);
        await writeFile(temporary, JSON.stringify(value), { mode: 0o600, flag: 'wx' });
        await rename(temporary, join(directory, `${day}.json`));
      });
      queue = write.catch(() => undefined);
      try {
        await write;
      } catch {
        /* Health collection cannot break a user response. */
      } finally {
        pending -= 1;
      }
    },
    async recent(): Promise<Counts[]> {
      if (!directory) return [];
      try {
        const names = (await readdir(directory))
          .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
          .sort()
          .slice(-30);
        return await Promise.all(names.map((name) => read(name.slice(0, 10))));
      } catch {
        return [];
      }
    },
  };
}
export const operationStore = createOperationStore(process.env.OPERATIONS_DIRECTORY);
