import { describe, expect, it } from 'vitest';
import { getKnowledgeArticles, getLibraryTools } from '../../apps/web/src/lib/library';

describe('library directory', () => {
  it('contains uniquely identified, safe web links from the collection', async () => {
    const tools = await getLibraryTools();
    expect(tools.length).toBeGreaterThan(700);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(tools.length);
    for (const tool of tools) {
      expect(tool.title && tool.category).toBeTruthy();
      const url = new URL(tool.url);
      expect(['http:', 'https:']).toContain(url.protocol);
      expect(url.hostname).toContain('.');
    }
  });
  it('provides unique, readable knowledge articles with safe source links', async () => {
    const articles = await getKnowledgeArticles();
    expect(articles.length).toBeGreaterThan(0);
    expect(new Set(articles.map((article) => article.slug)).size).toBe(articles.length);
    for (const article of articles) {
      expect(article.sections.length).toBeGreaterThan(0);
      expect(article.sections.every((section) => section.heading && section.body)).toBe(true);
      for (const source of article.sources) expect(new URL(source.url).protocol).toBe('https:');
    }
  });

});
