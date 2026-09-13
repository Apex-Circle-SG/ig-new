import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import { PUBLIC_INDEXABLE_PATHS, isPublicIndexablePath } from '@insightginie/seo';
import { getSiteEntries, sitemapGroup } from '../../apps/web/src/lib/site-index';
import { listContent, contentPublication } from '../../apps/web/src/lib/content';
import sitemap from '../../apps/web/src/app/sitemap';
import { GET as sitemapIndex } from '../../apps/web/src/app/sitemap-index.xml/route';
import { GET as partition } from '../../apps/web/src/app/sitemaps/[filename]/route';
import { GET as feed } from '../../apps/web/src/app/feed.xml/route';
import { generateMetadata as insightsMetadata } from '../../apps/web/src/app/insights/page';

afterEach(() => vi.unstubAllEnvs());

describe('consolidation discovery surfaces', () => {
  it('every statically approved route resolves to an implemented page or supported tool slug', () => {
    const toolPaths = FINANCE_TOOLS.map((tool) => `/tools/${tool.id}/`);
    for (const path of PUBLIC_INDEXABLE_PATHS) {
      if (toolPaths.includes(path)) {
        expect(existsSync(resolve('apps/web/src/app/tools/[slug]/page.tsx'))).toBe(true);
      } else expect(existsSync(resolve('apps/web/src/app', `.${path}`, 'page.tsx'))).toBe(true);
    }
  });

  it('site entries are unique canonical HTTPS URLs without query/private/preview/draft leakage', () => {
    const entries = getSiteEntries();
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);
    for (const entry of entries) {
      const url = new URL(entry.url);
      expect(url.origin).toBe('https://insightginie.com');
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
      expect(entry.path).not.toMatch(/^\/(?:private-tools|admin|api|me|embed)\//);
      expect(entry.title.trim()).not.toBe('');
    }
    for (const preview of listContent()) {
      expect(contentPublication(preview).indexable).toBe(false);
      expect(entries.some((entry) => entry.path === preview.path)).toBe(false);
      expect(isPublicIndexablePath(preview.path)).toBe(false);
    }
  });

  it('sitemap index partitions cover each approved URL exactly once', async () => {
    vi.stubEnv('SITE_INDEXABLE', 'true');
    vi.stubEnv('VERCEL_ENV', 'production');
    const index = await sitemapIndex().text();
    const expectedGroups = ['tools', 'content', 'site'];
    const allUrls: string[] = [];
    for (const group of expectedGroups) {
      expect(index).toContain(`https://insightginie.com/sitemaps/${group}.xml`);
      const response = await partition(
        new Request(`https://insightginie.com/sitemaps/${group}.xml`),
        { params: Promise.resolve({ filename: `${group}.xml` }) },
      );
      expect(response.status).toBe(200);
      const xml = await response.text();
      const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
      expect(urls.length).toBeGreaterThan(0);
      expect(urls.every((url) => sitemapGroup(new URL(url).pathname) === group)).toBe(true);
      allUrls.push(...urls);
    }
    expect([...allUrls].sort()).toEqual(
      getSiteEntries()
        .map((entry) => entry.url)
        .sort(),
    );
    expect(
      sitemap()
        .map((entry) => entry.url)
        .sort(),
    ).toEqual(allUrls.sort());
  });

  it('preview deployments do not publish sitemap URLs and unknown partitions return404', async () => {
    vi.stubEnv('SITE_INDEXABLE', 'true');
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(sitemap()).toEqual([]);
    expect(await sitemapIndex().text()).not.toContain('<loc>');
    const unknown = await partition(new Request('https://insightginie.com/sitemaps/private.xml'), {
      params: Promise.resolve({ filename: 'private.xml' }),
    });
    expect(unknown.status).toBe(404);
  });

  it('empty and populated filter submissions remain nonindexable with a clean canonical', async () => {
    for (const search of [{ q: '' }, { category: '' }, { q: 'income', category: 'research' }]) {
      const metadata = await insightsMetadata({ searchParams: Promise.resolve(search) });
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(metadata.alternates?.canonical).toBe('/insights/');
    }
  });

  it('public RSS remains valid XML and excludes every imported preview body', async () => {
    const response = feed();
    expect(response.headers.get('content-type')).toContain('application/rss+xml');
    const xml = await response.text();
    expect(xml).toContain('<rss version="2.0">');
    for (const preview of listContent()) {
      expect(xml).not.toContain(preview.slug);
      expect(xml).not.toContain(preview.html);
    }
    expect(xml).not.toContain('<script');
  });
});
