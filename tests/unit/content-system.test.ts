import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  normalizeWordPressPost,
  createSnapshot,
  validateSnapshot,
  hasApprovedCutover,
  publishedRecords,
} from '../../apps/web/src/lib/content/normalize';
import {
  sanitizePublicHtml,
  publicResourceUrl,
  plainText,
} from '../../apps/web/src/lib/content/sanitize';
import { cutoverGateSchema } from '../../apps/web/src/lib/content/schema';
import {
  getApprovedPublicDocuments,
  getContentBySlug,
  getContentStatus,
  getContentFeedItems,
  buildContentRss,
  listContent,
  contentPublication,
  escapeXml,
} from '../../apps/web/src/lib/content';
import {
  fetchPost,
  publishSnapshot,
  readLastGood,
  SourceRateLimitError,
  withSyncLock,
} from '../../scripts/content-sync/core';

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});
const source = 'https://blog.insightginie.com/source-article/';
const raw = () => ({
  id: 10,
  slug: 'source-article',
  link: source,
  status: 'publish',
  type: 'post',
  date_gmt: '2025-02-01T12:00:00',
  modified_gmt: '2025-02-02T12:00:00',
  title: { rendered: 'Source &amp; Context' },
  excerpt: { rendered: '<p>A preserved source article.</p>' },
  content: {
    protected: false,
    rendered:
      '<h2>Context</h2><p>These are original source words with <a href="https://www.census.gov/">an original source</a>.</p><figure><img src="/wp-content/uploads/example.jpg" alt="Original description" width="1200" height="675"><figcaption>Original caption</figcaption></figure>',
  },
  author: 7,
  featured_media: 9,
  categories: [2],
  tags: [3],
  _embedded: {
    author: [
      { id: 7, name: 'Original Author', link: 'https://blog.insightginie.com/author/original/' },
    ],
    'wp:featuredmedia': [
      {
        id: 9,
        source_url: 'https://blog.insightginie.com/wp-content/uploads/hero.jpg',
        alt_text: 'Source hero alt',
        caption: { rendered: '<p>Source hero caption</p>' },
        media_details: { width: 1000, height: 500 },
      },
    ],
    'wp:term': [
      [{ id: 2, name: 'Research', slug: 'research', taxonomy: 'category' }],
      [{ id: 3, name: 'Data', slug: 'data', taxonomy: 'post_tag' }],
    ],
  },
});
const normalized = () => normalizeWordPressPost(raw(), '2026-09-13T00:00:00.000Z');
const newRoot = async () => {
  const path = await mkdtemp(join(tmpdir(), 'ig-content-'));
  temporary.push(path);
  return path;
};

describe('safe source preservation', () => {
  it('preserves original author/date/body/media/captions and external sources', () => {
    const record = normalized();
    expect(record.title).toBe('Source & Context');
    expect(record.author.name).toBe('Original Author');
    expect(record.publishedAt).toBe('2025-02-01T12:00:00.000Z');
    expect(record.updatedAt).toBe('2025-02-02T12:00:00.000Z');
    expect(record.html).toContain('Original caption');
    expect(record.html).toContain('alt="Original description"');
    expect(record.featuredMedia?.captionHtml).toContain('Source hero caption');
    expect(record.media).toHaveLength(2);
    expect(record.sources).toContain('https://www.census.gov/');
    expect(record.status).toBe('migration-preview');
  });

  it('removes scripts, styles, events, forms, data images and active embeds', () => {
    const result = sanitizePublicHtml(
      '<p onclick="steal()">Keep words</p><script>steal()</script><style>body{display:none}</style><iframe src="https://evil.example"></iframe><form><input name="secret"></form><img src="data:image/svg+xml,bad" onerror="steal()"><a href="javascript:steal()">Link text</a>',
    );
    expect(result.html).toContain('Keep words');
    expect(result.html).toContain('Link text');
    expect(result.html).not.toMatch(/steal|onclick|script|iframe|form|data:image|style=/);
    expect(result.sources).toEqual([]);
  });

  it('sanitization is idempotent and retained text cannot become executable markup', () => {
    const first = sanitizePublicHtml(raw().content.rendered);
    expect(sanitizePublicHtml(first.html)).toEqual(first);
    expect(plainText('<p>Symbols &lt; &amp; &gt; matter</p>')).toBe('Symbols < & > matter');
    expect(
      sanitizePublicHtml('<a href="https://example.com/" rel="nofollow sponsored">Partner</a>')
        .html,
    ).toContain('rel="noopener noreferrer nofollow sponsored"');
  });

  it('rejects private/protected content, missing authors and mismatched canonical hosts', () => {
    expect(() =>
      normalizeWordPressPost({ ...raw(), status: 'private' }, '2026-09-13T00:00:00.000Z'),
    ).toThrow();
    expect(() =>
      normalizeWordPressPost(
        { ...raw(), content: { ...raw().content, protected: true } },
        '2026-09-13T00:00:00.000Z',
      ),
    ).toThrow('protected_content_rejected');
    expect(() =>
      normalizeWordPressPost({ ...raw(), _embedded: { author: [] } }, '2026-09-13T00:00:00.000Z'),
    ).toThrow('source_author_missing');
    expect(() =>
      normalizeWordPressPost(
        { ...raw(), link: 'https://evil.example/source-article/' },
        '2026-09-13T00:00:00.000Z',
      ),
    ).toThrow('source_canonical_mismatch');
  });

  it('allows public media URLs and rejects missing/local/credential-bearing URLs', () => {
    for (const url of [
      '',
      'http://localhost/image',
      'http://127.0.0.1/image',
      'https://user:pass@example.com/',
      'javascript:alert(1)',
      'file:///etc/passwd',
    ])
      expect(publicResourceUrl(url)).toBeNull();
    expect(publicResourceUrl('/wp-content/uploads/a.jpg')).toBe(
      'https://blog.insightginie.com/wp-content/uploads/a.jpg',
    );
  });
});

