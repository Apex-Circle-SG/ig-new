# Consolidation application acceptance — 13 September 2026

The application release provides seven working tools, `/insights/`, `/research/`,
`/ask/`, trust pages and protected operations. It does **not** complete the remote
WordPress cutover. The permanent Node.js/Next.js service uses port **3000**.

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

Lint, TypeScript, 256 Vitest tests, 32 Node tests, 18 Python tests and systemd unit syntax checks pass. Commands and deployment procedures are in [the release runbook](consolidation-release.md).
The [browser receipt](verification/consolidation-browser.json) records all 54
passing checks, including the focused recheck of an obsolete caching assertion.
Four reviewed visual snapshots cover Ask and cash runway at 390px and 1280px.
Mobile tests include widths 320, 375, 390, 430 and 768px. Automated axe checks
report no violations in the tested flows; this is not a complete accessibility
conformance audit.

The [Lighthouse report](verification/consolidation-lighthouse-summary.json)
contains mobile simulated measurements taken sequentially against the production
candidate, without concurrent browser suites:

| Page | Performance | Accessibility / best practices / SEO | LCP | CLS |
| --- | ---: | --- | ---: | ---: |
| Home | 92 | 100 / 100 / 100 | 2.37s | 0 |
| Income | 79 | 100 / 100 / 100 | 2.39s | 0.0134 |
| Cash runway | 84 | 100 / 100 / 100 | 2.41s | 0.0033 |
| Ask | 87 | 100 / 100 / 100 | 1.80s | 0.0001 |

Public nonce-bearing HTML remains private/no-store but now permits transport
compression. Measured homepage gzip size fell from 53,783 uncompressed bytes to
10,965 compressed bytes. Private calculator responses retain their isolation
headers and explicit compression. Homepage performance improved from 84 to 92;
cash runway improved from 73 to 84 after compression and consent-copy changes.

**Field p75 Core Web Vitals remain unmeasured.** Lab total blocking time is
294–728ms and is not INP. More JavaScript reduction, especially the original
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
The [deployment receipt](verification/consolidation-deployment.json) is written
only after promotion; the runbook describes the protected rollback archive.
