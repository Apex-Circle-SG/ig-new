# Opportunities catalog

TiDB Cloud is the catalog's system of record; Redis caches bounded public reads. See [migration and recovery](../../docs/tidb-runtime-migration.md). This backend is independent of
the Next.js frontend and the existing PostgreSQL calculator publication package.
The current website connects through a versioned read API; management credentials
never enter its process or browser bundle.

## Run and deploy

The protected credentials file is outside Git. Do not print it or run with shell
tracing enabled.

```sh
set +x
source /root/.config/insightginie/cloudflare.env
node scripts/opportunities/deploy.mjs
node scripts/opportunities/verify.mjs
node --test apps/opportunities/catalog.test.mjs
```

`deploy.mjs --ingest` also refreshes all bounded initial batches. The deployment
script verifies the migrated TiDB schema, upserts seed content and deploys
only the named opportunities Worker. Future schema changes need a new versioned
migration and a deployment-script change; do not rewrite migration 0001.
An existing unrelated Worker is not replaced.

The ingestion bearer secret is generated into
`~/.config/insightginie/ingest-secret`, mode 0600, and uploaded as a Worker secret
binding. Rotate it by replacing that private file and redeploying. The Cloudflare
management token is only needed for deployment, not normal scheduled operation.

## Runtime

`cloudflare.json` contains public resource identifiers and the API URL. Workers
connect to TiDB over HTTPS with server-only secrets. HTTP read routes return bounded records; SQL values and word-prefix search terms are bound parameters. The admin importer rejects
unauthenticated writes and only accepts a fixed source allowlist.

Imports run every ten minutes, rotating the eleven enabled source adapters. Each provider is visited within two hours, with a rotating batch of at most 25 records. Changed rows share a multirow SQL upsert. The initial refresh populates every
eligible batch in each sampled feed. This is not a complete copy of any provider.
Feed failures are recorded and do not mark all records closed. Records not seen
within seven days leave active search, and stale records are removed after 60
days. Import history is retained for 30 days.

Adapters include Jobicy, Arbeitnow, Remote OK, direct Greenhouse/Ashby boards and the reviewed bounty feed. These are public job
feeds, with source attribution and original provider links. Arbeitnow imports
only explicitly remote records. All adapters reject malformed dates, disallowed
hosts and records older than 45 days. No personalized dashboards are scraped.

The source register includes permission-dependent sources; status must be
changed deliberately after review and a real adapter must be implemented.
Platform profiles are not imported paid tasks. The 84 seed ideas are original,
unvalidated brainstorming, not claims of funded work or proven demand. They do
not regenerate on a schedule or consume an AI API.

## Website and operations

- `/opportunities/`: server-rendered search, location/source/pay filters and pagination.
- `/opportunities/[id]/`: source details and browser-local save action; noindex initially.
- `/opportunities/saved/`: local-only shortlist; no account or application data.
- `/ideas/`, `/ideas/[id]/`: original business experiments and validation steps.
- `/platforms/`: earning-platform directory with eligibility/payment distinctions.
- `/opportunities/sources/`: researched coverage and live refresh state.

Set the frontend server's `OPPORTUNITIES_API_URL` to change backends; its default
is the deployed Worker. API errors show an unavailable state rather than fake
listings. Optional accounts, email alerts, marketplace payments, R2 archiving
and Queues are not enabled. The existing analytics consent and AdSense inventory
remain; new opportunity surfaces are excluded from advertising pending review.
The review date and source permissions must be revisited as terms evolve.

Keep private logical TiDB backups and the preserved D1 snapshots. The old D1 copies are frozen recovery sources, not current replicas. A rollback must reconcile current spending, counters and posting receipts before resuming writers; see the migration report. Never copy raw credential/source-state tables into public reports. Do not retain third-party data beyond each provider's allowed retention.

## Google Analytics

The owner-supplied GA4 measurement ID is `G-4HQVZL3586`. It loads only after the
updated analytics consent, and only on public, unfiltered pages. Earlier consent
to anonymous first-party counts does not opt visitors into Google Analytics.
AdSense remains configured separately with the existing publisher ID.

In GA4 Admin, review the web stream's Enhanced Measurement settings. Keep browser
history pageviews and automatic form/site-search measurement disabled: the site
sends explicit pageviews and never intentionally forwards private inputs. This
account-side setting cannot be verified through the public measurement ID.
QA tests intercept the Google script, inspect commands and do not send test
pageviews to the property. Actual property ownership and dashboard receipt
require access to GA4 Realtime/DebugView.

## Daily automation expansion (19 October 2026)

The current schedules, 11 adapters, 24 earning guides, 84 experiments, social
publication controls and updated advertising scope supersede the initial-release
counts and cadence above. See [the current operations guide](../../docs/opportunities-automation.md).
Schema 0002 adds work arrangements, persistent cursors, guide link status,
encrypted runtime credential state and a daily publication ledger.

Refresh the architecture map using `scripts/graphify/refresh.py`; see its README.
