import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

const time = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });
const count = (name: string) => bigint(name, { mode: 'number' });

export const geographyType = pgEnum('geography_type', [
  'nation',
  'state',
  'county',
  'metro',
  'city',
  'zip',
]);
export const validationStatus = pgEnum('validation_status', ['pending', 'validated', 'failed']);
export const ingestStatus = pgEnum('ingest_status', ['running', 'succeeded', 'failed']);
export const pageState = pgEnum('page_state', [
  'DRAFT',
  'QUALITY_CHECK',
  'PUBLISHED',
  'MONITORING',
  'RETAIN',
  'REFRESH',
  'MERGE',
  'RETIRE',
]);

export const geographies = pgTable(
  'geographies',
  {
    id: text('id').primaryKey(),
    type: geographyType('type').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    parentId: text('parent_id').references((): AnyPgColumn => geographies.id),
  },
  (t) => [
    unique('geographies_type_code_key').on(t.type, t.code),
    check('geographies_no_self_parent', sql`${t.parentId} IS NULL OR ${t.parentId} <> ${t.id}`),
    check(
      'geographies_nonempty',
      sql`length(${t.code}) > 0 AND length(${t.name}) > 0 AND length(${t.slug}) > 0`,
    ),
    index('geographies_parent_idx').on(t.parentId),
  ],
);

export const occupations = pgTable(
  'occupations',
  {
    id: text('id').primaryKey(),
    socCode: text('soc_code').notNull().unique(),
    socVersion: text('soc_version').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
  },
  (t) => [check('occupations_soc_format', sql`${t.socCode} ~ '^[0-9]{2}-[0-9]{4}$'`)],
);

export const datasetVersions = pgTable(
  'dataset_versions',
  {
    id: text('id').primaryKey(),
    datasetKey: text('dataset_key').notNull(),
    sourceName: text('source_name').notNull(),
    sourceUrl: text('source_url').notNull(),
    year: integer('year').notNull(),
    surveyYear: integer('survey_year').notNull(),
    universe: text('universe').notNull(),
    populationLabel: text('population_label').notNull(),
    retrievedAt: time('retrieved_at').notNull(),
    transformationVersion: text('transformation_version').notNull(),
    refreshCadence: text('refresh_cadence').notNull(),
    validationStatus: validationStatus('validation_status').notNull().default('pending'),
    checksum: text('checksum').notNull(),
    rowCount: integer('row_count').notNull(),
    generatedAt: time('generated_at').notNull().defaultNow(),
    publishedAt: time('published_at'),
  },
  (t) => [
    unique('dataset_versions_content_key').on(
      t.datasetKey,
      t.year,
      t.transformationVersion,
      t.checksum,
    ),
    unique('dataset_versions_id_dataset_key').on(t.id, t.datasetKey),
    check(
      'dataset_versions_year_range',
      sql`${t.year} BETWEEN 1900 AND 2100 AND ${t.surveyYear} BETWEEN 1900 AND 2100`,
    ),
    check('dataset_versions_checksum_format', sql`${t.checksum} ~ '^[a-f0-9]{64}$'`),
    check('dataset_versions_row_count_positive', sql`${t.rowCount} > 0`),
    check('dataset_versions_https_source', sql`${t.sourceUrl} LIKE 'https://%'`),
  ],
);

export const datasetArtifacts = pgTable(
  'dataset_artifacts',
  {
    datasetVersionId: text('dataset_version_id')
      .notNull()
      .references(() => datasetVersions.id),
    name: text('name').notNull(),
    sourceUrl: text('source_url').notNull(),
    checksum: text('checksum').notNull(),
    bytes: count('bytes').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.datasetVersionId, t.name] }),
    check('dataset_artifacts_checksum_format', sql`${t.checksum} ~ '^[a-f0-9]{64}$'`),
    check('dataset_artifacts_byte_size', sql`${t.bytes} > 0 AND ${t.bytes} <= 9007199254740991`),
    check('dataset_artifacts_https_source', sql`${t.sourceUrl} LIKE 'https://%'`),
  ],
);

// A failed ingest never replaces this pointer. SQL guards enforce validation.
export const datasetPublications = pgTable(
  'dataset_publications',
  {
    datasetKey: text('dataset_key').primaryKey(),
    lastGoodVersionId: text('last_good_version_id').notNull(),
    publishedAt: time('published_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: 'dataset_publications_version_key_fk',
      columns: [t.lastGoodVersionId, t.datasetKey],
      foreignColumns: [datasetVersions.id, datasetVersions.datasetKey],
    }),
  ],
);

