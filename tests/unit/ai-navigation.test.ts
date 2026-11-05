import { describe, expect, it } from 'vitest';
import { getAiGuideContent } from '../../apps/web/src/lib/library/ai/catalog';
import articles from '../../apps/web/src/lib/library/knowledge.json';

describe('AI reader navigation', () => {
  const hub = articles.find((article) => article.slug === 'ai-learning-hub')!;

  it('makes every published guide discoverable once without exposing other topics', () => {
    const { paths } = getAiGuideContent(hub, articles);
    const visible = paths.flatMap((path) => path.articles.map((article) => article.slug));
    const published = articles.filter(
      (article) => article.topic === 'Artificial intelligence' && article.slug !== hub.slug,
    );
    expect(new Set(visible).size).toBe(published.length);
    expect(visible).toHaveLength(published.length);
    expect(visible).not.toContain('bitcoin');
  });

  it('includes a newly introduced category without a separate slug registration', () => {
    const newGuide = { ...hub, slug: 'new-ai-guide', group: 'New research area' };
    const { paths } = getAiGuideContent(hub, [...articles, newGuide]);
    expect(paths.find((path) => path.name === newGuide.group)?.articles).toEqual([newGuide]);
  });

  it('keeps the current page out of related reading and attaches its numerical examples', () => {
    const article = articles.find((item) => item.slug === 'ai-attention-example')!;
    const { related, lesson, examples } = getAiGuideContent(article, articles);
    expect(related.every((item) => item.slug !== article.slug)).toBe(true);
    expect(lesson?.title).toBe('Self-attention with two tokens');
    expect(examples.map((example) => example.sourceImage)).toEqual([13, 16]);
  });
});
