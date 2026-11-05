import { describe, expect, it } from 'vitest';
import { getLibraryTools } from '../../apps/web/src/lib/library';

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
});
