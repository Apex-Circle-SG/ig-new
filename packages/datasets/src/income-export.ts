import type { IncomeDistribution } from '@insightginie/schema';

export function incomeDistributionRows(distribution: IncomeDistribution) {
  let cumulative = 0;
  return distribution.brackets.map((bracket) => {
    cumulative += bracket.count;
    return {
      ...bracket,
      share: (bracket.count / distribution.total) * 100,
      cumulativeShare: (cumulative / distribution.total) * 100,
    };
  });
}

export function incomeDistributionCsv(distribution: IncomeDistribution) {
  const quote = (value: string | number | null) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows = incomeDistributionRows(distribution);
  return (
    [
      [
        'income_band',
        'lower_usd_inclusive',
        'upper_usd_exclusive',
        'estimated_people',
        'share_percent',
        'cumulative_share_percent',
        'income_year',
        'dataset_version',
        'source_url',
      ],
      ...rows.map((row) => [
        row.label,
        row.lower,
        row.upper,
        row.count,
        row.share,
        row.cumulativeShare,
        distribution.datasetVersion.year,
        distribution.id,
        distribution.datasetVersion.sourceUrl,
      ]),
    ]
      .map((row) => row.map(quote).join(','))
      .join('\r\n') + '\r\n'
  );
}

export function incomeOverviewGroups(distribution: IncomeDistribution) {
  const groups = [
    { label: 'Under $25,000', lower: null, upper: 25000 },
    { label: '$25,000–$49,999', lower: 25000, upper: 50000 },
    { label: '$50,000–$74,999', lower: 50000, upper: 75000 },
    { label: '$75,000–$99,999', lower: 75000, upper: 100000 },
    { label: '$100,000–$149,999', lower: 100000, upper: 150000 },
    { label: '$150,000–$199,999', lower: 150000, upper: 200000 },
    { label: '$200,000–$249,999', lower: 200000, upper: 250000 },
    { label: '$250,000 and over', lower: 250000, upper: null },
  ];
  return groups.map((group) => {
    const count = distribution.brackets
      .filter(
        (bin) =>
          (group.lower === null || (bin.lower !== null && bin.lower >= group.lower)) &&
          (group.upper === null || (bin.upper !== null && bin.upper <= group.upper)),
      )
      .reduce((sum, bin) => sum + bin.count, 0);
    return { ...group, count, share: (count / distribution.total) * 100 };
  });
}
