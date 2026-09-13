import { describe, expect, it } from 'vitest';
import {
  getIndividualIncomeDistribution,
  incomeDistributionRows,
  incomeDistributionCsv,
  incomeOverviewGroups,
} from '@insightginie/datasets';

describe('public income export', () => {
  const distribution = getIndividualIncomeDistribution()!;
  it('preserves the full published population across every visualization group', () => {
    const groups = incomeOverviewGroups(distribution);
    expect(groups.reduce((sum, group) => sum + group.count, 0)).toBe(distribution.total);
    expect(groups.reduce((sum, group) => sum + group.share, 0)).toBeCloseTo(100, 10);
    expect(incomeDistributionRows(distribution).at(-1)?.cumulativeShare).toBe(100);
  });
  it('exports every band with open bounds preserved and reproducible provenance', () => {
    const csv = incomeDistributionCsv(distribution);
    expect(csv.trimEnd().split('\r\n')).toHaveLength(distribution.brackets.length + 1);
    expect(csv).toContain('"lower_usd_inclusive","upper_usd_exclusive"');
    expect(csv).toContain(distribution.id);
    expect(csv).toContain(distribution.datasetVersion.sourceUrl);
    expect(csv).toBe(incomeDistributionCsv(distribution));
  });
});