describe('immutable snapshots and migration gates', () => {
  it('rejects corrupted content and duplicate source identities', () => {
    const snapshot = createSnapshot([normalized()]);
    expect(() =>
      validateSnapshot({
        ...snapshot,
        records: [{ ...snapshot.records[0], html: '<script>bad()</script>' }],
      }),
    ).toThrow();
    expect(() => createSnapshot([normalized(), normalized()])).toThrow('duplicate_id');
    const record = normalized();
    expect(() =>
      createSnapshot([
        {
          ...record,
          featuredMedia: { ...record.featuredMedia!, captionHtml: '<script>bad()</script>' },
        },
      ]),
    ).toThrow('record_caption_integrity_failed');
  });

  it('atomically replaces last-good only after validation and keeps immutable versions', async () => {
    const root = await newRoot();
    const initial = await publishSnapshot(root, [normalized()]);
    const before = await readFile(join(root, 'last-good.json'), 'utf8');
    await expect(
      publishSnapshot(root, [{ ...normalized(), contentSha256: '0'.repeat(64) }]),
    ).rejects.toThrow();
    expect(await readFile(join(root, 'last-good.json'), 'utf8')).toBe(before);
    const repeated = await publishSnapshot(root, [normalized()]);
    expect(repeated.changed).toBe(false);
    expect(repeated.snapshot.versionId).toBe(initial.snapshot.versionId);
    expect(await readdir(join(root, 'versions'))).toHaveLength(1);
    expect((await readLastGood(root))?.records).toHaveLength(1);
  });

  it('serializes writers with an exclusive lock and cleans it up', async () => {
    const root = await newRoot();
    await withSyncLock(root, async () => {
      await expect(withSyncLock(root, async () => null)).rejects.toThrow();
    });
    await expect(withSyncLock(root, async () => 'ready')).resolves.toBe('ready');
  });

  it('requires backup, restore, redirects and matching per-record content approval', () => {
    const record = normalized();
    const gate = cutoverGateSchema.parse({
      mode: 'cutover',
      fullBackupVerified: true,
      restoreTestVerified: true,
      blogRedirectsVerified: true,
      evidence: ['backup-proof', 'restore-proof', 'redirect-proof'],
      approvedRecords: [
        {
          id: record.id,
          contentSha256: record.contentSha256,
          approvedBy: 'Fixture Reviewer',
          approvedAt: '2026-09-13T00:00:00.000Z',
          targetStatus: 200,
          sourceRedirectStatus: 301,
        },
      ],
    });
    expect(hasApprovedCutover(record, gate)).toBe(true);
    expect(hasApprovedCutover(record, { ...gate, fullBackupVerified: false })).toBe(false);
    expect(hasApprovedCutover(record, { ...gate, mode: 'preview' })).toBe(false);
    expect(hasApprovedCutover({ ...record, contentSha256: '0'.repeat(64) }, gate)).toBe(false);
  });

  it('published content inventory is not truncated to the UI page limit', () => {
    const records = Array.from({ length: 125 }, (_, index) => ({
      ...normalized(),
      id: `wp-post-${index + 1}`,
      wpId: index + 1,
      slug: `article-${index + 1}`,
      path: `/insights/article-${index + 1}/`,
      originalUrl: `https://blog.insightginie.com/article-${index + 1}/`,
    }));
    const gate = cutoverGateSchema.parse({
      mode: 'cutover',
      fullBackupVerified: true,
      restoreTestVerified: true,
      blogRedirectsVerified: true,
      evidence: ['backup', 'restore', 'redirects'],
      approvedRecords: records.map((record) => ({
        id: record.id,
        contentSha256: record.contentSha256,
        approvedBy: 'Fixture Reviewer',
        approvedAt: '2026-09-13T00:00:00.000Z',
        targetStatus: 200,
        sourceRedirectStatus: 301,
      })),
    });
    expect(publishedRecords(records, gate)).toHaveLength(125);
    expect(publishedRecords(records, { ...gate, restoreTestVerified: false })).toEqual([]);
  });
});

