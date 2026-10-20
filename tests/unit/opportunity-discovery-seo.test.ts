import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DISCOVERY_HUB_PATHS,
  PUBLIC_EARNING_GUIDE_PATHS,
  PUBLIC_INDEXABLE_PATHS,
  isOpportunityContentPath,
  isPublicIndexablePath,
  isPublicAdvertisingPath,
  publicRouteId,
} from '@insightginie/seo';
import methods from '../../apps/opportunities/data/methods.json';
import { discoveryHubs } from '../../apps/web/src/lib/discovery-hubs';
import { getSiteEntries } from '../../apps/web/src/lib/site-index';
import { generateMetadata } from '../../apps/web/src/app/earn/[id]/page';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('earning search discovery', () => {
  it('keeps reviewed guides, sitemap, analytics IDs and exact route approval in agreement', () => {
    expect([...PUBLIC_EARNING_GUIDE_PATHS].sort()).toEqual(
      methods.map((method) => `/earn/${method.id}/`).sort(),
    );
    const entries = getSiteEntries();
    for (const path of PUBLIC_EARNING_GUIDE_PATHS) {
      expect(isPublicIndexablePath(path)).toBe(true);
      expect(isPublicAdvertisingPath(path)).toBe(true);
      expect(publicRouteId(path)).toBeTruthy();
      expect(entries.filter((entry) => entry.path === path)).toHaveLength(1);
    }
    for (const path of [
      '/earn/missing-guide/',
      '/earn/website-user-testing/?email=private',
      '/earn/website-user-testing/#private',
    ])
      expect(isPublicIndexablePath(path)).toBe(false);
  });

  it('approves the four useful hubs without treating them as missing dynamic records', () => {
    expect([...DISCOVERY_HUB_PATHS].sort()).toEqual(discoveryHubs.map((hub) => hub.path).sort());
    for (const hub of discoveryHubs) {
      expect(PUBLIC_INDEXABLE_PATHS).toContain(hub.path);
      expect(isOpportunityContentPath(hub.path)).toBe(false);
      expect(isPublicAdvertisingPath(hub.path)).toBe(true);
      expect(
        hub.sections
          .flatMap((section) => section.paragraphs)
          .join(' ')
          .split(/\s+/).length,
      ).toBeGreaterThan(250);
      expect(getSiteEntries().find((entry) => entry.path === hub.path)?.title).toBe(hub.title);
    }
  });

  it('never indexes missing guides, failed catalog responses or preview deployments', async () => {
    vi.stubEnv('SITE_INDEXABLE', 'true');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ items: [methods[0]] })),
    );
    const params = { params: Promise.resolve({ id: methods[0].id }) };
    expect((await generateMetadata(params)).robots).toMatchObject({ index: true });
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect((await generateMetadata(params)).robots).toMatchObject({ index: false });
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(
      (await generateMetadata({ params: Promise.resolve({ id: 'missing-guide' }) })).robots,
    ).toMatchObject({ index: false });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    );
    expect((await generateMetadata(params)).robots).toMatchObject({ index: false });
  });
});
