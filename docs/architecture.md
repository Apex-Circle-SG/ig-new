# InsightGinie architecture

Status: accepted for the first vertical slice, 2026-09-12. This is a staged rebuild, not a production cutover.

## Boundaries

An npm workspaces monorepo: apps/web (Next.js App Router, React, TypeScript), apps/ingest (Node/TypeScript batch jobs), apps/worker (future scheduled jobs). Shared packages: schema (Zod contracts), datasets (validated public distributions and provenance), calculators (pure deterministic engines), database (Drizzle PostgreSQL schema and migrations), ui/charts (accessible presentation), seo, analytics, ads. Genie, email and account persistence follow verified calculators.

The web application serves an immutable validated public-data snapshot without requiring a database or API credential at request time. PostgreSQL is the durable normalized system of record once provisioned. This is an intentional deployable bootstrap, not a substitute for database persistence. No financial profile is stored in this slice. Values stay in browser memory, are absent from analytics and URLs, and disappear on navigation/reload. Share is explicit and only copies a public tool URL initially.

## Contracts

DatasetVersion includes id, sourceName, sourceUrl, year, retrievedAt, transformationVersion, refreshCadence, validationStatus, checksum. IncomeDistribution includes geography, universe, measure, total, ordered disjoint brackets and DatasetVersion. A bracket has lower: number|null, upper: number|null, count: integer; null marks an open tail. CalculatorDefinition exposes id, name, description, inputSchema, outputSchema, calculate(input, context), methodology, relatedCalculators. Calculate is deterministic; context injects distribution and calculatedAt. Output includes status, result, comparisons, chartData, explanation, sourceReferences, datasetVersion, calculatedAt. Missing or invalid distributions return data-unavailable, never synthetic numbers.

## Data correctness

Choose an authoritative Census table with a precisely labeled universe and income definition. Do not label earnings as total personal income. Closed brackets use uniform within-bin interpolation and disclose that assumption. Open first/last bins return a percentile range rather than inventing tail precision. Counts are survey estimates, not exact people. No state/age/occupation comparison appears without matching data. Reference-year dollars are explicit; current dollars are not silently inflation-adjusted.

Ingest: download with timeout → archive public response and checksum → validate schema/geography/year/counts and source metadata → normalize → check totals and monotonic bins → write immutable version → atomically advance last-good manifest. Failed ingests never alter last-good. Repeated content checksums are idempotent. External integrations are optional, with documented unavailable states.

## Database model

geographies (typed FIPS/GEOID and parent), occupations (SOC), dataset_versions, dataset_ingest_runs, income_distributions, income_brackets, derived_records, programmatic_pages, redirect_registry, users, profiles, saved_scenarios, calculator_runs, audit_logs. Source and transformation versions and generated timestamps travel with derived records. Private account tables are not enabled before authentication, encryption, row ownership tests and deletion/export are implemented.

## Page templates and quality gates

Homepage is a command-to-tool entry point. Calculator template: breadcrumb, H1, explanatory sentence, input/result, chart with text/table equivalent, what-if controls, provenance, assumptions, FAQ and related valid routes. Dataset/methodology pages disclose coverage and limitations. Trust pages do not invent author identities or external review. Salary pages require unique entity keys, valid source versions, complete critical fields, functional tool, comparisons, metadata, canonical/schema/internal links and explicit batch approval. No programmatic pages ship in the first slice.

## Delivery and security

CI: clean install, lint, typecheck, mathematical/ingest tests, production build, Playwright mobile/desktop/accessibility/metadata, dependency audit. Lighthouse runs against a production server; lab metrics are not field CWV proof. CSP and security headers; no remote scripts, ads or LLM initially. Preview deployments are noindex and production indexing requires an explicit environment switch. Canonical host is https://insightginie.com. A public read-only health endpoint reports dataset availability without secrets.

Staging requires hosting credentials or an existing Git integration. Production cutover additionally requires a complete WordPress files/database backup, traffic/backlink review, validated URL dispositions and human trademark/legal review. Never mass-redirect unrelated content.
