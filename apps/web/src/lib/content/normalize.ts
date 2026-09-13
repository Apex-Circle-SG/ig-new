import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  contentRecordSchema,
  contentSnapshotSchema,
  CONTENT_TRANSFORMATION_VERSION,
  WORDPRESS_ORIGIN,
  type ContentRecord,
  type ContentSnapshot,
  type CutoverGate,
} from './schema';
import { plainText, publicResourceUrl, sanitizePublicHtml } from './sanitize';

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const wpPostSchema = z
  .object({
    id: z.number().int().positive(),
    slug: z.string(),
    link: z.url(),
    status: z.literal('publish'),
    type: z.literal('post'),
    date_gmt: z.string().min(10),
    modified_gmt: z.string().min(10),
    title: z.object({ rendered: z.string().min(1) }),
    content: z.object({ rendered: z.string().min(20), protected: z.boolean().optional() }),
    excerpt: z.object({ rendered: z.string() }),
    author: z.number().int().positive(),
    featured_media: z.number().int().nonnegative(),
    categories: z.array(z.number()),
    tags: z.array(z.number()),
    _embedded: z.object({
      author: z.array(
        z.object({ id: z.number(), name: z.string().min(1), link: z.string().optional() }),
      ),
      'wp:featuredmedia': z
        .array(
          z
            .object({
              id: z.number(),
              source_url: z.string().optional(),
              alt_text: z.string().optional(),
              caption: z.object({ rendered: z.string() }).optional(),
              media_details: z
                .object({ width: z.number().optional(), height: z.number().optional() })
                .optional(),
            })
            .passthrough(),
        )
        .optional(),
      'wp:term': z
        .array(
          z.array(
            z.object({ id: z.number(), name: z.string(), slug: z.string(), taxonomy: z.string() }),
          ),
        )
        .optional(),
    }),
  })
  .passthrough();

function utcDate(value: string) {
  const date = new Date(value.endsWith('Z') ? value : `${value}Z`);
  if (!Number.isFinite(date.valueOf())) throw new Error('invalid_source_date');
  return date.toISOString();
}

export function normalizeWordPressPost(raw: unknown, retrievedAt: string): ContentRecord {
  const post = wpPostSchema.parse(raw);
  if (post.content.protected) throw new Error('protected_content_rejected');
  const source = new URL(post.link);
  if (
    source.origin !== WORDPRESS_ORIGIN ||
    source.pathname !== `/${post.slug}/` ||
    source.search ||
    source.hash
  )
    throw new Error('source_canonical_mismatch');
  // Removing unknown source tags can expose malformed paragraph/list nesting.
  // One bounded reparsing pass closes that structure before we hash the output.
  // Already stable records retain exactly the same HTML and content checksum.
  const firstPass = sanitizePublicHtml(post.content.rendered);
  const body = sanitizePublicHtml(firstPass.html);
  const author = post._embedded.author.find((entry) => entry.id === post.author);
  if (!author) throw new Error('source_author_missing');
  const terms = post._embedded['wp:term']?.flat() ?? [];
  const featured = post._embedded['wp:featuredmedia']?.find(
    (entry) => entry.id === post.featured_media,
  );
  const featuredUrl = featured?.source_url ? publicResourceUrl(featured.source_url) : null;
  const warnings: string[] = [];
  if (post.featured_media && !featuredUrl)
    warnings.push('Featured media unavailable; consult original publication.');
  if ((post.categories.length || post.tags.length) && !terms.length)
    warnings.push('Source taxonomy labels unavailable.');
  if (/<(?:iframe|script|form|object)\b/i.test(post.content.rendered))
    warnings.push(
      'Active embeds or scripts removed for safe display; original publication retains the source rendering.',
    );
  const record = contentRecordSchema.parse({
    id: `wp-post-${post.id}`,
    wpId: post.id,
    slug: post.slug,
    title: plainText(post.title.rendered),
    excerpt: plainText(post.excerpt.rendered).slice(0, 2000),
    html: body.html,
    text: body.text,
    originalUrl: source.href,
    path: `/insights/${post.slug}/`,
    status: 'migration-preview',
    publishedAt: utcDate(post.date_gmt),
    updatedAt: utcDate(post.modified_gmt),
    retrievedAt,
    author: {
      id: author.id,
      name: plainText(author.name),
      url: author.link ? publicResourceUrl(author.link) : null,
    },
    categories: terms
      .filter((term) => term.taxonomy === 'category')
      .map(({ id, name, slug }) => ({ id, name: plainText(name), slug })),
    tags: terms
      .filter((term) => term.taxonomy === 'post_tag')
      .map(({ id, name, slug }) => ({ id, name: plainText(name), slug })),
    featuredMedia:
      featured && featuredUrl
        ? {
            id: featured.id,
            url: featuredUrl,
            alt: plainText(featured.alt_text ?? ''),
            captionHtml: sanitizePublicHtml(featured.caption?.rendered ?? '').html,
            width: featured.media_details?.width || null,
            height: featured.media_details?.height || null,
          }
        : null,
    media: [...new Set([...body.media, ...(featuredUrl ? [featuredUrl] : [])])],
    sources: [...new Set([source.href, ...body.sources])],
    rawSha256: sha256(JSON.stringify(raw)),
    contentSha256: sha256(body.html),
    warnings,
  });
  return record;
}

