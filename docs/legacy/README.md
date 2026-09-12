# Public legacy audit — September 12, 2026

The live WordPress site remains unchanged. The exported migration map is a review queue with **zero approved actions**.

The audit exported **41,211 distinct public URLs** from 46 sitemap documents (index plus 45 children), complete public REST pagination and homepage links. All 463 source responses were successful; their original retrieval times are retained when replayed from verified snapshots.

| URL type | Distinct URLs |
| --- | ---: |
| Posts | 9,071 |
| Static pages | 17 |
| Categories | 68 |
| Tags | 32,033 |
| Homepage | 1 |
| Author | 1 |
| Homepage-linked date/pagination archives | 20 |
| Total | 41,211 |

The public API returns 32,045 tag records. Twelve pairs of distinct tag IDs share the same permalink; details are under `rest_collections.tags.duplicate_links` in the summary. The inventory deduplicates URLs and marks their post counts ambiguous. Another 436 taxonomy URLs report zero attached published posts; that does **not** establish zero traffic or backlinks.

Provisional decisions: 5 `KEEP`, 41,206 `410`, 0 redirects. Every row still requires evidence review before use; nothing in this export authorizes enforcement.

Verification completed: 15 migration-protection unit tests passed; the complete inventory passed structural validation; all 463 local snapshot SHA-256 hashes matched the request manifest; every REST collection's fetched record count matched its reported total. Enforcement validation correctly fails because no rows are approved.

The source of record for counts is [crawl-summary.json](crawl-summary.json). The full export is [url-inventory.csv.gz](url-inventory.csv.gz); open it as a gzip-compressed UTF-8 CSV. Raw public response snapshots are local under ignored `backups/legacy/`, with source URLs and checksums recorded in [request-manifest.json](request-manifest.json).

Confirmed infrastructure from public responses:

- WordPress article front page with GeneratePress, Yoast schema/sitemaps, LiteSpeed cache and Google Site Kit.
- Hostinger/hPanel and LiteSpeed origin headers behind Cloudflare.
- Canonical homepage `https://insightginie.com/` and `index, follow` homepage robots metadata.
- Public [generator metadata](homepage-observations.json) advertises WordPress 7.0.4 and Site Kit 1.184.0; administrator access has not independently verified installed versions.
- Public REST reports 9,071 posts, 17 pages, 68 categories and 32,045 tags.
- The sitemap index advertises 45 child sitemaps. The homepage links to archive pagination up to `/page/363/`.
- Existing trust routes are `/about/`, `/contact/`, `/editorial-policy/` and `/privacy-policy/`. The remaining static pages are unrelated topic overviews.

Scope limitations:

- Sitemap and public REST metadata inventory do not equal a full WordPress backup. No database dump, upload/media backup, plugin/theme/configuration backup, cron export or restoration test is available.
- No Search Console performance export, server logs or backlink dataset was supplied. No URL is claimed to have zero traffic or zero backlinks.
- The crawler fetched the homepage as HTML and inventoried content URLs through metadata. It did not download all article HTML or exhaust all possible archive/query variants.
- No duplicate/archive host has been identified from authorized account records. Such hosts must be audited before retirement.
- The automated publisher remains running; it cannot be inspected or retired from public read-only access.

See the [migration plan](../migration-plan.md), [migration runbook](../legacy-migration.md) and [reproducible tooling](../../scripts/legacy-url-audit/README.md).
