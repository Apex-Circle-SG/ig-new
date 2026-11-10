# TiDB runtime migration — 10 November 2026

The production website, opportunities API and operational metrics Worker now use TiDB Cloud through its HTTPS serverless driver. Their deployed settings contain no D1 bindings. The staging website and disabled staging metrics Worker have also been moved to TiDB. Redis supplies public-data caching and atomic request limits. The original three D1 databases remain intact as recovery sources; they are no longer the production system of record.

Machine-readable receipt: [verification/tidb-runtime-migration.json](verification/tidb-runtime-migration.json).

## Data retained

A write guard temporarily rejected new website API requests with HTTP 503 and Retry-After. Catalogue imports/admin writes and metrics were paused, and the Ginie writer lease was checked before taking the final snapshots. The guard was removed after deployment and live verification; production schedules were restored. The previously disabled metrics staging job remains unscheduled.

All **9,524 rows in 25 application tables** matched complete row checksums after import:

| Source | TiDB table prefix | Tables | Rows |
| --- | --- | ---: | ---: |
| Production site state | `site_` | 9 | 835 |
| Staging site state | `stage_` | 5 | 6 |
| Catalogue and automation | `opportunities_` | 11 | 8,683 |

This includes the Ginie spending/cache ledger and lease state, aggregate counts, migration snapshots, all 773 stored tool records, 17 stored article records, both source-text records, 5,365 opportunities, 41 sources, 84 ideas, 21 platforms, 24 earning methods, cursors, 3,098 ingestion receipts, and 35 morning/evening posting records. Bundled knowledge and newer tools remain discoverable alongside stored records. The stored article table is an older subset, not the complete published library; the curated catalogue continues to ship with the application.

D1's native exporter refuses the catalogue's FTS5 virtual tables. Every underlying application row, table definition, index definition and trigger definition was therefore captured in private logical snapshots. FTS5 shadow/index pages are derived data and are not copied as MySQL tables. TiDB performs bounded parameterized word-prefix regex search across the same five fields; punctuation and accent matching can differ from SQLite's tokenizer. No source text or opportunity records were discarded to implement search.

Primary keys, source/external-ID uniqueness, the source foreign key, singleton/nonnegative checks and active posting-claim uniqueness are retained. MySQL generated columns implement the former partial posting indexes. A derived fingerprint hash supports duplicate checks; the original fingerprint comparison is also required and the hash is excluded from public API records. Tool ordering preserves the original SQLite row order.

Private backups, complete row-hash receipts, prior Worker versions/settings/routes, logs and deployment secrets are under `/mnt/sdb/ig-tidb-migration/` (directory mode 0700). SQL/JSON data and secrets are not committed. Original D1 databases were not dropped or cleared. The staging website uses its separate `stage_` namespace and bundled public content (its original D1 database had no library tables). The unrelated old preview Worker has no D1 binding and was preserved. The optional PostgreSQL publication schema is independent and was not an active website database; no PostgreSQL accounts or RLS policies were converted to MySQL.

## Fewer calls

- Public catalogue cache hits use one atomic Redis script instead of two GET round trips; misses use the same versioned-generation invalidation and bounded expiry safeguards. TTL remains at most ten minutes, additionally capped by returned jobs' expiry/staleness deadlines. Admin, health, posting and automation state are not cached.
- Library directory/source-row reads use a five-minute Redis cache, a 30-second isolate cache and React request memoization. Errors fall back to SQL; bundled public content remains the existing last fallback. These caches contain public directory/article rows, never private source text or credentials.
- The three small catalogue totals share one SQL request, reducing a cold stats request from five SQL calls to three.
- Up to 25 changed import records share one multirow upsert. A single statement does not open an unnecessary transaction; mixed content/freshness writes remain transactional. Existing completeness, source-policy and failed-feed safeguards remain.
- Ask/admin request limits use one atomic Redis operation with expiring global/client counters and hashed client keys. Redis failure denies the protected request; it does not bypass abuse limits. Durable Ginie budget state remains in SQL with ownership/expiry guards.
- Metrics run every five minutes instead of every minute, preserving the existing five-minute export limit and reducing scheduled invocations by 80% for this Worker. Expired SQL buckets are still pruned.

Cache namespaces are isolated from unrelated Redis workloads. No flush command was used. Public-data cache failures fall back to SQL, so a Redis outage increases TiDB traffic. The deployment script rotates the catalogue generation after release. Consent-dependent HTML stays private and uncached; advertising choices, GPC handling and per-request CSP nonces remain intact.

## Secrets and deployment

