import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pruneAnalytics } from './prune-analytics.mjs';

test('keeps the latest 30 UTC dates and touches only valid daily regular files', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'insightginie-retention-'));
  try {
    for (const filename of [
      '2026-09-13.json',
      '2026-08-15.json',
      '2026-08-14.json',
      '2025-01-01.json',
      '2026-00-01.json',
      '2026-08-14.json.backup',
      '.2026-08-14.tmp',
      'notes.json',
    ])
      await writeFile(path.join(directory, filename), '{}');
    await mkdir(path.join(directory, '2026-08-13.json'));
    await symlink(path.join(directory, 'notes.json'), path.join(directory, '2026-08-12.json'));
    assert.equal(await pruneAnalytics(directory, new Date('2026-09-13T00:00:00Z')), 2);
    const remaining = await readdir(directory);
    assert(remaining.includes('2026-08-15.json'));
    assert(remaining.includes('2026-09-13.json'));
    assert(!remaining.includes('2026-08-14.json'));
    assert(!remaining.includes('2025-01-01.json'));
    assert(remaining.includes('2026-08-13.json'));
    assert(remaining.includes('2026-08-12.json'));
    assert(remaining.includes('2026-00-01.json'));
    assert(remaining.includes('2026-08-14.json.backup'));
    assert(remaining.includes('.2026-08-14.tmp'));
    assert.equal(await readFile(path.join(directory, 'notes.json'), 'utf8'), '{}');
    assert.equal(await pruneAnalytics(directory, new Date('2026-09-13T23:59:59Z')), 0);
    assert.equal(await pruneAnalytics(directory, new Date('2026-09-14T00:00:00Z')), 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('absent configuration or an unused directory succeeds without creating files', async () => {
  assert.equal(await pruneAnalytics(undefined), 0);
  const directory = await mkdtemp(path.join(tmpdir(), 'insightginie-retention-'));
  try {
    assert.equal(await pruneAnalytics(path.join(directory, 'unused')), 0);
    assert.deepEqual(await readdir(directory), []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