export function snapshotHash(
  records: ContentRecord[],
  transformationVersion: ContentSnapshot['transformationVersion'] = CONTENT_TRANSFORMATION_VERSION,
) {
  return sha256(
    JSON.stringify({
      schemaVersion: 1,
      transformationVersion,
      sourceOrigin: WORDPRESS_ORIGIN,
      records,
    }),
  );
}

export function createSnapshot(
  records: ContentRecord[],
  generatedAt = new Date().toISOString(),
): ContentSnapshot {
  const sorted = [...records].sort((a, b) => a.wpId - b.wpId);
  return validateSnapshot({
    schemaVersion: 1,
    transformationVersion: CONTENT_TRANSFORMATION_VERSION,
    sourceOrigin: WORDPRESS_ORIGIN,
    versionId: snapshotHash(sorted),
    generatedAt,
    records: sorted,
  });
}

export function validateSnapshot(input: unknown): ContentSnapshot {
  const snapshot = contentSnapshotSchema.parse(input);
  if (snapshot.versionId !== snapshotHash(snapshot.records, snapshot.transformationVersion))
    throw new Error('snapshot_checksum_mismatch');
  for (const key of ['id', 'slug', 'originalUrl', 'path'] as const) {
    if (new Set(snapshot.records.map((record) => record[key])).size !== snapshot.records.length)
      throw new Error(`duplicate_${key}`);
  }
  for (const record of snapshot.records) {
    if (record.path !== `/insights/${record.slug}/` || record.id !== `wp-post-${record.wpId}`)
      throw new Error('record_identity_mismatch');
    const sanitized = sanitizePublicHtml(record.html);
    if (
      sanitized.html !== record.html ||
      sha256(record.html) !== record.contentSha256 ||
      sanitized.text !== record.text
    )
      throw new Error('record_content_integrity_failed');
    if (
      record.featuredMedia &&
      sanitizePublicHtml(record.featuredMedia.captionHtml).html !== record.featuredMedia.captionHtml
    )
      throw new Error('record_caption_integrity_failed');
  }
  return snapshot;
}

export function hasApprovedCutover(record: ContentRecord, gate: CutoverGate): boolean {
  return (
    gate.mode === 'cutover' &&
    gate.fullBackupVerified &&
    gate.restoreTestVerified &&
    gate.blogRedirectsVerified &&
    gate.evidence.length >= 3 &&
    gate.approvedRecords.some(
      (approval) =>
        approval.id === record.id &&
        approval.contentSha256 === record.contentSha256 &&
        approval.approvedBy.trim().length > 0,
    )
  );
}

export function publishedRecords(records: ContentRecord[], gate: CutoverGate) {
  if (
    gate.mode !== 'cutover' ||
    !gate.fullBackupVerified ||
    !gate.restoreTestVerified ||
    !gate.blogRedirectsVerified ||
    gate.evidence.length < 3
  )
    return [];
  const approved = new Set(
    gate.approvedRecords
      .filter((entry) => entry.approvedBy.trim())
      .map((entry) => `${entry.id}:${entry.contentSha256}`),
  );
  return records.filter((record) => approved.has(`${record.id}:${record.contentSha256}`));
}
