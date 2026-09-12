import { describe, it, expect } from 'vitest';
import { evaluatePageQuality, type PageCandidate } from '@insightginie/seo';
const candidate: PageCandidate = {
  canonicalEntityKey: 'test-metro:test-occupation',
  canonicalPath: '/us/texas/austin/salary-software-developer/',
  sourceVersions: ['test-source'],
  checks: {
    uniqueEntity: true,
    completeCriticalData: true,
    sourcesValidated: true,
    calculatorFunctional: true,
    meaningfulComparison: true,
    metadataValid: true,
    schemaValid: true,
    internalLinksValid: true,
    crawlableHtml: true,
    performanceAcceptable: true,
    noNearDuplicate: true,
  },
  scores: {
    dataUniqueness: 100,
    dataCompleteness: 100,
    interactionValue: 100,
    comparisonValue: 100,
    sourceQuality: 100,
    freshness: 100,
    internalLinkValue: 100,
    contentUniqueness: 100,
  },
};
describe('publication quality cannot authorize a batch', () => {
  it('a perfect score only permits review', () =>
    expect(evaluatePageQuality(candidate)).toMatchObject({
      score: 100,
      eligibleForReview: true,
      publishable: false,
    }));
  it.each(Object.keys(candidate.checks))(
    'critical failure %s blocks even a perfect score',
    (key) => {
      const result = evaluatePageQuality({
        ...candidate,
        checks: { ...candidate.checks, [key]: false },
      });
      expect(result.eligibleForReview).toBe(false);
      expect(result.blockers).toContain(key);
    },
  );
  it('missing runtime checks cannot bypass validation', () => {
    const incomplete = { ...candidate, checks: {} } as PageCandidate;
    expect(evaluatePageQuality(incomplete).eligibleForReview).toBe(false);
    expect(() => evaluatePageQuality({ ...candidate, scores: {} } as PageCandidate)).toThrow();
  });
  it('rejects invalid scores and thresholds', () => {
    expect(() => evaluatePageQuality(candidate, NaN)).toThrow();
    expect(() =>
      evaluatePageQuality({ ...candidate, scores: { ...candidate.scores, freshness: Infinity } }),
    ).toThrow();
  });
  it('invalid sources, paths and duplicate entities block review', () => {
    expect(
      evaluatePageQuality({
        ...candidate,
        sourceVersions: [],
        canonicalPath: '/?salary=test',
        canonicalEntityKey: '',
      }).eligibleForReview,
    ).toBe(false);
  });
});
