# Migration plan

Build the new product in parallel with the existing WordPress site. The first release milestone is a verified individual-income calculator vertical slice; it does not authorize a premature production cutover or bulk page retirement.

| Milestone                   | Deliverable                                                                                   | Exit condition                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Public audit                | Sitemap/REST URL inventory, source manifests, provisional classifications                     | Counts and limitations documented; no legacy routes modified              |
| Private evidence            | Full backup, restore test, GSC/backlink/log exports, publisher and alternate-host inventory   | Verified restorable backup; high-value legacy URLs identified             |
| Application staging         | Next.js product, first validated ingest and deterministic calculator, trust/methodology pages | Unit/property/browser checks pass; mobile and accessibility verified      |
| Reviewed migration registry | URL-by-URL KEEP / REDIRECT / 410 decisions and equivalence evidence                           | Named owner approves decisions against backup/evidence; validation passes |
| Cutover rehearsal           | Staging redirects/410s, sitemap, canonical and rollback test                                  | Every approved route behaves as intended; no unrelated homepage redirects |
| Production cutover          | Publisher freeze, final delta backup, canonical application routing                           | Live calculator verified; known legacy routes verified; monitoring active |
| Observation                 | Search Console/analytics monitoring and issue repair                                          | Retention/refresh decisions use actual traffic and user value             |
| Legacy retirement           | Old publisher, duplicate/archive installations and unnecessary origin retired                 | Backup retention owner signs off and rollback window has completed        |

## Work already authorized and safe to continue

Implement and test the new app, reusable data/calculator interfaces, idempotent ingest jobs, public inventory tooling, migration validation and documentation. Deploy staging when appropriate deployment credentials are present. Keep optional integrations disabled with explicit unavailable states when credentials are absent.

## Remaining cutover dependencies

The public audit can run without credentials. Full WordPress backup/restoration, disabling the publisher, editing existing host/CDN configuration, inspecting actual analytics, submitting sitemaps and verifying duplicate hosts require the corresponding account access. Public metadata does not provide those capabilities. Keep production intact until the backup and evidence gates pass.

Do not infer programmatic publishing approval from this migration plan. Candidate pages require quality checks and explicit batch approval under the product specification. Editorial pages with no real author/reviewer remain drafts. Final public brand launch also needs human trademark-clearance review; no legal conclusion is made here.

## Rollback

Record the pre-cutover DNS/CDN routes, origin configuration and verified backup artifacts privately. A rollback restores previous routing to the preserved WordPress origin while disabling new write workflows that would create split-brain data. Preserve any new application user/scenario data; do not overwrite it with an old backup. Record the failed release and the cause before retrying cutover.

See [legacy migration runbook](legacy-migration.md), [audit tooling](../scripts/legacy-url-audit/README.md), and [public evidence summary](legacy/crawl-summary.json).
