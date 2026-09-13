import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { validateSnapshot } from '../../apps/web/src/lib/content/normalize';
import { publishSnapshot, withSyncLock } from './core';

const versionId = process.argv[2];
if (!versionId || !/^[a-f0-9]{64}$/.test(versionId))
  throw new Error(
    'Usage: npx tsx scripts/content-sync/rollback.ts VERSION_SHA256 [content/wordpress]',
  );
const root = resolve(process.argv[3] || 'content/wordpress');
const snapshot = validateSnapshot(
  JSON.parse(await readFile(join(root, 'versions', `${versionId}.json`), 'utf8')),
);
await withSyncLock(root, async () => {
  const result = await publishSnapshot(root, snapshot.records, snapshot.generatedAt);
  console.log(
    JSON.stringify({
      versionId: result.snapshot.versionId,
      changed: result.changed,
      rebuildRequired: true,
    }),
  );
});
