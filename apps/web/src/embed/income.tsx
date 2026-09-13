import { calculateIndividualIncomePercentile } from '@insightginie/calculators';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { IncomeTool } from '../components/income-tool';

/** Same validated source and deterministic engine used for SSR and browser calculations. */
export function IncomeEmbed({ compact = false }: { compact?: boolean }) {
  const distribution = getIndividualIncomeDistribution();
  const initialOutput = calculateIndividualIncomePercentile(
    { annualIncome: 75000 },
    {
      distribution,
      calculatedAt: distribution?.datasetVersion.retrievedAt ?? '2026-09-12T00:00:00.000Z',
    },
  );
  return (
    <IncomeTool
      distribution={distribution}
      initialOutput={initialOutput}
      compact={compact}
      embedded
    />
  );
}
