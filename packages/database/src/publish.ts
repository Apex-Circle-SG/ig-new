import { and, eq, sql } from 'drizzle-orm';
import { incomeDistributionSchema } from '@insightginie/schema';
import type { Database } from './index';
import {
  datasetArtifacts,
  datasetIngestRuns,
  datasetPublications,
  datasetVersions,
  geographies,
  incomeBrackets,
  incomeDistributions,
} from './schema';

/** Optional durable import. The web bootstrap continues to use its Git snapshot. */
export async function publishIncomeDistribution(
  db: Database,
  datasetKey: string,
  candidate: unknown,
  publishedAt = new Date().toISOString(),
): Promise<{ datasetVersionId: string; disposition: 'published' | 'unchanged' }> {
  if (!/^[a-z0-9-]+$/.test(datasetKey)) throw new Error('Invalid dataset key.');
  if (!Number.isFinite(Date.parse(publishedAt))) throw new Error('Invalid publication timestamp.');
  const [run] = await db
    .insert(datasetIngestRuns)
    .values({ datasetKey })
    .returning({ id: datasetIngestRuns.id });
  try {
    const distribution = incomeDistributionSchema.parse(candidate);
    const version = distribution.datasetVersion;
    if (version.validationStatus !== 'validated') throw new Error('Dataset is not validated.');
    const result = await db.transaction(async (tx) => {
      // Serialize publication per source key; data from other sources can ingest concurrently.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${datasetKey}, 0))`);
      const succeed = async (disposition: 'published' | 'unchanged') => {
        await tx
          .update(datasetIngestRuns)
          .set({
            status: 'succeeded',
            finishedAt: sql`clock_timestamp()`,
            datasetVersionId: version.id,
            validationSummary: { disposition },
          })
          .where(eq(datasetIngestRuns.id, run.id));
        return { datasetVersionId: version.id, disposition };
      };
      const [existing] = await tx
        .select()
        .from(datasetVersions)
        .where(eq(datasetVersions.id, version.id));
      if (existing) {
        const [stored] = await tx
          .select()
          .from(incomeDistributions)
          .where(
            and(
              eq(incomeDistributions.id, distribution.id),
              eq(incomeDistributions.sourceDatasetVersion, version.id),
            ),
          );
        const brackets = stored
          ? await tx
              .select()
              .from(incomeBrackets)
              .where(eq(incomeBrackets.distributionId, stored.id))
              .orderBy(incomeBrackets.ordinal)
          : [];
        const artifacts = await tx
          .select()
          .from(datasetArtifacts)
          .where(eq(datasetArtifacts.datasetVersionId, version.id));
        const matching =
          existing.datasetKey === datasetKey &&
          existing.checksum === version.checksum &&
          existing.year === version.year &&
          existing.surveyYear === version.surveyYear &&
          existing.sourceName === version.sourceName &&
          existing.sourceUrl === version.sourceUrl &&
          existing.universe === version.universe &&
          existing.populationLabel === version.populationLabel &&
          existing.refreshCadence === version.refreshCadence &&
          existing.transformationVersion === version.transformationVersion &&
          existing.validationStatus === 'validated' &&
          existing.publishedAt !== null &&
          stored?.geographyId === distribution.geography.id &&
          stored.total === distribution.total &&
          stored.sourceReportedTotal === distribution.sourceReportedTotal &&
          stored.universe === distribution.universe &&
          stored.measure === distribution.measure &&
          stored.populationLabel === distribution.populationLabel &&
          stored.currency === distribution.currency &&
          JSON.stringify(stored.assumptions) === JSON.stringify(distribution.assumptions) &&
          artifacts.length === version.artifacts.length &&
          artifacts.every((artifact) =>
            version.artifacts.some(
              (incoming) =>
                incoming.name === artifact.name &&
                incoming.sourceUrl === artifact.sourceUrl &&
                incoming.checksum === artifact.checksum &&
                incoming.bytes === artifact.bytes,
            ),
          ) &&
          brackets.length === distribution.brackets.length &&
          brackets.every((bin, index) => {
            const incoming = distribution.brackets[index];
            return (
              bin.lower === incoming.lower &&
              bin.upper === incoming.upper &&
              bin.count === incoming.count &&
              bin.label === incoming.label
            );
          });
        if (!matching) throw new Error('Dataset identifier conflicts with an existing version.');
        // Replaying an older immutable version must not rewind the current pointer.
        return succeed('unchanged');
      }
      const [current] = await tx
        .select({ year: datasetVersions.year, surveyYear: datasetVersions.surveyYear })
        .from(datasetPublications)
        .innerJoin(datasetVersions, eq(datasetPublications.lastGoodVersionId, datasetVersions.id))
        .where(eq(datasetPublications.datasetKey, datasetKey));
      if (current && (version.year < current.year || version.surveyYear < current.surveyYear)) {
        throw new Error('An older release cannot automatically replace the last-good version.');
      }
      await tx
        .insert(geographies)
        .values({
          id: distribution.geography.id,
          type: distribution.geography.type,
          code: distribution.geography.id,
          name: distribution.geography.name,
          slug: distribution.geography.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        })
        .onConflictDoNothing();
      const [geography] = await tx
        .select()
        .from(geographies)
        .where(eq(geographies.id, distribution.geography.id));
      if (!geography || geography.type !== distribution.geography.type)
        throw new Error('Geography identifier conflict.');
      await tx.insert(datasetVersions).values({
        id: version.id,
        datasetKey,
        sourceName: version.sourceName,
        sourceUrl: version.sourceUrl,
        year: version.year,
        surveyYear: version.surveyYear,
        universe: version.universe,
        populationLabel: version.populationLabel,
        retrievedAt: version.retrievedAt,
        transformationVersion: version.transformationVersion,
        refreshCadence: version.refreshCadence,
        validationStatus: version.validationStatus,
        checksum: version.checksum,
        rowCount: distribution.brackets.length,
        generatedAt: publishedAt,
      });
      await tx.insert(datasetArtifacts).values(
        version.artifacts.map((artifact) => ({
          datasetVersionId: version.id,
          ...artifact,
        })),
      );
      await tx.insert(incomeDistributions).values({
        id: distribution.id,
        geographyId: distribution.geography.id,
        sourceDatasetVersion: version.id,
        transformationVersion: version.transformationVersion,
        generatedAt: publishedAt,
        universe: distribution.universe,
        populationLabel: distribution.populationLabel,
        measure: distribution.measure,
        currency: distribution.currency,
        total: distribution.total,
        sourceReportedTotal: distribution.sourceReportedTotal,
        assumptions: distribution.assumptions,
      });
      await tx.insert(incomeBrackets).values(
        distribution.brackets.map((bin, ordinal) => ({
          distributionId: distribution.id,
          ordinal,
          ...bin,
        })),
      );
      await tx
        .insert(datasetPublications)
        .values({ datasetKey, lastGoodVersionId: version.id, publishedAt })
        .onConflictDoUpdate({
          target: datasetPublications.datasetKey,
          set: { lastGoodVersionId: version.id, publishedAt },
        });
      return succeed('published');
    });
    return result;
  } catch (error) {
    await db
      .update(datasetIngestRuns)
      .set({
        status: 'failed',
        finishedAt: sql`clock_timestamp()`,
        errorCode: 'INCOME_PUBLICATION_REJECTED',
      })
      .where(eq(datasetIngestRuns.id, run.id));
    throw error;
  }
}
