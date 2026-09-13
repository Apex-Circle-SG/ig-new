# Offsite SEO launch operations

Prepared 2026-09-13. The useful public pages, validated data and calculator are
the assets to promote. This work adds discovery operations and identifies
specific stale external references; it does not claim that an API notification
creates rankings or that every external mention is a valuable backlink.

## Search-engine discovery

The [discovery CLI](../../scripts/seo/README.md) validates the live sitemap,
crawlability, canonical URLs and indexability before submitting. The launch
operator must deploy indexing and the ownership-key route first. Then run a
dry run and an explicit submission, retaining the receipt from each release.

```sh
node scripts/seo/submit-discovery.mjs --dry-run --receipt docs/offsite-seo/launch-dry-run.json
node scripts/seo/submit-discovery.mjs --submit --receipt docs/offsite-seo/launch-submission.json
```

IndexNow needs a generated ownership value in `INDEXNOW_KEY` and its matching
public text route. It can notify participating engines. It is not a Google
Search submission. Google and Bing account-level sitemap submissions run when
their authenticated credentials are configured; otherwise the receipt says
`skipped` and identifies the missing variable.
[IndexNow protocol](https://www.indexnow.org/documentation),
[Google sitemap API](https://developers.google.com/webmaster-tools/v1/sitemaps/submit).

After account access is connected, check the principal calculator, source and
methodology URLs in URL Inspection, verify sitemap processing, and review
queries, impressions, clicks and crawl errors weekly. A useful first report
compares landing pages and calculator completion, rather than raw page count.

## Existing references and profile corrections

[Audited targets and drafts](link-reclamation.md) identify two broken legacy
article destinations and two live profile/homepage references. None of the old
article subjects has an equivalent new calculator destination. Their useful
action is an accurate retirement notice or profile correction, not an unrelated
redirect. Social account access is not configured in this workspace; no messages
or posts were sent by this workstream.

The public GitHub repository description, homepage and topics were updated to
describe the functioning product. See the [successful API receipt](github-metadata.json).

## Assets worth earning citations for

Pitch the current calculator and its visible methodology to authors already
discussing individual-income comparisons. The precise scope is **US people age
15 and over, including people without income, using 2024 income reported in
the 2025 CPS ASEC**. Do not call it a salary ranking among workers, a household
percentile, or a city benchmark.

The launch adds a [public income distribution explorer](https://insightginie.com/data/us-income-distribution/),
reproducible CSV and attributed chart embed. This is a deterministic data product;
an editorial study interpreting it still requires a real author/reviewer before
publication. Avoid spreading unreviewed financial claims through mass syndication.

For external resource requests, use a small list of pages with a specific
reader need, identify the author/editor from their own public contact channel,
and write an individual reason the resource is useful. Track contacted URL,
date, response, resulting placement and engaged referral traffic. Never record
income values or profile data in campaign links.
