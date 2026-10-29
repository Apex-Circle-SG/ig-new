import { describe, it, expect } from 'vitest';
import { calculateIndividualIncomePercentile } from '@insightginie/calculators';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { isCalculatorPage, isPublicAdvertisingPath } from '@insightginie/seo';
import { incomeBandInsight } from '../../apps/web/src/lib/income-share';
import config from '../../apps/web/next.config';

describe('quick wins privacy and discovery', () => {
  it('shares a source band without exact income or interpolated rank', () => {
    const output = calculateIndividualIncomePercentile(
      { annualIncome: 137891.23 },
      { distribution: getIndividualIncomeDistribution(), calculatedAt: '2026-10-29T00:00:00.000Z' },
    );
    const share = incomeBandInsight(output);
    expect(share).toContain('$100,000');
    expect(share).toContain('83.32–91.91%');
    expect(share).not.toMatch(/137[,.]?891|89\.8/);
    expect(share).toContain('https://insightginie.com/calc/individual-income-percentile/');
    expect(share).toContain('cannot pinpoint');
    expect(output.datasetVersion?.id).toBe('census-cps-asec-2025-pinc11-us-67587226ba277577-v1');
  });
  it('fails closed without the validated distribution', () => {
    const output = calculateIndividualIncomePercentile(
      { annualIncome: 75000 },
      { distribution: null, calculatedAt: '2026-10-29T00:00:00.000Z' },
    );
    expect(incomeBandInsight(output)).toBe('');
  });
  it.each([
    '/calc/individual-income-percentile/',
    '/tools/cash-runway/',
    '/tools/ai-workflow-roi/',
    '/private-tools/business-loan/',
    '/embed/income-distribution/',
  ])('excludes %s from advertising', (path) => {
    expect(isCalculatorPage(path)).toBe(true);
    expect(isPublicAdvertisingPath(path)).toBe(false);
  });
  it('redirects only the two duplicate hubs', async () => {
    expect(await config.redirects?.()).toEqual([
      { source: '/tools/', destination: '/calculators/', statusCode: 301 },
      { source: '/calc/', destination: '/calculators/', statusCode: 301 },
    ]);
  });
});
