import { canonical, PUBLIC_INDEXABLE_PATHS, PUBLIC_EARNING_GUIDE_PATHS } from '@insightginie/seo';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import { getPublishedContent } from './content';
import methods from '../../../opportunities/data/methods.json';
import { discoveryHubs } from './discovery-hubs';
import libraryKnowledge from './library/knowledge.json';

import { DEAL_TOOLS } from '@insightginie/calculators/deals';

const names: Record<string, string> = {
  '/': 'Home',
  '/calculators/corporate-finance/': 'Corporate finance and deal workspaces',
  '/calculators/markets/': 'Trading and market analysis',
  ...Object.fromEntries(DEAL_TOOLS.map(t => [t.path, t.title])),
  '/opportunities/': 'Online opportunities and remote work',
  '/opportunities/sources/': 'Opportunity sources and freshness',
  '/ideas/': 'Creative business idea lab',
  '/platforms/': 'Earning platforms',
  '/earn/': 'Creative ways to earn online',
  ...Object.fromEntries(discoveryHubs.map((hub) => [hub.path, hub.title])),
  '/calculators/casino/': 'Casino probability calculators',
  '/calculators/roulette/': 'Roulette odds & simulator',
  '/calculators/casino/expected-value/': 'Expected value & house edge',
  '/calculators/casino/losing-streak/': 'Losing-streak probability',
  '/calculators/casino/dice/': 'Two-dice probability',
  '/calculators/': 'Calculators — Understand where you stand',
  '/calc/individual-income-percentile/': 'Individual income percentile',
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
  '/guides/': 'Guides: US income, explained in bands',
  '/guides/what-before-tax-income-means/': 'What does before-tax income mean?',
  '/guides/how-many-americans-earn-50000-to-100000/':
    'How many Americans earn between $50,000 and $100,000?',
  '/guides/why-median-income-is-a-range/': 'Why is the median US income a range, $37,500–$39,999?',
  '/guides/do-most-americans-earn-more-than-75000/':
    'Do most Americans earn more than $75,000 a year?',
  '/guides/income-above-half-of-americans/':
    'How much do you need to earn to be above half of all Americans?',
  '/guides/what-income-band-are-you-in/':
    'What income band are you in? (A 4-question check, not a precise ranking)',
  '/guides/what-percentile-is-60000-a-year/': 'What percentile is $60,000 a year in the US?',
  '/guides/what-is-the-average-salary-in-america/': 'What is the average salary in America?',
  '/guides/household-vs-individual-income/': 'Household income vs. individual income: why the two figures differ',
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
  const knowledgeGuides = libraryKnowledge.map((article) => ({
    path: `/library/knowledge/${article.slug}/`,
    url: canonical(`/library/knowledge/${article.slug}/`),
    title: article.title,
    lastModified: undefined,
  }));
  return [...pages, ...content, ...guides, ...knowledgeGuides];
}
export function sitemapGroup(path: string) {
  return path.startsWith('/calculators/') || path.startsWith('/tools/') || path.startsWith('/calc/')
    ? 'tools'
    : path.startsWith('/insights/') ||
        path.startsWith('/research/') ||
        path.startsWith('/library/knowledge/')
      ? 'content'
      : 'site';
}
