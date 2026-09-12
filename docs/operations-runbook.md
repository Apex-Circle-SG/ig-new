# Operations runbook

## Status and ownership

This repository is the rebuild, not the canonical production cutover. The
maintainer owns release approval, legacy migration and data review. Local hosting
uses the `insightginie-web` systemd service on port 3000; see the
[service commands](deployment.md#background-service-on-this-host). The public
tunnel, remote PostgreSQL, alert routing, Search Console and email providers still
need provisioning. An environment variable or schema table does not prove an integration
is active. Consult the current validation report for checks actually executed.

## Routine release

Use the [implementation plan](implementation-plan.md) and
[deployment instructions](deployment.md). CI must pass lint, types, calculator
tests, migrations, build, browser checks and dependency scanning. Store the commit,
test report, staging URL and deployment check result. Publish only from a reviewed
validated data snapshot. No unattended programmatic batches are enabled.

## Dataset refresh

1. Run the documented source ingest against the source's published release.
2. Inspect retrieval metadata, source year, checksum, universe, row counts,
   total reconciliation and validation status.
3. Inspect changed source/bin values; unexpected scale, schema or geography
   changes require investigation.
4. Publish only after validation. Snapshot publication must atomically replace
   the last-good manifest. Database publication uses a single transaction and
   advances the validated-version pointer last.
5. Smoke-test the calculator and visible provenance. Retain the previous version.

On failure, retain the last-good snapshot, record a controlled error code and
investigate the archived public response. Never substitute made-up values or
retag an old snapshot as current. If no valid snapshot exists, show “Data unavailable.”
Alerts are a deployment prerequisite; failure records alone do not notify an operator.

## Incorrect published data

Stop further publication. Identify affected versions and pages from provenance.
Select the prior verified snapshot and restore its manifest in an atomic change;
for PostgreSQL, repoint to a prior immutable, validated version in a transaction.
Re-run representative calculator cases and verify source labels. Record the
incident and correction. Preserve historical saved results when accounts are
eventually enabled; flag them for explicit recalculation instead of rewriting them.

## Browser or calculator regression

Reproduce using synthetic inputs only. Check the calculation's dataset/version,
boundary behavior and input parsing before changing the math. Run the targeted
tests and complete release gates. Roll back the web deployment if needed while
preserving public data history. Do not place a failing calculator behind an ad or
account wall; provide a clear unavailable state.

## Monitoring to configure on hosting

Track application errors, request latency, health endpoint availability, failed
calculator executions, ingest failures and public source freshness. Add database,
LLM and email telemetry when those services exist. Route critical failures to a
named operator and test delivery. Exclude financial values, user inputs, secrets
and raw third-party errors from telemetry. Add real-user Web Vitals measurement
only through the privacy-reviewed analytics abstraction.

## Page and legacy operations

Generated pages follow draft → quality check → explicit approval → publication.
Require data completeness, valid sources, interactive utility, unique canonical,
internal links and a passing threshold. The schema enforces minimum publication
metadata but no authenticated admin dashboard is active yet.

Legacy migration is blocked until a complete backup and URL classification exist.
Use a 301 only for a reviewed equivalent replacement, 410 when there is none, and
preserve valuable pages when evidence warrants it. Keep evidence in the registry.
Do not mass-redirect unrelated pages or treat an incomplete crawl as complete.

## Backup and recovery

Before enabling remote persistence, configure encrypted database backups and
retention, object-storage versioning and a restore exercise in an isolated project.
Record restore time and verified data counts. Keep access limited to operators.
The local source inventory is not a WordPress database/files backup. Restore tests
and production retention guarantees remain infrastructure work.
