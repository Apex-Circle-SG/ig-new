import { DEAL_TOOLS } from '@insightginie/calculators/deals';
import { canonical } from '@insightginie/seo';
import tools from './tools.json';

export type LibraryTool = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  url: string;
};

export async function getLibraryTools(): Promise<LibraryTool[]> {
  return [
    ...tools,
    ...DEAL_TOOLS.map((t) => ({
      id: t.id,
      title: t.title,
      category: 'Calculators',
      subcategory: t.category,
      url: canonical(t.path),
    })),
  ];
}

import knowledge from './knowledge.json';
export type KnowledgeArticle = (typeof knowledge)[number];
export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  return knowledge;
}
