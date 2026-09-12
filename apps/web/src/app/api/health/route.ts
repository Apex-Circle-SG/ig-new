import { getIndividualIncomeDistribution } from '@insightginie/datasets';
export const dynamic = 'force-dynamic';
export function GET() {
  const d = getIndividualIncomeDistribution();
  return Response.json(
    {
      status: d ? 'ok' : 'degraded',
      dataset: d
        ? {
            id: d.datasetVersion.id,
            year: d.datasetVersion.year,
            validationStatus: d.datasetVersion.validationStatus,
          }
        : null,
    },
    { status: d ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
