# First vertical slice — delivery and verification

Date: 2026-09-12. Scope: audit, shared platform foundation, real Census ingest and Individual Income Percentile. This is **locally verified application code**, not a production migration or a completed full-platform MVP.

## Delivered

- Next.js/TypeScript monorepo, responsive design system, command routing, calculator and source/methodology/trust pages.
- Shared Zod contracts, pure deterministic calculator, 44 real Census CPS PINC-11 income bands, raw source archives, version/checksum provenance and atomic last-good publication.
- PostgreSQL/Drizzle migrations and transactional publication with immutable source records, protected private-table scaffolding, page approval constraints and audit records.
- Privacy-safe analytics boundary, disabled advertising abstraction, structured data/canonicals, preview noindex, health endpoint, CI and operating runbooks.
- Read-only inventory of 41,211 legacy URLs. All migration dispositions remain provisional and unapplied.

The default $75,000 example yields approximately **74.7th percentile**, compared with US people age 15+ including nonworkers. Income is measured in 2024 dollars (2025 survey). Open tails use ranges; a $300,000 input displays 97.4–100%, not a fabricated exact rank. Cents are preserved around band boundaries.

## Verification evidence

| Check                                               | Result                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| ESLint, zero-warning gate                           | Passed                                                               |
| TypeScript                                          | Passed                                                               |
| Vitest calculator, ingest, privacy and quality gate | 43 passed                                                            |
| PostgreSQL 18 isolated integration checks           | 33 passed; migrations replay and schema generation verified          |
| Legacy migration safety tests                       | 15 passed                                                            |
| Legacy inventory validation                         | 41,211 rows; zero errors; zero approved dispositions                 |
| Production Next.js build                            | Passed; static public pages and a dynamic health endpoint            |
| Playwright                                          | 16 passed in 48.0 seconds                                            |
| Dependency audit                                    | Zero reported vulnerabilities, including development dependencies    |
| Desktop/mobile screenshots                          | No overflow or browser runtime errors at 1440px and 390px            |
| Local background hosting                            | Active on 127.0.0.1:3000 under enabled systemd service               |
| External preview                                    | Operator-managed Cloudflare tunnel; public hostname not yet verified |

The browser suite covers homepage intent routing, invalid inputs, known results, open tails, cents, negative incomes, what-if controls, accessible data table, private-input network/storage isolation, sharing, mobile navigation, keyboard submission, metadata, security headers, health, 404, preview robots, policy routes, failed/disabled JavaScript and recovery when the calculation engine cannot download. It checks both homepage and calculator at 320, 375, 390, 430, 768 and 1280px with axe WCAG 2/2.1/2.2 AA rules. Automated checks do not substitute for a full manual accessibility certification.

The real-browser review found and fixed a native-form privacy leak before hydration, a chart-title hydration mismatch, secondary-text contrast failures and an overflowing decorative orbit. Financial fields now have no `name` and stay disabled until handlers attach. Static example/methodology content remains readable with JavaScript disabled. See [browser evidence](verification/browser-summary.json).

## Screenshots

[Homepage desktop](verification/home-desktop.png) · [Calculator desktop](verification/calculator-desktop.png) · [Homepage mobile](verification/home-mobile.png) · [Calculator mobile](verification/calculator-mobile.png)

## Performance

Final Lighthouse mobile-simulated measurements against the local production build:

| Page              | Performance | Accessibility | Best practices | LCP    | TBT    | CLS |
| ----------------- | ----------- | ------------- | -------------- | ------ | ------ | --- |
| Homepage          | 91          | 100           | 100            | 2.53 s | 303 ms | 0   |
| Income calculator | 92          | 100           | 100            | 2.10 s | 321 ms | 0   |

The homepage lab LCP is slightly above the requested 2.5-second target. Real-user p75 LCP/INP remain unmeasured until deployment and traffic; TBT is not INP. Both SEO scores are 66 because preview noindex and blocked crawling are intentional. No other binary Lighthouse audit failed.

The server renders the default example with the same calculator engine used by the browser. Personal calculations load that engine on input focus or submission. Removing unused validation locales and unnecessary link prefetching reduced initial work; performance improved from the [64/72 baseline](verification/lighthouse-baseline.json) without changing calculation results. See [final machine-readable measurements](verification/lighthouse-summary.json). Full local reports are retained under `artifacts/lighthouse/`. These are lab observations on this machine, not production measurements.

## Infrastructure and migration limits

Only GitHub credentials are configured. Known hosting/database/search credentials are also absent from the process environment; no local Vercel login exists. The web calculator works without those services by using its validated public snapshot. A disposable PostgreSQL 18 instance was used for database verification and removed afterward; no hosted database was provisioned.

At the operator's request, the production build now runs on this machine as
`insightginie-web.service`, listening at `127.0.0.1:3000`. Systemd unit validation
passed, the unit is enabled for boot, and terminating its main process confirmed
automatic restart with a new PID and a healthy dataset response. Four targeted
Playwright checks passed against the service (8.2 seconds), covering homepage
routing, calculator results and boundaries, private inputs, metadata and health.
The tunnel is left to the operator. See [hosting instructions](deployment.md#background-service-on-this-host).

The remote WordPress site has not been deleted. At the operator's explicit request, the local `/root/skill-wordpress` publishing automation, its hourly cron entry and associated background processes were removed; see the [retirement record](legacy-automation-retirement.md). All public posts/pages/categories/tag records and sitemaps were enumerated, but this is not a full database/uploads/plugins/configuration backup. A complete restore-tested backup, Search Console/backlink evidence and reviewed URL dispositions remain prerequisites for deleting the remote legacy installation. See [migration evidence](legacy/README.md).

No salary-page batch, household/relocation/tax calculator, account persistence, chat, email report, ad provider, affiliate integration or billing is enabled. Author/reviewer identities, a real support/privacy channel, hosting log-retention policy and human legal/trademark clearance remain required for public launch. The current CSP permits inline Next.js bootstrap; authenticated features require their own strengthened policy and controls.

## Reproduction

Use the commands in [README](../README.md) and [local development](local-development.md). With the production server running, execute `node scripts/verification/browser.mjs` and `node scripts/verification/lighthouse.mjs`. Remote preview setup is documented in [deployment](deployment.md).

## Next milestone

Connect and verify the operator's tunnel against the running service, then proceed to household-income ingestion/calculation. Broader calculator and entity expansion stays behind the staged [implementation plan](implementation-plan.md).
