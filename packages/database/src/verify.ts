import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { incomeDistributionSchema } from '@insightginie/schema';
import { createDatabase } from './index';
import { publishIncomeDistribution } from './publish';

/** Integration verification only; never a production seed or data ingest. */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Database verification requires DATABASE_URL.');
  const raw = postgres(process.env.DATABASE_URL, { max: 3, prepare: false, onnotice: () => {} });
  const database = createDatabase();
  let checks = 0;
  const rejected = async (action: () => Promise<unknown>, code = '23514') => {
    await assert.rejects(
      action,
      (error: unknown) =>
        typeof error === 'object' && error !== null && 'code' in error && error.code === code,
    );
    checks += 1;
  };
  try {
    const [identity] = await raw`select current_database() as name`;
    assert.match(
      identity.name as string,
      /^insightginie_(ci|verify)$/,
      'Use only a disposable verification database.',
    );
    const fixtureId = randomUUID().replaceAll('-', '');
    const manifest = JSON.parse(
      await readFile(new URL('../../datasets/data/last-good.json', import.meta.url), 'utf8'),
    );
    const fixture = incomeDistributionSchema.parse(manifest.distribution);
    // Unique IDs isolate repeated verification runs. Source values remain real.
    fixture.id = `verify-${fixtureId}`;
    fixture.datasetVersion.id = fixture.id;
    const datasetKey = `verify-${fixtureId}`;
    const first = await publishIncomeDistribution(database.db, datasetKey, fixture);
    assert.equal(first.disposition, 'published');
    const second = await publishIncomeDistribution(database.db, datasetKey, fixture);
    assert.equal(second.disposition, 'unchanged');
    checks += 2;

    // A database error after a source-version INSERT must roll back all source
    // changes and retain last-good. Duplicate artifact names force that error.
    const broken = structuredClone(fixture);
    broken.id += '-broken';
    broken.datasetVersion.id = broken.id;
    broken.datasetVersion.transformationVersion += '-broken';
    broken.datasetVersion.artifacts.push(broken.datasetVersion.artifacts[0]);
    await assert.rejects(() => publishIncomeDistribution(database.db, datasetKey, broken));
    const [pointer] =
      await raw`select last_good_version_id from dataset_publications where dataset_key = ${datasetKey}`;
    assert.equal(pointer.last_good_version_id, fixture.id);
    assert.equal((await raw`select id from dataset_versions where id = ${broken.id}`).length, 0);
    const [failedRun] =
      await raw`select error_code from dataset_ingest_runs where dataset_key = ${datasetKey} and status = 'failed'`;
    assert.equal(failedRun.error_code, 'INCOME_PUBLICATION_REJECTED');
    checks += 3;

    // A different distribution cannot masquerade as an idempotent replay.
    const collision = structuredClone(fixture);
    collision.brackets[0].count += 1;
    collision.brackets[1].count -= 1;
    await assert.rejects(() => publishIncomeDistribution(database.db, datasetKey, collision));
    checks += 1;

    await rejected(() => raw`update dataset_versions set year = year - 1 where id = ${fixture.id}`);
    await rejected(
      () =>
        raw`update income_brackets set count = count + 1 where distribution_id = ${fixture.id} and ordinal = 0`,
    );
    await rejected(() => raw`delete from income_distributions where id = ${fixture.id}`);
    await rejected(
      () =>
        raw`update dataset_artifacts set bytes = bytes + 1 where dataset_version_id = ${fixture.id}`,
    );

    // Synthetic distributions stay within rollback-only fixture transactions.
    const rollback = new Error('ROLLBACK_VERIFICATION_FIXTURE');
    try {
      await raw.begin(async (tx) => {
        const invalidId = `${fixture.id}-invalid`;
        await tx`insert into dataset_versions (id, dataset_key, source_name, source_url, year, survey_year, universe,
          population_label, retrieved_at, transformation_version, refresh_cadence, validation_status, checksum, row_count)
          values (${invalidId}, ${datasetKey}, 'Synthetic database verification', 'https://www.census.gov/', 2024, 2025,
            'Synthetic fixture only', 'Synthetic fixture only', now(), 'verification-only', 'annual', 'pending', ${'a'.repeat(64)}, 3)`;
        await tx`insert into dataset_artifacts (dataset_version_id, name, source_url, checksum, bytes)
          values (${invalidId}, 'synthetic', 'https://www.census.gov/', ${'b'.repeat(64)}, 1)`;
        await tx`insert into income_distributions (id, geography_id, source_dataset_version, transformation_version,
          generated_at, universe, population_label, measure, total, source_reported_total, assumptions)
          values (${invalidId}, ${fixture.geography.id}, ${invalidId}, 'verification-only', now(),
            'Synthetic fixture only', 'Synthetic fixture only', 'individual-total-money-income', 100, 100, '["Verification only"]')`;
        await tx`insert into income_brackets (distribution_id, ordinal, lower_bound, upper_bound, count, label)
          values (${invalidId}, 0, null, 10, 20, 'First'), (${invalidId}, 1, 10, 20, 50, 'Middle'), (${invalidId}, 2, 20, null, 30, 'Last')`;
        const advance = () =>
          tx.savepoint(async (save) => {
            await save`update dataset_publications set last_good_version_id = ${invalidId} where dataset_key = ${datasetKey}`;
          });
        await rejected(advance); // Pending source version.
        await tx`update dataset_versions set validation_status = 'validated' where id = ${invalidId}`;
        await tx`update dataset_versions set row_count = 4 where id = ${invalidId}`;
        await rejected(advance); // Incorrect normalized row-count metadata.
        await tx`update dataset_versions set row_count = 3 where id = ${invalidId}`;
        await tx`update income_brackets set count = 21 where distribution_id = ${invalidId} and ordinal = 0`;
        await rejected(advance); // Incorrect total.
        await tx`update income_brackets set count = 20 where distribution_id = ${invalidId} and ordinal = 0`;
        await tx`update income_brackets set lower_bound = 11 where distribution_id = ${invalidId} and ordinal = 1`;
        await rejected(advance); // Gap.
        await tx`update income_brackets set lower_bound = 9 where distribution_id = ${invalidId} and ordinal = 1`;
        await rejected(advance); // Overlap.
        await tx`update income_brackets set lower_bound = 10 where distribution_id = ${invalidId} and ordinal = 1`;
        await tx`update income_brackets set ordinal = 3 where distribution_id = ${invalidId} and ordinal = 2`;
        await rejected(advance); // Non-contiguous ordinal.
        await tx`update income_brackets set ordinal = 2 where distribution_id = ${invalidId} and ordinal = 3`;
        await advance();
        const [valid] =
          await tx`select last_good_version_id from dataset_publications where dataset_key = ${datasetKey}`;
        assert.equal(valid.last_good_version_id, invalidId);
        checks += 1;
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
    const [preserved] =
      await raw`select last_good_version_id from dataset_publications where dataset_key = ${datasetKey}`;
    assert.equal(preserved.last_good_version_id, fixture.id);
    checks += 1;

    await rejected(
      () => raw`insert into programmatic_pages (canonical_path, entity_key, template, state,
      source_dataset_version, transformation_version, fact_object, quality_score)
      values (${`/verify/${fixtureId}/`}, ${fixtureId}, 'verification', 'PUBLISHED', ${fixture.id}, 'v1', '{}', 100)`,
    );
    await rejected(
      () => raw`insert into redirect_registry (source_path, status_code, destination_path, reason, evidence, approved_by, approved_at)
      values (${`/verify/${fixtureId}/`}, 301, ${`/verify/${fixtureId}/`}, 'Verification', 'Verification', 'verification', now())`,
    );
    await rejected(
      () => raw`insert into redirect_registry (source_path, status_code, destination_path, reason, evidence, approved_by, approved_at)
      values (${`/verify/${fixtureId}/`}, 410, '/', 'Verification', 'Verification', 'verification', now())`,
    );
    await rejected(
      () => raw`insert into redirect_registry (source_path, status_code, destination_path, reason, evidence, approved_by, approved_at)
      values (${`/verify/${fixtureId}/`}, 301, '//external.example/', 'Verification', 'Verification', 'verification', now())`,
    );

    try {
      await raw.begin(async (tx) => {
        const pageId = randomUUID();
        const batchId = randomUUID();
        const pagePath = `/verify/${fixtureId}/`;
        await tx`insert into programmatic_pages (id, canonical_path, entity_key, template, state,
          source_dataset_version, transformation_version, fact_object, quality_score, quality_checked_at,
          approval_batch_id, approved_by, approved_at, published_at)
          values (${pageId}, ${pagePath}, ${fixtureId}, 'verification', 'PUBLISHED', ${fixture.id}, 'v1', '{}',
            100, now(), ${batchId}, 'verification', now(), now())`;
        await rejected(() =>
          tx.savepoint(async (save) => {
            await save`update programmatic_pages set fact_object = '{"changed":true}' where id = ${pageId}`;
          }),
        );
        await rejected(() =>
          tx.savepoint(async (save) => {
            await save`update programmatic_pages set quality_score = 84 where id = ${pageId}`;
          }),
        );
        await rejected(
          () =>
            tx.savepoint(async (save) => {
              await save`insert into programmatic_pages (canonical_path, entity_key, template, source_dataset_version,
            transformation_version, fact_object) values (${pagePath}, ${`${fixtureId}-duplicate`}, 'verification', ${fixture.id}, 'v1', '{}')`;
            }),
          '23505',
        );
        await tx`update programmatic_pages set state = 'DRAFT', fact_object = '{"changed":true}',
          approved_at = null, approved_by = null, approval_batch_id = null, quality_score = null,
          quality_checked_at = null, published_at = null where id = ${pageId}`;
        const [draft] = await tx`select state from programmatic_pages where id = ${pageId}`;
        assert.equal(draft.state, 'DRAFT');
        checks += 2; // Explicitly approved publication and reset before new facts.
        const auditId = randomUUID();
        await tx`insert into audit_logs (id, actor, action, resource_type, resource_id)
          values (${auditId}, 'verification', 'verify', 'fixture', ${fixtureId})`;
        await rejected(() =>
          tx.savepoint(async (save) => {
            await save`update audit_logs set actor = 'changed' where id = ${auditId}`;
          }),
        );
        await rejected(() =>
          tx.savepoint(async (save) => {
            await save`delete from audit_logs where id = ${auditId}`;
          }),
        );
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }

    const privateTables =
      await raw`select relname, relrowsecurity, relforcerowsecurity from pg_class
      where relnamespace = 'public'::regnamespace and relname in ('users', 'profiles', 'saved_scenarios')`;
    assert.equal(privateTables.length, 3);
    assert.ok(privateTables.every((table) => table.relrowsecurity && table.relforcerowsecurity));
    assert.equal(
      (
        await raw`select policyname from pg_policies where schemaname = 'public' and tablename in ('users', 'profiles', 'saved_scenarios')`
      ).length,
      0,
    );
    checks += 2;
    // Verify RLS enforcement with an unprivileged role. CREATE ROLE is transactional
    // and rolled back along with its grant, so no extra role survives the check.
    try {
      await raw.begin(async (tx) => {
        const role = `verify_reader_${fixtureId}`;
        await tx`create role ${tx(role)} nologin`;
        await tx`grant usage on schema public to ${tx(role)}`;
        await tx`grant select, insert on users, profiles, saved_scenarios to ${tx(role)}`;
        await tx`insert into users (auth_subject) values (${`verification-${fixtureId}`})`;
        await tx`set local role ${tx(role)}`;
        assert.equal((await tx`select * from users`).length, 0);
        await rejected(
          () =>
            tx.savepoint(async (save) => {
              await save`insert into users (auth_subject) values ('verification')`;
            }),
          '42501',
        );
        checks += 1;
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
    console.log(`Database verification passed: ${checks} checks.`);
  } finally {
    await database.close();
    await raw.end({ timeout: 5 });
  }
}

main().catch(() => {
  // Source query errors may include connection or row contents. Keep public logs controlled.
  console.error(
    'Database verification failed. Use a migrated disposable PostgreSQL database and inspect secured logs.',
  );
  process.exitCode = 1;
});
