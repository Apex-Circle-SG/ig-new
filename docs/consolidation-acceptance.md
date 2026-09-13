# Consolidation application acceptance — 13 September 2026

The application is deployed and provides seven working tools, `/insights/`, `/research/`,
`/ask/`, trust pages and protected operations. It does **not** complete the remote
WordPress cutover. The permanent Node.js/Next.js service uses port **3000**.

Public HTTPS verification passes [13 browser checks](verification/consolidation-live-browser.json)
and the [authenticated admin flow](verification/consolidation-live-admin.json).
Datadog [aggregate intake](verification/datadog-metrics-activation.json),
[metric readback](verification/datadog-metric-readback.json) and
[dashboard creation/readback](verification/datadog-dashboard-activation.json) are verified;
the five-minute metrics timer is enabled. These counts include release tests and
are not an organic traffic baseline. IndexNow [received all 31 approved URLs](offsite-seo/consolidation-submission.json)
with HTTP200; this does not guarantee indexing. Google/Bing account-specific APIs
remain unconfigured.

## Implemented and verified

- Six new deterministic finance tools: AI workflow ROI/payback, cash runway,
  break-even, loan payment/effective cost and side-by-side amortization comparison,
  drawdown recovery, and portfolio concentration. The Census individual income
  calculator remains available. Local CSV/print exports are intentional; copied
  links contain only the generic tool URL. Financial form values stay inside an
  opaque sandbox that advertising cannot read.
- Ask retrieves approved public explanations, displays citations and source
  freshness, and delegates supported explicit income/drawdown calculations to
  deterministic engines. It refuses personalized professional advice and falls
  back when grounding is insufficient. There is no model inference dependency,
  Datadog credential in the browser or public Bits execution.
- Consent-aware aggregate analytics, bounded Ask endpoints, origin and token
  checks, rate limits, a kill switch, category-only feedback and 30-day aggregate
  retention. Questions, answers and financial values are not retained in telemetry.
- Three anchored editorial topic hubs, a Census research explorer, content index,
  RSS, canonical sitemap partitions, truthful trust metadata and noindex preview
  handling. All 31 approved canonical routes pass status/metadata/internal-link
  checks. Drafts and migration previews stay out of feeds and sitemaps.
- Reproducible WordPress snapshots and an authenticated admin quality-check view.
  Two preview articles preserve their source body, byline, dates and media;
  neither is approved for public canonical migration. Publication controls stay
  disabled until backup, restoration, redirect and editorial evidence exists.

## Validation

[GitHub CI passed for the deployed application commit](verification/consolidation-ci.json),
including a clean install, all tests, PostgreSQL migration/replay verification,
build, 54 browser checks and dependency audit. Later release-record edits do not
change the deployed application source.

Lint, TypeScript, 257 Vitest tests, 32 Node tests, 18 Python tests and systemd unit syntax checks pass. Commands and deployment procedures are in [the release runbook](consolidation-release.md).
The [browser receipt](verification/consolidation-browser.json) records all 54
passing checks in one final full-suite run. Earlier failures and fixes are retained
in the rollback record.
Four reviewed visual snapshots cover Ask and cash runway at 390px and 1280px.
Mobile tests include widths 320, 375, 390, 430 and 768px. Automated axe checks
report no violations in the tested flows; this is not a complete accessibility
conformance audit.

The [Lighthouse report](verification/consolidation-lighthouse-summary.json)
contains mobile simulated measurements taken sequentially against the production
candidate, without concurrent browser suites:

| Page | Performance | Accessibility / best practices / SEO | LCP | CLS |
| --- | ---: | --- | ---: | ---: |
| Home | 89 | 100 / 100 / 100 | 2.69s | 0.0000 |
| Income | 76 | 100 / 100 / 100 | 3.19s | 0.0285 |
| Cash runway | 74 | 100 / 100 / 100 | 3.23s | 0.0000 |
| Ask | 96 | 100 / 100 / 100 | 1.92s | 0.0000 |

The compression experiment passed local tests but was rolled back after public
edge checks: Cloudflare Rocket Loader rewrote executable script types. The final
release restores `private, no-store, no-transform`, preserving nonce-bearing
scripts. Private calculator responses retain explicit origin compression. The
[experiment measurements](verification/consolidation-compression-experiment-lighthouse.json)
are historical and must not be presented as the deployed configuration's scores.
Disabling Rocket Loader through scoped Cloudflare configuration is a prerequisite
for revisiting public HTML compression with this deployment stack.

The first public test also sent a synthetic Cloudflare client-IP header intended
only for localhost, producing Cloudflare Error1000. Public tests now leave
Cloudflare-owned headers untouched. The first GitHub CI run found an origin test
that depended on the runner environment; it now supplies its tested origin
explicitly and checks cross-site rejection. These fixes preserve production
origin validation.

**Field p75 Core Web Vitals remain unmeasured.** Lab total blocking time is
220.5–656.5ms and is not INP. Three measured pages exceed the 2.5-second lab LCP target. More JavaScript reduction, especially the original
income experience, remains performance work; these results do not certify the
field INP target or ad-network behavior under real traffic.

## External acceptance still open

- Full blog consolidation: 41,211 URLs inventoried, 9,071 posts identified,
  only two source-preserving preview records validated. Full backup/restore,
  scoped redirect/backend control and per-URL review are missing. There are no
  approved/deployed blog redirects. Original templates remain unchanged.
- Real finance editorial needs verified authors/reviewers and source review.
  The organizational maintainer does not imply professional credentials.
- GSC/backlink/revenue baselines, AdSense account-side approval/CMP verification,
  field Web Vitals and private contact/legal review need external evidence.
- Bits remains private and disabled pending internal tool, retention, identity
  and budget review. APM/RUM/scanner/pipeline templates are not active products.

Detailed labels and dependencies are in [MANUAL_REQUIRED.md](../MANUAL_REQUIRED.md).
The [deployment receipt](verification/consolidation-deployment.json) records the
active build and protected rollback archive. The latest change affects only the
admin response: edge script protection, a bounded fetch and accurate worker-status
copy. Its unit/targeted browser checks supplement the complete public suite.
