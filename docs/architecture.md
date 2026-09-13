# InsightGinie architecture

Status: extended for consolidation on 2026-09-13. The original source-backed income slice remains; the WordPress host cutover is separate and blocked by external evidence.

## Current consolidation architecture

`/tools/` renders six business/risk engines from `packages/calculators/src/business.ts` inside opaque browser sandboxes. `/insights/` reads sanitized immutable WordPress snapshots; a per-record approval gate plus verified backup, restore and redirect prerequisites determines publication. Preview bodies remain noindex with original canonicals. `/research/` exposes the validated Census distribution and download.

`/ask/` uses approved-public-content retrieval and narrow explicit deterministic income/drawdown calculations. The server validates bounded questions, origins, security tokens and rate limits; it never forwards questions to Datadog or an external model. The browser keeps conversation state in memory. `/admin/` uses a generated server secret and exposes operational aggregates and read-only quality checks; unfinished migration gates cannot be approved there.

Optional analytics uses explicit consent and enumerated events only. Essential operation counters are separate daily files, both retained30days. A standalone Datadog metrics worker can export ten fixed gauges. Private Bits workflows use an independent allowlist, timeout and persistent budget ledger and remain disabled pending account review. No raw prompts, financial values or PII are telemetry. See [the implementation contract](implementation-2026-09-13.md), [content operations](../scripts/content-sync/README.md), [Ask](genie.md), and [observability](observability.md).

The remaining sections document the foundational contracts. References to future account, regional data or editorial products are a roadmap, not enabled functionality.

## Boundaries

An npm workspaces monorepo: apps/web (Next.js App Router, React, TypeScript), apps/ingest (Node/TypeScript batch jobs), apps/worker (future scheduled jobs). Shared packages: schema (Zod contracts), datasets (validated public distributions and provenance), calculators (pure deterministic engines), database (Drizzle PostgreSQL schema and migrations), ui/charts (accessible presentation), seo, analytics, ads. Approved-source Ask is implemented; generative inference, email and account persistence remain separate future integrations.

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

CI: clean install, lint, typecheck, mathematical/ingest/security tests, production build, Playwright mobile/desktop/accessibility/metadata/visual regression, dependency audit. Lighthouse runs against a production server; lab metrics are not field CWV proof. Nonced CSP and security headers protect the app. Advertising is limited to reviewed public shells and subject to the regional preference policy; private calculator frames and Ask never load ads. No external generative inference is enabled. Preview deployments are noindex and production indexing requires an explicit environment switch. Canonical host is https://insightginie.com. A public read-only health endpoint reports dataset availability without secrets.

Local candidate staging uses loopback3011; the main service uses loopback3000 through the existing tunnel. WordPress host cutover additionally requires a complete files/database backup, restore test, traffic/backlink review, validated URL dispositions and human trademark/legal review. Never mass-redirect unrelated content.
