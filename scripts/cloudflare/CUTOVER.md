# Cloudflare deployment

The production Worker `insightginie-site` serves `insightginie.com/*`. The existing proxied tunnel DNS record remains in place as a rollback route; the Worker handles requests before they reach the tunnel. The production D1 database is `insightginie-site-state`. `insightginie-site-stage` and its separate database are for testing.

Ginie’s credentials and security keys are Worker secrets. Its shared spending ledger and aggregate counts live in D1. `insightginie-metrics` runs on Cloudflare and exports aggregate operational counts to Datadog. The former server web service, tunnel, metrics timer and analytics-prune timer are stopped and disabled.

`scripts/cloudflare/prepare.sh` builds an isolated Worker from the current Git commit. Set `IG_CLOUDFLARE_TARGET=production` for production. The script checks that `worker.patch` still applies before building, so incompatible source updates fail rather than overwrite changes. Deployment requires the appropriate Cloudflare account permissions; secrets remain in Worker settings.

The pre-cutover runtime and routing backups are in `artifacts/cloudflare-preview/`. A rollback must preserve the current D1 Ginie budget and aggregate counts before restoring the old provider; otherwise usage can be double-counted or lost. The old server's Datadog provider was intentionally paused before cutover.

Cloudflare Workers Builds is connected to `Apex-Circle-SG/ig-new` and watches all changes on `main`. Its production build runs `prepare.sh` with `IG_CLOUDFLARE_TARGET=production`, then deploys the resulting prebuilt Worker.

GitHub Actions verification runs only when started manually. Run checks appropriate to each change locally before pushing; Cloudflare Workers Builds deploys pushes to `main` independently.
