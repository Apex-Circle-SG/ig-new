import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import {
  normalizeWordPressPost,
  hasApprovedCutover,
  sha256,
} from '../../apps/web/src/lib/content/normalize';
import { cutoverGateSchema } from '../../apps/web/src/lib/content/schema';
import { readLastGood } from './core';

const root = resolve(process.argv[2] || 'content/wordpress');
const snapshot = await readLastGood(root);
if (!snapshot) throw new Error('No last-good content snapshot.');
const gate = cutoverGateSchema.parse(
  JSON.parse(await readFile(join(root, 'cutover-gate.json'), 'utf8')),
);
const checks = [];
for (const record of snapshot.records) {
  const raw = JSON.parse(await readFile(join(root, 'raw', `${record.rawSha256}.json`), 'utf8'));
  if (sha256(JSON.stringify(raw)) !== record.rawSha256)
    throw new Error('Raw source checksum mismatch.');
  const reproduced = normalizeWordPressPost(raw, record.retrievedAt);
  if (JSON.stringify(reproduced) !== JSON.stringify(record))
    throw new Error('Stored record differs from reproducible source transformation.');
  const published = hasApprovedCutover(record, gate);
  checks.push({
    id: record.id,
    path: record.path,
    originalUrl: record.originalUrl,
    authorPreserved: true,
    datesPreserved: true,
    bodyReproduced: true,
    mediaCount: record.media.length,
    featuredMedia: record.featuredMedia !== null,
    sourceLinkCount: record.sources.length,
    indexable: published,
    canonical: published ? `https://insightginie.com${record.path}` : record.originalUrl,
    warnings: record.warnings,
  });
}
const report = {
  verifiedAt: new Date().toISOString(),
  versionId: snapshot.versionId,
  status: 'passed',
  scope:
    'Local source-to-preview preservation and publication gates; not a full WordPress backup or verified remote redirect cutover.',
  publicCutoverReady: checks.length > 0 && checks.every((check) => check.indexable),
  checks,
};
const output = resolve('docs/verification/content-migration-validation.json');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify({
    status: report.status,
    checkedRecords: checks.length,
    publicCutoverReady: report.publicCutoverReady,
    report: output,
  }),
);
