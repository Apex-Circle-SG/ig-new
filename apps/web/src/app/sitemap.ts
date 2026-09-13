import type { MetadataRoute } from 'next';
import { siteIsIndexable } from '@insightginie/seo';
import { getSiteEntries } from '../lib/site-index';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteIsIndexable()) return [];
  // Do not claim today's date as a content update on every build.
  return getSiteEntries().map(({ url, lastModified }) => ({
    url,
    ...(lastModified ? { lastModified } : {}),
  }));
}
