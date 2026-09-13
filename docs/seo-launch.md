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
