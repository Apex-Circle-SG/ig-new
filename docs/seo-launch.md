# Onsite SEO launch

Implemented 13 September 2026. Live release verification is recorded separately;
these notes describe the code and its intended publication boundaries.

## Reviewed launch inventory

`packages/seo/src/routes.ts` defines the canonical public inventory consumed by
the sitemap, crawler rules and request-level indexing/advertising controls.
There are 13 approved public routes: home, calculator index, individual-income
calculator, data index, Census dataset, US income distribution explorer,
methodology index, income methodology, about, editorial policy, privacy, terms
and contact.

`PUBLIC_AD_PATHS` uses the same public inventory. The calculator runs separately
at `/tools/income/`; that tool, embeds, account/admin/API routes, unknown URLs and
unfinished author pages are excluded. Routes are matched explicitly; adding a
file or a slug under `/data/` does not automatically publish or monetize it.

The author page retains `noindex, follow`: no real editorial authors or reviewers
have been supplied. No identity, endorsement, contact email or reviewed article
has been invented. Contact now links to the verified public GitHub issue tracker
and explains that reports are public and require a GitHub account. Private
support remains an operator configuration task.

## Indexing controls

`siteIsIndexable()` requires `SITE_INDEXABLE=true`; `VERCEL_ENV=preview` overrides
it. Launch builds and runtime must agree. Production robots allows public
crawling while excluding API, account, administration, private-tool and embed
prefixes. Preview robots disallows crawling and has no sitemap directive.

The production sitemap contains only reviewed canonical URLs. It does not claim
that all content changed on the current build date. Accurate source retrieval
and reference years remain visible on dataset/calculator pages. A sitemap is a
discovery aid, not a promise of indexing. [Google sitemap documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

Advertising crawlers receive exact public-path rules with end anchors, plus
access to `ads.txt` and framework assets. A bare homepage `Allow: /` in this group
would also allow private paths, so its rule is `Allow: /$`.

Cloudflare currently prepends its own robots content. The application no longer
ships a contradictory production wildcard `Disallow: /`; verify the public
response as well as the local origin. Preview confidentiality must come from
authentication/access controls, not robots. [Google robots matching and precedence](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

## Content and internal links

- Calculator headings describe the actual product: US individual income
  percentile, using the population age 15 and over. No unsupported state,
  city, age-specific or full-time-worker claim is introduced.
- The calculator and calculator index link to the source-derived income data
  explorer, while retaining direct methodology links.
- About links to the working calculator, methodology, editorial policy and
  corrections channel. Source attribution explicitly avoids implying Census
  endorsement.
- Contact offers a functioning issue-reporting route with guidance for source
  version, expected behavior and hypothetical examples.

## Verification

`tests/unit/seo-launch.test.ts` exercises explicit launch/preview gating, route
boundaries, canonical sitemap output, absence of synthetic modification dates,
and exact advertising crawler rules. Release browser checks must additionally
confirm that every sitemap URL returns 200, meaningful HTML, one H1, the correct
canonical and indexable metadata/header; private tools and unknown URLs must
retain exclusion. Tests of headers and browser behavior belong to the release
suite because those controls live outside this package.

Do not add city/occupation permutations until the corresponding data, useful
comparisons and publication quality review exist. Search Console/Bing verification
and actual indexation measurements require the relevant account access.

## Opportunity search discovery release — 20 October 2026

The live baseline had 36 sitemap URLs and omitted all 24 original earning-method guides. A paginated catalog audit read 992 active deduplicated remote jobs at the time of collection; 862 stored excerpts were shorter than 500 characters and 270 contained an ellipsis. Counts fluctuate. The catalog stores bounded excerpts rather than verified full job descriptions, so the existing noindex policy for feed-only job details remains in place. This release does not claim Google Jobs eligibility, indexing, ranking improvement or traffic growth. See `docs/verification/opportunity-seo-before.json`.

Four original topic hubs now give readers useful comparisons, practical experiments and matched source records: `/opportunities/remote-contracts/`, `/earn/paid-research/`, `/earn/creative-services/` and `/earn/digital-products/`. They work without JavaScript. Contract records come from the existing live Contract filter; method cards retain provider-status labels and distinguish methods from available assignments. If the catalog fails, original hub guidance remains available with an explicit unavailable state.

The exact allowlist of 24 earning-guide paths now feeds the main sitemap, the existing site sitemap partition, the content index and public route IDs. Arbitrary slugs and private/query routes do not become approved. Guides link to their category hubs and three related methods, and valid guide pages gain breadcrumb data. Missing or failed guide/idea lookups produce noindex metadata. Preview environments remain excluded. New topic routes are explicitly distinguished from dynamic opportunity records so the ad provider does not mistake a hub for a missing job or method. GA4 `G-4HQVZL3586`, AdSense `ca-pub-8735749779872017` and consent controls remain in place.

The source status page also reports the already configured 21:00 Singapore trial separately from morning publishing. No LinkedIn publication is part of this frontend deployment.

Validation includes type checking, lint, unit and operational tests, a separate candidate build, canonical/sitemap/schema checks, server-rendered content, no-JavaScript navigation, mobile fit, accessibility and consent/ad checks. The release receipt records exact counts and build IDs. Run `node scripts/seo/opportunity-audit.mjs --after` after promotion; `SEO_BASE_URL=http://127.0.0.1:3011` can target a candidate. Its metadata observations are not Search Console indexing results.

References: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [job content requirements](https://developers.google.com/search/docs/appearance/structured-data/job-posting), and [spam policies](https://developers.google.com/search/docs/essentials/spam-policies). The hubs provide original decision guidance rather than mass-producing near-identical filter URLs. Full JobPosting markup should wait for complete permitted descriptions and required verified data. No new search-engine credentials were requested; owner-provided analytics exports remain the basis for performance review.

Next work: consent-compatible per-post visit/application-click measurement, then a transparent observed-catalog data asset and targeted outreach drafts. These are not shipped in this release. Do not treat LinkedIn engagement as evidence of Google ranking changes. External email or community posting is not authorised by this release.