export const datasetIngestRuns = pgTable(
  'dataset_ingest_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    datasetKey: text('dataset_key').notNull(),
    status: ingestStatus('status').notNull().default('running'),
    startedAt: time('started_at').notNull().defaultNow(),
    finishedAt: time('finished_at'),
    datasetVersionId: text('dataset_version_id').references(() => datasetVersions.id),
    // Only controlled codes/counts belong here; never raw requests or secrets.
    errorCode: text('error_code'),
    validationSummary:
      jsonb('validation_summary').$type<Record<string, string | number | boolean>>(),
  },
  (t) => [
    index('dataset_ingest_runs_key_started_idx').on(t.datasetKey, t.startedAt),
    check(
      'dataset_ingest_runs_terminal_time',
      sql`(${t.status} = 'running' AND ${t.finishedAt} IS NULL) OR (${t.status} <> 'running' AND ${t.finishedAt} IS NOT NULL AND ${t.finishedAt} >= ${t.startedAt})`,
    ),
    check(
      'dataset_ingest_runs_success_version',
      sql`${t.status} <> 'succeeded' OR ${t.datasetVersionId} IS NOT NULL`,
    ),
    check(
      'dataset_ingest_runs_failed_code',
      sql`${t.status} <> 'failed' OR ${t.errorCode} IS NOT NULL`,
    ),
  ],
);

export const incomeDistributions = pgTable(
  'income_distributions',
  {
    id: text('id').primaryKey(),
    geographyId: text('geography_id')
      .notNull()
      .references(() => geographies.id),
    sourceDatasetVersion: text('source_dataset_version')
      .notNull()
      .references(() => datasetVersions.id),
    transformationVersion: text('transformation_version').notNull(),
    generatedAt: time('generated_at').notNull(),
    universe: text('universe').notNull(),
    populationLabel: text('population_label').notNull(),
    measure: text('measure').notNull(),
    currency: text('currency').notNull().default('USD'),
    total: count('total').notNull(),
    sourceReportedTotal: count('source_reported_total').notNull(),
    assumptions: jsonb('assumptions').$type<string[]>().notNull(),
  },
  (t) => [
    unique('income_distributions_entity_version_key').on(
      t.geographyId,
      t.universe,
      t.measure,
      t.sourceDatasetVersion,
    ),
    check(
      'income_distributions_total_positive',
      sql`${t.total} > 0 AND ${t.total} <= 9007199254740991`,
    ),
    check(
      'income_distributions_source_reconciliation',
      sql`${t.sourceReportedTotal} > 0 AND ${t.sourceReportedTotal} <= 9007199254740991 AND abs(${t.total} - ${t.sourceReportedTotal})::numeric / ${t.sourceReportedTotal} <= 0.005`,
    ),
    check('income_distributions_currency', sql`${t.currency} = 'USD'`),
  ],
);

export const incomeBrackets = pgTable(
  'income_brackets',
  {
    distributionId: text('distribution_id')
      .notNull()
      .references(() => incomeDistributions.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    lower: count('lower_bound'),
    upper: count('upper_bound'),
    count: count('count').notNull(),
    label: text('label').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.distributionId, t.ordinal] }),
    check('income_brackets_ordinal_nonnegative', sql`${t.ordinal} >= 0`),
    check(
      'income_brackets_count_nonnegative',
      sql`${t.count} >= 0 AND ${t.count} <= 9007199254740991`,
    ),
    check(
      'income_brackets_valid_bounds',
      sql`(${t.lower} IS NOT NULL OR ${t.upper} IS NOT NULL) AND (${t.lower} IS NULL OR ${t.upper} IS NULL OR ${t.lower} < ${t.upper})`,
    ),
  ],
);

export const derivedRecords = pgTable(
  'derived_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: text('kind').notNull(),
    entityKey: text('entity_key').notNull(),
    sourceDatasetVersion: text('source_dataset_version')
      .notNull()
      .references(() => datasetVersions.id),
    transformationVersion: text('transformation_version').notNull(),
    generatedAt: time('generated_at').notNull(),
    facts: jsonb('facts').$type<Record<string, unknown>>().notNull(),
  },
  (t) => [
    unique('derived_records_reproducible_key').on(
      t.kind,
      t.entityKey,
      t.sourceDatasetVersion,
      t.transformationVersion,
    ),
  ],
);

