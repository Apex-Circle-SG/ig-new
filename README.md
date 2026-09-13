# InsightGinie

Understand where you stand. See what changes next.

A US consumer decision platform built around public data and deterministic calculators.

[Try the income calculator](https://insightginie.com/calc/individual-income-percentile/) · [Explore the US income distribution](https://insightginie.com/data/us-income-distribution/) · [Sources and methodology](https://insightginie.com/methodology/individual-income/)

The current release includes a private browser calculator, a downloadable Census-based income table, an embeddable chart, and transparent source documentation. Household, location and career products remain on the roadmap.

## Run locally

Requires Node 22+ and npm. No external credentials are needed for the income calculator.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The homepage and `/calc/individual-income-percentile/` use a real, versioned US Census CPS PINC-11 distribution (2024 income, 2025 survey). No user income is stored or transmitted. For $75,000 the estimate is approximately 74.7th percentile among US people age 15 and over, including nonworkers.

## Verify

```sh
npm run lint
npm run typecheck
npm test
SITE_INDEXABLE=true NEXT_PUBLIC_ADS_ENABLED=true npm run build
npx playwright install chromium
npm run test:e2e
node --test scripts/seo/discovery.test.mjs
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

The production application is hosted by the `insightginie-web` systemd service on `127.0.0.1:3000` through Cloudflare. See [service management](docs/deployment.md#background-service-on-this-host). AdSense covers reviewed public pages with regional privacy handling; personal calculations run inside an isolated browser frame. See [advertising](docs/advertising.md), [SEO launch](docs/seo-launch.md), and [offsite discovery](scripts/seo/README.md). No remote database or Vercel deployment is configured. The local legacy publishing automation was removed at the operator's request; the remote WordPress installation has not been deleted. Public response snapshots are not a complete WordPress backup. No programmatic salary pages, account storage, chatbot, email or billing are enabled.

Never commit `.env`, credentials, private profile data or raw operational secrets. Legacy URL migration remains subject to a complete WordPress database/files backup and reviewed URL dispositions with traffic/backlink evidence. Private support, external monitoring and human policy/trademark review remain operator tasks; the current public release does not claim those are complete.

## Documentation

[Verification report](docs/verification-report.md) · [Audit](docs/current-state-audit.md) · [Architecture](docs/architecture.md) · [Plan](docs/implementation-plan.md) · [Local development](docs/local-development.md) · [Deployment](docs/deployment.md) · [Database](docs/database.md) · [Datasets](docs/datasets.md) · [Calculator framework](docs/calculator-framework.md) · [Migration](docs/legacy-migration.md) · [Operations](docs/operations-runbook.md)
