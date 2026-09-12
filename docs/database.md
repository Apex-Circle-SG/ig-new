# Database

The schema is PostgreSQL with Drizzle. `packages/database/src/schema.ts` defines
tables and constraints; `packages/database/migrations/` contains versioned SQL.
The application currently reads a validated public-data snapshot. Database
provisioning is optional for that slice and is not silently replaced by an
in-memory account store.

## Tables and ownership

| Area            | Tables                                                   | Purpose                                                                               |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Entities        | geographies, occupations                                 | Typed geographic identifiers, parent links and SOC codes                              |
| Sources         | dataset_versions, dataset_artifacts, dataset_ingest_runs | Provenance, source files, checksum, transformation version, validation and run status |
| Publication     | dataset_publications                                     | Last validated version per dataset key                                                |
| Distributions   | income_distributions, income_brackets                    | Universe, measure, reported/normalized totals and ordered disjoint bins               |
| Derivations     | derived_records                                          | Fact objects tied to source and transformation versions                               |
| Publishing      | programmatic_pages                                       | Unique entity/canonical, quality threshold and explicit approval metadata             |
| Migration       | redirect_registry                                        | Reviewed equivalent redirects or 410 dispositions, with evidence                      |
| Future accounts | users, profiles, saved_scenarios                         | Owner foreign keys, ciphertext placeholders and cascade deletion                      |
| Operations      | audit_logs                                               | Controlled actor/action/resource facts without private financial payloads             |

No account endpoints exist. Private tables enable and force row-level security
with no access policies. A normal application role is denied by default, including
the table owner. PostgreSQL superusers and `BYPASSRLS` roles bypass this mechanism;
never use either for a future account service. Authentication, encryption,
ownership policies, key rotation and export/deletion tests must precede activation.

## Migrations

1. Provision an empty database with a dedicated migration role. Keep a backup
   before changing any populated database.
2. Supply `DATABASE_URL` securely. The CLI reads root `.env`; the web app does not
   need this value for anonymous calculator use. Hosted connections must verify
   TLS using the provider's documented configuration.
3. Run `npm run db:migrate` from the repository root. Drizzle tracks completed
   migrations and safely skips them on replay.
4. Change the TypeScript schema, run `npm run db:generate`, and review the SQL and
   snapshot. Handwritten trigger/RLS changes belong in a separate custom migration.
5. Verify on a disposable database before staging. Prefer forward fixes; do not
   drop tables or roll back a data migration casually.

The migration role may create schema objects; future runtime roles must have only
the grants their operation needs. Keep direct migration credentials separate from
pooled application credentials. Secrets are never logged by the migration wrapper.

## Publication contract

An ingest must validate source rows before beginning publication. Insert the
version, distribution and bracket records inside one database transaction, then
advance `dataset_publications` last. The publication trigger refuses unvalidated
versions, mismatched normalized row counts, empty distributions, mismatched totals, gaps, overlaps and unordered
brackets. The normalized total equals the sum of published bracket counts; the
source-reported survey total may differ because published counts are rounded.

`publishIncomeDistribution(db, datasetKey, candidate)` implements this transaction
for the shared income contract. It records success with the publication transaction
and records controlled failure codes separately after rollback. Replays of the same
source are idempotent; conflicting identifiers and automatic rollback to older
source years are rejected. The file-based Census ingest does not call this optional
adapter yet. Wiring it requires a provisioned database and release verification.

Once first published, source metadata and its income distribution are immutable.
Correct errors by creating a new version. A failed transaction keeps the previous
pointer and source rows intact. A repeated dataset/version/checksum must resolve
to the existing rows, not create duplicates. Retain the public raw response and
checksum alongside normalized data; the SQL schema does not replace source archives.

Programmatic pages cannot enter a published state without a passing score,
quality-check timestamp, batch identifier, identified approver and approval/publication
timestamps and a validated, published source version. Changing approved facts
requires a reset to draft for a new quality check and approval. These constraints
supplement a future authenticated approval workflow;
they do not implement that workflow or authorize mass publication.

## Verification

`npx tsx packages/database/src/verify.ts` runs integration checks against a
migrated database named `insightginie_verify` or `insightginie_ci`. Publication tests
commit uniquely identified test records to verify transaction behavior; synthetic
constraint fixtures and temporary roles roll back. Never run this script against
a shared or production database. CI provides a disposable
PostgreSQL 18 service, applies migrations twice, and checks publication, failure
preservation, immutability, page approval, redirects and private-table access.
The two migrations and 33 integration assertions passed locally on isolated
PostgreSQL 18.6 on 2026-09-12, including actual access denial under an unprivileged role.
Schema generation reported no drift. Migration replay and the assertions were
rechecked after the esbuild dependency override; package lint passed and the
dependency audit reported zero vulnerabilities.
No external staging database has been provisioned or verified in this session.

Schema syntax follows the [Drizzle PostgreSQL documentation](https://orm.drizzle.team/docs/column-types/pg).
