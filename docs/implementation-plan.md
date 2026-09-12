# Implementation plan

## M0 — Audit and contracts

Inspect repository, capabilities and public WordPress endpoints. Inventory URLs with coverage counts. Document backup/search-data gaps. Accept package, calculator, dataset and page contracts before implementation.

## M1 — First vertical slice

1. Scaffold Next.js/npm workspaces, design tokens, CI, shared contracts and PostgreSQL migrations.
2. Fetch actual Census income data; validate, archive and publish a reproducible immutable distribution. Test failure preservation and idempotency.
3. Implement Individual Income Percentile with closed-bin interpolation and honest open-tail ranges. Unit, boundary, invalid-input, known-example and property tests.
4. Deliver homepage, calculator, data/methodology and trust routes with navigation, responsive inputs, accessible results, privacy-safe analytics and SEO metadata.
5. Run lint, typecheck, unit tests, production build, Playwright at requested mobile widths, axe and Lighthouse. Inspect screenshots and browser flow.
6. Commit and push to the supplied Git repository. Deploy and verify staging if hosting credentials exist; otherwise record the precise infrastructure blocker. No production cutover.

## M2 — Household percentile

Only begin after M1 local/browser gates pass. Reuse contracts and UI, ingest Census household distributions, test independently, document different universe. Staging verification remains required before claiming production readiness.

## M3 — Relocation and tax

BEA regional price parities and entity crosswalks; cost of living and equivalent salary with same-city invariant. State/federal verified tax rules, filing statuses, FICA caps and bracket tests. Build BLS/FRED ingest with comparable last-good guarantees. No invented city or tax numbers.

## M4 — Entities and reviewed publishing

State/city/occupation hubs, source-backed salary comparisons, page quality scoring, protected operations dashboard, GSC read-only import. Candidate batch of 200–500 only after sufficient data; preview → quality check → explicit approval → publication. Monitor usage before expansion.

## M5 — Persistence and retention

Provision PostgreSQL, authentication, encrypted profiles, ownership enforcement, scenario snapshots, export/deletion, consent and unsubscribe. Genie tool registry follows stable engines; all numbers come from tools. Scheduled reports and optional monetization follow engagement validation.

## Release gates

Every feature needs tests, documentation, error/empty/loading states, mobile/accessibility checks, analytics without private values, deployment and browser evidence. Code completion, local verification and deployed verification are separate statuses. No fabricated authors, datasets, production metrics or backup claims.
