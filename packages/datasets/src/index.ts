import { incomeDistributionSchema, type IncomeDistribution } from '@insightginie/schema';
import manifest from '../data/last-good.json';

/** A fresh validated value prevents one consumer from mutating another consumer's data. */
export function getIndividualIncomeDistribution(): IncomeDistribution | null {
  const result = incomeDistributionSchema.safeParse(manifest.distribution);
  if (!result.success || result.data.datasetVersion.validationStatus !== 'validated') return null;
  if (
    result.data.id !== manifest.versionId ||
    result.data.datasetVersion.checksum !== manifest.checksum
  )
    return null;
  return result.data;
}

export type { DatasetVersion, IncomeDistribution, IncomeBracket } from '@insightginie/schema';
