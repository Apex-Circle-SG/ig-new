export type PageCandidate = {
  canonicalEntityKey: string;
  canonicalPath: string;
  sourceVersions: string[];
  checks: {
    uniqueEntity: boolean;
    completeCriticalData: boolean;
    sourcesValidated: boolean;
    calculatorFunctional: boolean;
    meaningfulComparison: boolean;
    metadataValid: boolean;
    schemaValid: boolean;
    internalLinksValid: boolean;
    crawlableHtml: boolean;
    performanceAcceptable: boolean;
    noNearDuplicate: boolean;
  };
  scores: {
    dataUniqueness: number;
    dataCompleteness: number;
    interactionValue: number;
    comparisonValue: number;
    sourceQuality: number;
    freshness: number;
    internalLinkValue: number;
    contentUniqueness: number;
  };
};
/** Passing permits review only; publication requires a separate recorded batch approval. */
export function evaluatePageQuality(candidate: PageCandidate, threshold = 85) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100)
    throw new RangeError('Quality threshold must be 0–100');
  const requiredChecks = [
    'uniqueEntity',
    'completeCriticalData',
    'sourcesValidated',
    'calculatorFunctional',
    'meaningfulComparison',
    'metadataValid',
    'schemaValid',
    'internalLinksValid',
    'crawlableHtml',
    'performanceAcceptable',
    'noNearDuplicate',
  ] as const;
  const blockers: string[] = requiredChecks.filter((key) => candidate.checks?.[key] !== true);
  if (!candidate.canonicalEntityKey.trim()) blockers.push('missingCanonicalEntity');
  if (!/^\/us\/[a-z-]+\/[a-z-]+\/salary-[a-z-]+\/$/.test(candidate.canonicalPath))
    blockers.push('invalidCanonicalPath');
  if (!candidate.sourceVersions.length || candidate.sourceVersions.some((v) => !v.trim()))
    blockers.push('missingSources');
  const weights = {
    dataUniqueness: 0.15,
    dataCompleteness: 0.2,
    interactionValue: 0.15,
    comparisonValue: 0.1,
    sourceQuality: 0.15,
    freshness: 0.1,
    internalLinkValue: 0.05,
    contentUniqueness: 0.1,
  };
  const values = Object.keys(weights).map((key) => candidate.scores?.[key as keyof typeof weights]);
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100))
    throw new RangeError('Component scores must be 0–100');
  const score =
    Math.round(
      Object.entries(weights).reduce(
        (sum, [key, weight]) => sum + candidate.scores[key as keyof typeof weights] * weight,
        0,
      ) * 100,
    ) / 100;
  if (score < threshold) blockers.push('belowThreshold');
  return {
    score,
    threshold,
    blockers,
    eligibleForReview: blockers.length === 0,
    publishable: false as const,
  };
}
