# Cloudflare deployment

The production Worker `insightginie-site` serves `insightginie.com/*`. The existing proxied tunnel DNS record remains in place as a rollback route; the Worker handles requests before they reach the tunnel. Production storage is TiDB with `site_` table prefixes. The former D1 databases are retained as frozen recovery sources; their staging data was also copied to the `stage_` namespace. See [the TiDB migration report](../../docs/tidb-runtime-migration.md).

Ginie’s credentials and security keys are Worker secrets. Its shared spending ledger and aggregate counts live in TiDB. Public catalogue/library reads and request limits use Redis; spending and posting ledgers remain SQL-backed. `insightginie-metrics` runs on Cloudflare and exports aggregate operational counts to Datadog. The former server web service, tunnel, metrics timer and analytics-prune timer are stopped and disabled.

`scripts/cloudflare/prepare.sh` builds an isolated Worker from the current Git commit. Set `IG_CLOUDFLARE_TARGET=production` for production. The script checks that `worker.patch` still applies before building, so incompatible source updates fail rather than overwrite changes. Deployment requires the appropriate Cloudflare account permissions; secrets remain in Worker settings.

The pre-cutover runtime and routing backups are in `artifacts/cloudflare-preview/`. A rollback must preserve the current TiDB Ginie budget and aggregate counts before restoring the old provider; otherwise usage can be double-counted or lost. The old server's Datadog provider was intentionally paused before cutover.

Cloudflare Workers Builds is connected to `Apex-Circle-SG/ig-new` and watches all changes on `main`. Its production build runs `prepare.sh` with `IG_CLOUDFLARE_TARGET=production`, then deploys the resulting prebuilt Worker.

GitHub Actions verification runs only when started manually. Run checks appropriate to each change locally before pushing; Cloudflare Workers Builds deploys pushes to `main` independently.

Stored library records live in TiDB `site_library_knowledge` as portable JSON text, with a bundled curated catalogue. Private extracted source text is retained in `site_library_sources` and is not served by the site. Original documents/images remain separate files. Directory reads are cached; source text, credentials and spending state are not put in the public-data cache.

The website, catalogue and metrics production Workers, and the staging website/metrics Workers, no longer bind D1. Runtime secrets are separate from the local migration login. The metrics schedule is every five minutes; the old disabled staging metrics schedule is stopped. A rollback after new TiDB writes requires a write guard and reconciliation of current ledgers before restoring a frozen D1 snapshot. The historical `sync-state.mjs` tool targets the former EC2-to-D1 cutover and must not be used for current production synchronization.
