# Cloudflare migration status

The live domain remains on the existing server. The production Worker `insightginie-site` is uploaded with no public route. `insightginie-site-stage` is a separate noindex test Worker using its own D1 database. The production database `insightginie-site-state` contains a staging copy of the original aggregates and Ginie state; these copies are not current enough for cutover.

The account's saved token can deploy Workers and use D1, but DNS and Worker route reads return 403. Before switching, obtain a token with the existing account permissions and zone DNS and Workers Routes write permissions. Back up the actual DNS and Worker route configuration before changing either.

Before connecting the domain:

1. Verify the production Worker against an isolated test route and confirm the Datadog provider, analytics, admin, search, ads, calculators, indexing, security headers, and origin protections.
2. Freeze the old Datadog provider and wait for in-flight calls to finish; copy its latest validated budget and cache into the production D1 database. Preserve the shared budget across the switch and rollback.
3. Synchronize analytics and operation aggregates without overwriting new Cloudflare counts. Account for requests still reaching the old server while routes propagate.
4. Switch traffic with a reversible route, then verify the actual domain and provider. Keep the original server and its rollback state available.
5. Enable the Cloudflare metrics exporter with its server-side secret, after disabling the old metrics timer to avoid duplicate exports. Verify the cleanup cron and Datadog delivery.

`prepare.sh` builds an isolated Worker from the current Git commit and fails if `worker.patch` no longer applies. The patch and staging build need review and the complete release tests before promotion. Production secrets are supplied at deployment, never stored in the repository.
