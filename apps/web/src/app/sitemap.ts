import type { MetadataRoute } from 'next';
import { canonical, PUBLIC_INDEXABLE_PATHS, siteIsIndexable } from '@insightginie/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteIsIndexable()) return [];
  // Do not claim today's date as a content update on every build.
  return PUBLIC_INDEXABLE_PATHS.map((path) => ({ url: canonical(path) }));
}
