import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import type { GroundingDocument } from './core';
import { getApprovedPublicDocuments } from '../content';

/** Hand-reviewed product explanations; imported editorial content is excluded by default. */
export function getAskKnowledge(): GroundingDocument[] {
  const distribution = getIndividualIncomeDistribution();
  const tools: GroundingDocument[] = FINANCE_TOOLS.map((tool) => ({
    id: tool.id,
    title: tool.title,
    path: `/tools/${tool.id}/`,
    text: `${tool.description} ${tool.methodology.join(' ')}`,
    updatedAt: '2026-09-13',
    approved: true as const,
    keywords: [tool.id, tool.category],
    sources: tool.sources.map(({ name, url }) => ({ name, url })),
  }));
  tools.push(
    ...getApprovedPublicDocuments().map((document) => ({
      ...document,
      keywords: [],
      sources: document.sources.map((url) => ({
        name: new URL(url).hostname === 'insightginie.com' ? document.title : new URL(url).hostname,
        url,
      })),
    })),
  );
  if (!distribution) return tools;
  return [
    ...tools,
    {
      id: 'individual-income-percentile',
      title: 'Individual income percentile',
      path: '/calc/individual-income-percentile/',
      approved: true,
      updatedAt: distribution.datasetVersion.retrievedAt,
      keywords: ['income', 'salary', 'percentile', 'rank', 'earnings', 'census'],
      text: `The individual income calculator compares annual income before taxes with ${distribution.populationLabel}. It uses ${distribution.datasetVersion.year} income data from the US Census Bureau. Between published income-band boundaries, it estimates rank by assuming an even distribution within the band. Open-ended bands return a range. This is not an age, occupation, city or household comparison.`,
      sources: [
        {
          name: distribution.datasetVersion.sourceName,
          url: distribution.datasetVersion.sourceUrl,
        },
      ],
    },
    {
      id: 'privacy',
      title: 'How calculator privacy works',
      path: '/privacy/',
      approved: true,
      updatedAt: '2026-09-13',
      keywords: ['privacy', 'private', 'data', 'save', 'share'],
      text: 'Calculator inputs and results stay inside a separate browser sandbox. Public share links contain only the tool address. Downloads are created locally when you request them. Ginie source selection sends Datadog only approved public excerpts and a general topic category. When general AI answers are enabled, unmatched questions are sent to Datadog after identifier checks and omission of detected financial amounts. Filters do not guarantee removal of all private information; avoid personal or confidential details. Conversation history, browser headers and cookies are not forwarded. The application does not persist prompts or answers, attach them to analytics, or cache general questions and answers. Datadog may retain general prompts and generated answers under its account policy.',
      sources: [{ name: 'InsightGinie privacy policy', url: 'https://insightginie.com/privacy/' }],
    },
  ];
}
