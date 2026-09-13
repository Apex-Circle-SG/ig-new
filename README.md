# InsightGinie

Understand where you stand. See what changes next.

A US consumer decision platform built around public data and deterministic calculators.

[Try the income calculator](https://insightginie.com/calc/individual-income-percentile/) · [Explore the US income distribution](https://insightginie.com/data/us-income-distribution/) · [Sources and methodology](https://insightginie.com/methodology/individual-income/)

The application includes seven private calculators, a source-grounded assistant at `/ask/`, finance tools at `/tools/`, editorial previews at `/insights/`, original data at `/research/`, trust policies and a protected operations dashboard. The six new engines cover AI workflow ROI, cash runway, break-even, business loans, drawdown recovery and portfolio concentration. Household, location and career products remain on the roadmap.

## Run locally

Requires Node 22+ and npm. Public tools and approved-source Ask require no inference key. For local Ask requests set `APP_SITE_ORIGIN=http://localhost:3000` in `apps/web/.env.local` (match your actual browser origin). Optional integrations fail closed when unconfigured.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The homepage and `/calc/individual-income-percentile/` use a real, versioned US Census CPS PINC-11 distribution (2024 income, 2025 survey). Private calculator inputs are never transmitted. Questions deliberately submitted to Ask are processed transiently on the server without raw logging or external model calls. For $75,000 the income estimate is approximately 74.7th percentile among US people age 15 and over, including nonworkers.

## Verify

```sh
npm run lint
npm run typecheck
npm test
SITE_INDEXABLE=true NEXT_PUBLIC_ADS_ENABLED=true npm run build
npx playwright install chromium
npm run test:e2e
node --test scripts/seo/discovery.test.mjs
node --test scripts/observability/observability.test.mjs scripts/operations/prune-analytics.test.mjs
npx tsx scripts/content-sync/validate.ts
python3 -m unittest discover -s scripts/legacy-url-audit -p 'test_*.py'
python3 scripts/legacy-url-audit/validate.py docs/legacy/url-inventory.csv.gz
npm audit
```

Database checks and Lighthouse commands are documented in the linked runbooks. Preview indexing is disabled by default, including Vercel preview deployments. Do not set `SITE_INDEXABLE=true` until release requirements are met.

## Data pipeline

```sh
npm run ingest:census
```

Public Census spreadsheets are archived with SHA-256 checksums. Validation rejects changed schemas, units, invalid counts, broken bands and inconsistent totals. Successful versions are immutable; only validated ingests advance last-good. An unchanged source is idempotent. The web application serves the checked-in validated snapshot, so request handling never depends on a live Census call.

## Layout

- `apps/web`: Next.js App Router, homepage, calculator, dataset/methodology and trust pages.
- `apps/ingest`: reproducible Census download, validation, transformation and publication.
- `packages/schema`, `datasets`, `calculators`: shared contracts, provenance and pure engines.
- `packages/database`: PostgreSQL/Drizzle schema, migration, publication and integration verification.
- `packages/ui`, `charts`, `seo`, `analytics`, `ads`, `config`: reusable presentation and boundaries.
- `scripts/legacy-url-audit`: read-only legacy inventory and migration validation.
- `docs`: decisions, operations, evidence and staged roadmap.

## Delivery boundaries

The production application is hosted by the `insightginie-web` systemd service on `127.0.0.1:3000` through Cloudflare. See [service management](docs/deployment.md#background-service-on-this-host). AdSense covers reviewed public pages with regional privacy handling; Ask and private calculator frames have no ads. Analytics needs explicit consent. See [advertising](docs/advertising.md), [SEO launch](docs/seo-launch.md), and [offsite discovery](scripts/seo/README.md). No remote database or Vercel deployment is configured. The remote WordPress installation remains intact; two preserved article previews are noindex with original blog canonicals. The complete backup, restore test, redirect authority and per-URL review are prerequisites for cutover. Public snapshots are not a complete WordPress backup. No programmatic salary pages, account storage, email subscriptions or billing are enabled.

Never commit `.env`, credentials, private profile data or raw operational secrets. See [MANUAL_REQUIRED.md](MANUAL_REQUIRED.md) for exact external dependencies and [the release instructions](docs/consolidation-release.md) for verification, deployment and rollback. Datadog Bits is a separate disabled private-operations adapter; it is not the public assistant's inference provider.

## Documentation

[Verification report](docs/verification-report.md) · [Audit](docs/current-state-audit.md) · [Architecture](docs/architecture.md) · [Plan](docs/implementation-plan.md) · [Local development](docs/local-development.md) · [Deployment](docs/deployment.md) · [Database](docs/database.md) · [Datasets](docs/datasets.md) · [Calculator framework](docs/calculator-framework.md) · [Migration](docs/legacy-migration.md) · [Operations](docs/operations-runbook.md)
