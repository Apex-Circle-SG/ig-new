import { canonical, PUBLIC_INDEXABLE_PATHS } from '@insightginie/seo';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import { getPublishedContent } from './content';

const names: Record<string, string> = {
  '/': 'Home',
  '/calc/': 'Income calculators',
  '/calc/individual-income-percentile/': 'Individual income percentile',
  '/tools/': 'Finance tools',
  '/insights/': 'Insights',
  '/research/': 'Research and US income data',
  '/ask/': 'Ask Genie',
  '/data/': 'Datasets',
  '/data/census-cps/': 'Census CPS source documentation',
  '/data/us-income-distribution/': 'US income distribution',
  '/methodology/': 'Methodology',
  '/methodology/individual-income/': 'Income percentile methodology',
  '/about/': 'About InsightGinie',
  '/editorial-policy/': 'Editorial policy',
  '/privacy/': 'Privacy',
  '/terms/': 'Terms',
  '/contact/': 'Contact',
  '/authors/': 'Maintainers and authors',
  '/authors/insightginie/': 'InsightGinie maintainer profile',
  '/corrections-policy/': 'Corrections policy',
  '/advertising-disclosure/': 'Advertising disclosure',
  '/ai-disclosure/': 'AI-use disclosure',
  '/finance-disclaimer/': 'Finance disclaimer',
  '/research-methodology/': 'Research methodology',
  '/content-index/': 'Content index',
  ...Object.fromEntries(FINANCE_TOOLS.map((tool) => [`/tools/${tool.id}/`, tool.title])),
};
export function getSiteEntries() {
  const pages = PUBLIC_INDEXABLE_PATHS.map((path) => ({
    path,
    url: canonical(path),
    title: names[path] ?? path,
    lastModified:
      path.startsWith('/tools/') || ['/ask/', '/insights/', '/research/'].includes(path)
        ? '2026-09-13'
        : undefined,
  }));
  const content = getPublishedContent().map((record) => ({
    path: record.path,
    url: canonical(record.path),
    title: record.title,
    lastModified: record.updatedAt,
  }));
  return [...pages, ...content];
}
export function sitemapGroup(path: string) {
  return path.startsWith('/tools/') || path.startsWith('/calc/')
    ? 'tools'
    : path.startsWith('/insights/') || path.startsWith('/research/')
      ? 'content'
      : 'site';
}
