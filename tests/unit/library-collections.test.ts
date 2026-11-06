import { describe, expect, it } from 'vitest';
import { collectionContains, collectionPath, primaryCollection } from '../../apps/web/src/lib/library/collection-navigation';

describe('library collection navigation', () => {
  it('keeps historical chapters discoverable through the full business hierarchy', () => {
    expect(collectionPath('art-of-war-planning').map((item) => item.slug)).toEqual(['business-management', 'strategy-growth', 'art-of-war']);
    expect(collectionContains('strategy-growth', 'art-of-war-planning')).toBe(true);
    expect(collectionContains('marketing-strategy', 'art-of-war-planning')).toBe(false);
  });

  it('gives moved readings one primary home while retaining their slug', () => {
    expect(primaryCollection('personal-productivity')?.slug).toBe('communication-personal-development');
    expect(primaryCollection('marketing-logistics')?.slug).toBe('operations-performance');
  });

  it('does not assign missing articles or root hubs to an unrelated collection', () => {
    expect(collectionPath('missing-guide')).toEqual([]);
    expect(primaryCollection('business-management')).toBeUndefined();
    expect(collectionContains('business-management', 'missing-guide')).toBe(false);
  });
});