Root `.env` holds the supplied migration login separately as `TIDB_MIGRATION_USERNAME` / `TIDB_MIGRATION_PASSWORD`. `TIDB_USERNAME` / `TIDB_PASSWORD` now identify a separately generated runtime account restricted to the application tables. DDL access was explicitly verified to be denied to this account. Workers receive only runtime connection secrets and required Redis bindings; the migration login is not uploaded. Serverless database traffic uses HTTPS with platform certificate verification, rather than an unverified MySQL socket.

The website deployment uses `scripts/cloudflare/prepare.sh`, the TiDB-aware `worker.patch`, updated build lock and `cloudflare.config.ts`. The library patch keeps the shared current deal-tool catalogue. Future pushes build against the same runtime secrets already installed in Cloudflare. This release was deployed directly through Cloudflare; it was **not pushed to GitHub**.

The catalogue is deployed with `node scripts/opportunities/deploy.mjs --worker-only`, after sourcing the private Cloudflare environment. The script reads root `.env`, selects TiDB when configured and preserves LinkedIn secrets/schedules. Default seed deployment verifies the existing TiDB schema before upserting seed rows; it does not attempt SQLite DDL on MySQL. The private visual/evening verification scripts now query TiDB as well. `scripts/cloudflare/sync-state.mjs` is a historical EC2-to-D1 cutover tool: do not run it against the current production architecture.

To validate a private frozen-source snapshot, use `node scripts/storage/migrate.mjs /private/snapshot.json --verify`. Initial import refuses populated destinations. `--sync` explicitly reconciles only the reviewed namespace tables, transactionally per table, including keys absent from the frozen snapshot; never run it against a writable production destination. `scripts/storage/verify.mjs` performs live read checks and rolls back its SQL fixtures; it sends no social posts or paid AI requests.

## Verification and limits

- Row counts and full normalized row checksums passed for all 25 application tables at the frozen snapshot.
- 43 Node tests and two focused state/metrics tests passed. Tests cover parameter separation, SQL conversion, numeric decoding through live integration, grouped imports, transactional failure rollback, cache invalidation, bounded expiry and failure handling.
- Live TiDB assertions passed for ownership/lease rejection, counter increments and saturation, scheduler claims and cross-day posting uniqueness. Fixtures rolled back. A ten-request Redis race allowed exactly three requests with a maximum of three.
- Repository and prepared-Worker TypeScript checks, focused lint, production Cloudflare build and deployment preflight passed.
- Local mobile/desktop checks passed on four representative public routes. The same eight live route/viewport checks returned 200, one H1 and no page JavaScript errors; CSP and private HTML headers remained present. Live advertising can append an off-screen helper iframe that expands desktop document width; this ad presentation behaviour was not changed by the storage migration.
- Live catalogue requests showed a fresh Redis MISS followed by HIT. Live API health/token checks passed. One consented QA library page-view reached TiDB; no-consent/GPC requests did not increment it, and the old D1 aggregate remained unchanged. No paid AI request or LinkedIn upload/post was used for verification.
- The first scheduled TiDB import after cutover completed at 15:30 UTC with 25 records. The bounded Graphify architecture map was refreshed (323 files, 1,292 nodes, 2,804 edges); unresolved raw references mean it remains a partial structural map.
- Initial post-cutover telemetry recorded 59 successful production invocations and zero errors (41 website, 16 catalogue, two metrics). This small, delayed analytics sample is not a daily performance result.

Before migration, 9 November D1 usage was 3,005,611 row reads across the two production databases. The site also had 684 `exceededResources` errors, which the telemetry does not distinguish further into CPU versus memory here. Moving SQL removes production D1 usage, but it cannot guarantee resolution of independent Worker execution limits. Account subscription details were unavailable to the existing token; no paid-plan or resource-limit changes were made. Compare a complete subsequent UTC day before claiming a reduction in error rate or total requests. The migration does not remove TiDB, Redis or Worker quotas.

After live writes have resumed, **do not simply roll back to the frozen D1 copies**. Reapply a write guard, drain leases, export current TiDB state and reconcile the spending ledger, counts, cursor and posting receipts before changing backends. Old Worker version IDs and routing settings are saved privately. Keep the D1 sources until the owner is satisfied with the migration and backup policy.

Implementation follows the [TiDB serverless driver documentation](https://docs.pingcap.com/tidbcloud/serverless-driver-config/), [TiDB Cloudflare integration](https://docs.pingcap.com/tidbcloud/integrate-tidbcloud-with-cloudflare/) and [Upstash REST API](https://upstash.com/docs/redis/features/restapi). Distinguish [D1 row quotas](https://developers.cloudflare.com/d1/platform/pricing/) from [Worker execution limits](https://developers.cloudflare.com/workers/platform/limits/).