export const programmaticPages = pgTable(
  'programmatic_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    canonicalPath: text('canonical_path').notNull().unique(),
    entityKey: text('entity_key').notNull(),
    template: text('template').notNull(),
    state: pageState('state').notNull().default('DRAFT'),
    sourceDatasetVersion: text('source_dataset_version')
      .notNull()
      .references(() => datasetVersions.id),
    transformationVersion: text('transformation_version').notNull(),
    generatedAt: time('generated_at').notNull().defaultNow(),
    factObject: jsonb('fact_object').$type<Record<string, unknown>>().notNull(),
    qualityScore: integer('quality_score'),
    qualityThreshold: integer('quality_threshold').notNull().default(85),
    qualityCheckedAt: time('quality_checked_at'),
    approvalBatchId: uuid('approval_batch_id'),
    approvedBy: text('approved_by'),
    approvedAt: time('approved_at'),
    publishedAt: time('published_at'),
  },
  (t) => [
    unique('programmatic_pages_entity_template_key').on(t.entityKey, t.template),
    check(
      'programmatic_pages_local_path',
      sql`${t.canonicalPath} ~ '^/[^?#]*$' AND ${t.canonicalPath} NOT LIKE '//%'`,
    ),
    check(
      'programmatic_pages_score_range',
      sql`(${t.qualityScore} IS NULL OR ${t.qualityScore} BETWEEN 0 AND 100) AND ${t.qualityThreshold} BETWEEN 1 AND 100`,
    ),
    check(
      'programmatic_pages_publish_approved',
      sql`${t.state} NOT IN ('PUBLISHED', 'MONITORING', 'RETAIN', 'REFRESH') OR (${t.approvedBy} IS NOT NULL AND length(${t.approvedBy}) > 0 AND ${t.approvedAt} IS NOT NULL AND ${t.approvalBatchId} IS NOT NULL AND ${t.publishedAt} IS NOT NULL AND ${t.qualityCheckedAt} IS NOT NULL AND ${t.qualityScore} IS NOT NULL AND ${t.qualityScore} >= ${t.qualityThreshold} AND ${t.approvedAt} >= ${t.qualityCheckedAt} AND ${t.publishedAt} >= ${t.approvedAt})`,
    ),
    index('programmatic_pages_state_idx').on(t.state),
  ],
);

export const redirectRegistry = pgTable(
  'redirect_registry',
  {
    sourcePath: text('source_path').primaryKey(),
    statusCode: integer('status_code').notNull(),
    destinationPath: text('destination_path'),
    reason: text('reason').notNull(),
    evidence: text('evidence').notNull(),
    approvedBy: text('approved_by').notNull(),
    approvedAt: time('approved_at').notNull(),
  },
  (t) => [
    check(
      'redirect_registry_disposition',
      sql`(${t.statusCode} = 301 AND ${t.destinationPath} IS NOT NULL AND ${t.destinationPath} <> ${t.sourcePath}) OR (${t.statusCode} = 410 AND ${t.destinationPath} IS NULL)`,
    ),
    check(
      'redirect_registry_local_paths',
      sql`${t.sourcePath} ~ '^/[^?#]*$' AND ${t.sourcePath} NOT LIKE '//%' AND (${t.destinationPath} IS NULL OR (${t.destinationPath} ~ '^/[^?#]*$' AND ${t.destinationPath} NOT LIKE '//%'))`,
    ),
  ],
);

// Reserved schema only. No authentication, encryption service, or persistence API
// is enabled in this release. RLS denies unconfigured access in the migration.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authSubject: text('auth_subject').notNull().unique(),
  createdAt: time('created_at').notNull().defaultNow(),
}).enableRLS();

export const profiles = pgTable('profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  encryptedPayload: text('encrypted_payload').notNull(),
  encryptionKeyVersion: text('encryption_key_version').notNull(),
  updatedAt: time('updated_at').notNull().defaultNow(),
}).enableRLS();

export const savedScenarios = pgTable(
  'saved_scenarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    calculatorId: text('calculator_id').notNull(),
    // Name, inputs and historical result snapshot all belong inside ciphertext.
    encryptedPayload: text('encrypted_payload').notNull(),
    encryptionKeyVersion: text('encryption_key_version').notNull(),
    datasetVersions: jsonb('dataset_versions').$type<string[]>().notNull(),
    createdAt: time('created_at').notNull().defaultNow(),
    updatedAt: time('updated_at').notNull().defaultNow(),
  },
  (t) => [index('saved_scenarios_owner_idx').on(t.userId)],
).enableRLS();

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    occurredAt: time('occurred_at').notNull().defaultNow(),
    // No arbitrary payload: audit facts must not contain financial inputs.
  },
  (t) => [index('audit_logs_resource_idx').on(t.resourceType, t.resourceId, t.occurredAt)],
);
