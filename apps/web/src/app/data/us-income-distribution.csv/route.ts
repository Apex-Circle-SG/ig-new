import { getIndividualIncomeDistribution, incomeDistributionCsv } from '@insightginie/datasets';

export function GET() {
  const distribution = getIndividualIncomeDistribution();
  if (!distribution) return new Response('Data unavailable', { status: 503 });
  return new Response(incomeDistributionCsv(distribution), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="us-individual-income-${distribution.datasetVersion.year}.csv"`,
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex',
      'X-Dataset-Version': distribution.id,
    },
  });
}