describe('read-only fetch and safe publication surfaces', () => {
  it('fetches only fixed-origin GET endpoints and honors 429 without retries', async () => {
    let calls = 0;
    const fetcher = (async (input: string | URL | Request, options?: RequestInit) => {
      calls += 1;
      expect(String(input)).toBe(
        'https://blog.insightginie.com/wp-json/wp/v2/posts/10?_embed=author%2Cwp%3Afeaturedmedia%2Cwp%3Aterm',
      );
      expect(options?.method).toBe('GET');
      return new Response('', { status: 429, headers: { 'Retry-After': '120' } });
    }) as typeof fetch;
    try {
      await fetchPost(10, fetcher);
      expect.fail('Expected rate limit');
    } catch (error) {
      expect(error).toBeInstanceOf(SourceRateLimitError);
      expect((error as SourceRateLimitError).retryAfter).toBe('120');
    }
    expect(calls).toBe(1);
  });

  it('rejects non-JSON, oversized, wrong-identity and invalid source responses', async () => {
    await expect(
      fetchPost(
        10,
        (async () =>
          new Response('x'.repeat(3_000_001), {
            headers: { 'Content-Type': 'application/json' },
          })) as typeof fetch,
      ),
    ).rejects.toThrow('wordpress_payload_too_large');
    await expect(
      fetchPost(10, (async () => new Response('error', { status: 200 })) as typeof fetch),
    ).rejects.toThrow('wordpress_response_not_json');
    await expect(
      fetchPost(
        10,
        (async () =>
          new Response('{}', {
            headers: { 'Content-Type': 'application/json', 'Content-Length': '4000000' },
          })) as typeof fetch,
      ),
    ).rejects.toThrow('wordpress_payload_too_large');
    await expect(fetchPost(20, (async () => Response.json(raw())) as typeof fetch)).rejects.toThrow(
      'wordpress_response_id_mismatch',
    );
  });

  it('real pilot previews stay noindex, retain blog canonical and never enter feed or assistant corpus', () => {
    expect(getContentStatus().available).toBe(true);
    expect(getContentStatus().syncedPosts).toBeGreaterThan(0);
    for (const record of listContent()) {
      expect(contentPublication(record)).toEqual({
        indexable: false,
        preview: true,
        canonical: record.originalUrl,
      });
      expect(getApprovedPublicDocuments().some((document) => document.id === record.id)).toBe(
        false,
      );
    }
    expect(getContentFeedItems()).toEqual([]);
    expect(buildContentRss()).not.toContain('<item>');
  });

  it('retrieval corpus consists solely of explicit approved public snippets and is mutation-isolated', () => {
    const documents = getApprovedPublicDocuments();
    expect(documents.length).toBeGreaterThanOrEqual(3);
    expect(
      documents.every(
        (document) => document.approved && document.path.startsWith('/') && document.sources.length,
      ),
    ).toBe(true);
    const original = listContent()[0];
    original.title = 'Changed by consumer';
    expect(getContentBySlug(original.slug)?.title).not.toBe('Changed by consumer');
    expect(getContentBySlug('../../secret')).toBeNull();
    expect(getContentBySlug('\ud800')).toBeNull();
    expect(escapeXml('<img onerror="x">&')).toBe('&lt;img onerror=&quot;x&quot;&gt;&amp;');
  });
});
