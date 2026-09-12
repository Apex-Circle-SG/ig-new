# InsightGinie

Understand where you stand. See what changes next.

A US consumer decision-intelligence platform built around public data and deterministic calculators. This repository delivers the **first vertical slice**, not the full product or a WordPress cutover.

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
npm run build
npx playwright install chromium
npm run test:e2e
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

Only GitHub credentials were supplied. There is no remote database or hosting deployment configured. Local production-build/browser verification is distinct from staging verification. The legacy WordPress installation is unchanged. Public response snapshots are not a complete WordPress backup. No programmatic salary pages, account storage, chatbot, email, ad provider or billing are enabled.

Never commit `.env`, credentials, private profile data or raw operational secrets. The production cutover requires a complete WordPress database/files backup, reviewed URL dispositions, traffic/backlink evidence, configured support/retention terms and human legal/trademark clearance.

## Documentation

[Verification report](docs/verification-report.md) · [Audit](docs/current-state-audit.md) · [Architecture](docs/architecture.md) · [Plan](docs/implementation-plan.md) · [Local development](docs/local-development.md) · [Deployment](docs/deployment.md) · [Database](docs/database.md) · [Datasets](docs/datasets.md) · [Calculator framework](docs/calculator-framework.md) · [Migration](docs/legacy-migration.md) · [Operations](docs/operations-runbook.md)
