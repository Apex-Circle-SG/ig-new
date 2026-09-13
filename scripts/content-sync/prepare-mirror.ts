/** Offline-only preparation. Never changes application snapshots or cutover gates. */
import { readFile, writeFile, mkdir, rename, realpath } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { normalizeWordPressPost } from '../../apps/web/src/lib/content/normalize';
import {
  contentRecordSchema,
  CONTENT_TRANSFORMATION_VERSION,
} from '../../apps/web/src/lib/content/schema';
import { sanitizePublicHtml } from '../../apps/web/src/lib/content/sanitize';

const root = await realpath(resolve(process.argv[2] || 'backups/wordpress-mirror-2026-09-13'));
const backupRoot = await realpath(resolve('backups'));
const local = relative(backupRoot, root);
if (!local || local.startsWith('..') || local.startsWith('/'))
  throw new Error('Preparation must use a dedicated ignored backups directory.');
const checkpoint = JSON.parse(await readFile(join(root, 'checkpoint.json'), 'utf8')) as {
  version: string;
  records: Record<string, { rawSha256: string; retrievedAt: string }>;
};
if (checkpoint.version !== 'wordpress-public-mirror-v1') throw new Error('Invalid mirror version.');
const output = join(root, 'prepared');
const normalizationSourceHashes = Object.fromEntries(
  await Promise.all(
    [
      'apps/web/src/lib/content/normalize.ts',
      'apps/web/src/lib/content/sanitize.ts',
      'apps/web/src/lib/content/schema.ts',
      'package-lock.json',
    ].map(async (path) => [
      path,
      createHash('sha256')
        .update(await readFile(path))
        .digest('hex'),
    ]),
  ),
);
await mkdir(join(output, 'records'), { recursive: true });
const records: Record<string, object> = {};
for (const [key, source] of Object.entries(checkpoint.records)) {
  if (!key.startsWith('posts:')) continue;
  if (!/^[a-f0-9]{64}$/.test(source.rawSha256)) throw new Error('Invalid source checksum.');
  const rawBytes = await readFile(join(root, 'objects', `${source.rawSha256}.json`));
  if (createHash('sha256').update(rawBytes).digest('hex') !== source.rawSha256)
    throw new Error('Source checksum mismatch.');
  try {
    const record = contentRecordSchema.parse(
      normalizeWordPressPost(
        JSON.parse(rawBytes.toString('utf8')),
        new Date(source.retrievedAt).toISOString(),
      ),
    );
    const sanitized = sanitizePublicHtml(record.html);
    if (sanitized.html !== record.html || sanitized.text !== record.text)
      throw new Error('Sanitizer output is not stable.');
    if (
      record.featuredMedia &&
      sanitizePublicHtml(record.featuredMedia.captionHtml).html !== record.featuredMedia.captionHtml
    )
      throw new Error('Featured caption sanitizer output is not stable.');
    if (key !== `posts:${record.wpId}`) throw new Error('Source ID mismatch.');
    const text = `${JSON.stringify(record, null, 2)}\n`;
    const recordSha256 = createHash('sha256').update(text).digest('hex');
    const file = join(output, 'records', `${recordSha256}.json`);
    try {
      await writeFile(file, text, { flag: 'wx' });
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== 'EEXIST' ||
        (await readFile(file, 'utf8')) !== text
      )
        throw error;
    }
    records[key] = {
      valid: true,
      rawSha256: source.rawSha256,
      recordSha256,
      path: record.path,
      contentSha256: record.contentSha256,
      warnings: record.warnings,
    };
  } catch (error) {
    records[key] = {
      valid: false,
      rawSha256: source.rawSha256,
      reason: error instanceof Error ? error.name : 'normalization_failed',
    };
  }
}
const report = {
  generatedAt: new Date().toISOString(),
  transformationVersion: CONTENT_TRANSFORMATION_VERSION,
  normalizationSourceHashes,
  publicationChanged: false,
  valid: Object.values(records).filter((record) => 'valid' in record && record.valid).length,
  reviewedForPublication: 0,
  records,
};
const manifestText = `${JSON.stringify(report, null, 2)}\n`;
const manifestSha256 = createHash('sha256').update(manifestText).digest('hex');
await mkdir(join(output, 'manifests'), { recursive: true });
const manifest = join(output, 'manifests', `${manifestSha256}.json`);
try {
  await writeFile(manifest, manifestText, { flag: 'wx' });
} catch (error) {
  if (
    (error as NodeJS.ErrnoException).code !== 'EEXIST' ||
    (await readFile(manifest, 'utf8')) !== manifestText
  )
    throw error;
}
const temporary = join(output, `.index-${process.pid}.tmp`);
await writeFile(temporary, manifestText, { flag: 'wx' });
await rename(temporary, join(output, 'index.json'));
console.log(
  JSON.stringify({
    prepared: report.valid,
    needsReview: Object.keys(records).length - report.valid,
    manifestSha256,
    output,
    publicationChanged: false,
  }),
);
