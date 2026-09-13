import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createOperationStore } from '../../apps/web/src/lib/operations';

it('persists only controlled operation counts with serialized concurrent writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ig-operations-'));
  try {
    const store = createOperationStore(directory);
    const now = new Date('2026-09-13T00:00:00Z');
    await Promise.all(Array.from({ length: 12 }, () => store.record('ask_answer', now)));
    const names = await readdir(directory);
    expect(names).toEqual(['2026-09-13.json']);
    expect(JSON.parse(await readFile(join(directory, names[0]), 'utf8'))).toEqual({
      day: '2026-09-13',
      counts: { ask_answer: 12 },
    });
    expect(await store.recent()).toHaveLength(1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
