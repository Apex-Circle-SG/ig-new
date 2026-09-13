import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PUBLIC_AD_PATHS,
  PUBLIC_INDEXABLE_PATHS,
  isPublicAdvertisingPath,
  isPublicIndexablePath,
  siteIsIndexable,
} from '@insightginie/seo';
import robots from '../../apps/web/src/app/robots';
import sitemap from '../../apps/web/src/app/sitemap';

afterEach(() => vi.unstubAllEnvs());

describe('reviewed public-page boundaries', () => {
  it('requires explicit production indexing and always excludes previews', () => {
    expect(siteIsIndexable({})).toBe(false);
    expect(siteIsIndexable({ SITE_INDEXABLE: 'false' })).toBe(false);
    expect(siteIsIndexable({ SITE_INDEXABLE: 'true' })).toBe(true);
    expect(siteIsIndexable({ SITE_INDEXABLE: 'true', VERCEL_ENV: 'preview' })).toBe(false);
  });

  it.each([
    '/authors/',
    '/me/',
    '/admin/',
    '/api/health/',
    '/tools/income/',
    '/embed/income/',
    '/data/draft/',
    '/data/us-income-distribution/unknown/',
    '/calc/individual-income-percentile/?income=75000',
    '/calc/individual-income-percentile/#result',
    '//insightginie.com/',
    'https://insightginie.com/',
    '/not-a-published-page/',
  ])('does not publish or advertise on %s', (path) => {
    expect(isPublicIndexablePath(path)).toBe(false);
    expect(isPublicAdvertisingPath(path)).toBe(false);
  });

  it('allows published paths with and without the trailing slash', () => {
    for (const path of PUBLIC_INDEXABLE_PATHS) {
      expect(isPublicIndexablePath(path)).toBe(true);
      expect(isPublicAdvertisingPath(path)).toBe(true);
      if (path !== '/') expect(isPublicIndexablePath(path.slice(0, -1))).toBe(true);
    }
    expect(new Set(PUBLIC_INDEXABLE_PATHS).size).toBe(PUBLIC_INDEXABLE_PATHS.length);
  });
});

describe('production discovery and preview isolation', () => {
  it('publishes only reviewed canonical pages without artificial update dates', () => {
    vi.stubEnv('SITE_INDEXABLE', 'true');
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(sitemap()).toEqual(
      PUBLIC_INDEXABLE_PATHS.map((path) => ({ url: `https://insightginie.com${path}` })),
    );
    expect(robots().sitemap).toBe('https://insightginie.com/sitemap.xml');
    const rules = robots().rules;
    expect(Array.isArray(rules) ? rules[0] : rules).toMatchObject({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/me/', '/admin/', '/tools/', '/embed/'],
    });
  });

  it('uses exact advertising crawler rules so the homepage cannot allow all private paths', () => {
    vi.stubEnv('SITE_INDEXABLE', 'true');
    vi.stubEnv('VERCEL_ENV', 'production');
    const rules = robots().rules;
    const adRule = Array.isArray(rules) ? rules[1] : undefined;
    expect(adRule?.allow).toEqual([
      ...PUBLIC_AD_PATHS.map((path) => `${path}$`),
      '/ads.txt$',
      '/_next/',
    ]);
    expect(adRule?.allow).not.toContain('/');
    expect(adRule?.disallow).toBe('/');
  });

  it.each([
    { SITE_INDEXABLE: 'false', VERCEL_ENV: 'production' },
    { SITE_INDEXABLE: 'true', VERCEL_ENV: 'preview' },
  ])('does not expose a launch sitemap when %j', (environment) => {
    vi.stubEnv('SITE_INDEXABLE', environment.SITE_INDEXABLE);
    vi.stubEnv('VERCEL_ENV', environment.VERCEL_ENV);
    expect(sitemap()).toEqual([]);
    expect(robots().sitemap).toBeUndefined();
    const rules = robots().rules;
    for (const rule of Array.isArray(rules) ? rules : [rules]) {
      expect(rule.disallow).toBe('/');
      expect(rule.allow).toBeUndefined();
    }
  });
});
