import { canonical, PUBLIC_INDEXABLE_PATHS, PUBLIC_EARNING_GUIDE_PATHS } from '@insightginie/seo';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import { getPublishedContent } from './content';
import methods from '../../../opportunities/data/methods.json';
import { discoveryHubs } from './discovery-hubs';

const names: Record<string, string> = {
  '/': 'Home',
  '/opportunities/': 'Online opportunities and remote work',
  '/opportunities/sources/': 'Opportunity sources and freshness',
  '/ideas/': 'Creative business idea lab',
  '/platforms/': 'Earning platforms',
  '/earn/': 'Creative ways to earn online',
  ...Object.fromEntries(discoveryHubs.map((hub) => [hub.path, hub.title])),
  '/calc/': 'Income calculators',
  '/calc/individual-income-percentile/': 'Individual income percentile',
  '/tools/': 'Finance tools',
  '/insights/': 'Insights',
  '/research/': 'Research and US income data',
  '/ask/': 'Ask Ginie',
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
  const guides = PUBLIC_EARNING_GUIDE_PATHS.map((path) => ({
    path,
    url: canonical(path),
    title:
      methods.find((method) => `/earn/${method.id}/` === path)?.title ?? 'Earning method guide',
    lastModified: undefined,
  }));
  return [...pages, ...content, ...guides];
}
export function sitemapGroup(path: string) {
  return path.startsWith('/tools/') || path.startsWith('/calc/')
    ? 'tools'
    : path.startsWith('/insights/') || path.startsWith('/research/')
      ? 'content'
      : 'site';
}
