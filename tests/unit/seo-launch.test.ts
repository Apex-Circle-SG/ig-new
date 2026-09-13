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
import { getPublishedContent } from '../../apps/web/src/lib/content';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('reviewed public-page boundaries', () => {
  it('requires explicit production indexing and always excludes previews', () => {
    expect(siteIsIndexable({})).toBe(false);
    expect(siteIsIndexable({ SITE_INDEXABLE: 'false' })).toBe(false);
    expect(siteIsIndexable({ SITE_INDEXABLE: 'true' })).toBe(true);
    expect(siteIsIndexable({ SITE_INDEXABLE: 'true', VERCEL_ENV: 'preview' })).toBe(false);
  });

  it.each([
    '/authors/unreviewed-person/',
    '/me/',
    '/admin/',
    '/api/health/',
    '/tools/income/',
    '/tools/income/anything/',
    '/private-tools/cash-runway/',
    '/private-tools/ai-workflow-roi/',
    '/ask/private-session/',
    '/insights/connecting-openclaw-to-qq-a-guide-to-the-onebot-adapter-skill/',
    '/insights/how-to-get-into-quantitative-trading-a-career-guide/',
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
      expect(isPublicAdvertisingPath(path)).toBe(path !== '/ask/');
      if (path !== '/') expect(isPublicIndexablePath(path.slice(0, -1))).toBe(true);
    }
    expect(new Set(PUBLIC_INDEXABLE_PATHS).size).toBe(PUBLIC_INDEXABLE_PATHS.length);
    expect(isPublicIndexablePath('/tools/')).toBe(true);
    expect(isPublicIndexablePath('/authors/')).toBe(true);
    expect(isPublicIndexablePath('/ask/')).toBe(true);
    expect(isPublicAdvertisingPath('/ask')).toBe(false);
    expect(PUBLIC_AD_PATHS).not.toContain('/ask/');
  });
});

describe('production discovery and preview isolation', () => {
  it('publishes only reviewed canonical pages without artificial update dates', () => {
    vi.stubEnv('SITE_INDEXABLE', 'true');
    vi.stubEnv('VERCEL_ENV', 'production');
    const entries = sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      ...PUBLIC_INDEXABLE_PATHS.map((path) => `https://insightginie.com${path}`),
      ...getPublishedContent().map((record) => `https://insightginie.com${record.path}`),
    ]);
    expect(entries.find((entry) => entry.url === 'https://insightginie.com/')).not.toHaveProperty(
      'lastModified',
    );
    expect(
      entries.find((entry) => entry.url === 'https://insightginie.com/research/')?.lastModified,
    ).toBe('2026-09-13');
    for (const entry of entries)
      if (entry.lastModified)
        expect(Number.isNaN(new Date(entry.lastModified).valueOf())).toBe(false);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2040-01-01T00:00:00Z'));
    expect(sitemap()).toEqual(entries);
    expect(robots().sitemap).toBe('https://insightginie.com/sitemap-index.xml');
    const rules = robots().rules;
    expect(Array.isArray(rules) ? rules[0] : rules).toMatchObject({
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/me/',
        '/admin/',
        '/tools/income/',
        '/private-tools/',
        '/embed/',
        '/search/',
      ],
    });
    expect((Array.isArray(rules) ? rules[0] : rules).disallow).not.toContain('/tools/');
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
    expect(adRule?.allow).not.toContain('/ask/$');
    expect(adRule?.allow).not.toContain('/tools/income/$');
    expect(adRule?.allow).not.toContain('/private-tools/cash-runway/$');
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
