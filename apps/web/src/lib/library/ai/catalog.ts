import type { KnowledgeArticle } from '..';
import lessons from './worked-lessons.json';
import examples from './reconstructions.json';

const learningPaths = [
  { name: 'Start here', description: 'Build a foundation and find your next step.' },
  { name: 'Working with data', description: 'Prepare data and measure what matters.' },
  { name: 'How models work', description: 'Explore networks, language, images and generation.' },
  { name: 'Math and worked examples', description: 'Follow the arithmetic and the assumptions.' },
  { name: 'Build AI systems', description: 'Connect models to knowledge and tools.' },
  { name: 'Responsible AI', description: 'Understand risk, governance and agent boundaries.' },
  { name: 'Reference', description: 'Look up terms and follow related reading.' },
];

/** Build navigation from published articles so new guides cannot disappear from a manual slug list. */
export function getAiGuideContent(article: KnowledgeArticle, articles: KnowledgeArticle[]) {
  const guides = articles.filter(
    (item) => item.topic === 'Artificial intelligence' && item.slug !== 'ai-learning-hub',
  );
  const additionalGroups = [...new Set(guides.map((guide) => guide.group))]
    .filter((name) => !learningPaths.some((path) => path.name === name))
    .map((name) => ({ name, description: `Explore ${name.toLowerCase()}.` }));
  const paths = [...learningPaths, ...additionalGroups]
    .map((path) => ({ ...path, articles: guides.filter((guide) => guide.group === path.name) }))
    .filter((path) => path.articles.length > 0);
  const peers = guides.filter(
    (guide) => guide.slug !== article.slug && guide.group === article.group,
  );
  const related = (
    peers.length ? peers : guides.filter((guide) => guide.slug !== article.slug)
  ).slice(0, 3);

  return {
    paths,
    related,
    lesson: lessons.find((item) => item.slug === article.slug),
    examples: examples.filter((item) => item.slug === article.slug),
  };
}
