# Legacy WordPress migration

Status: read-only audit. The production WordPress site has not been modified. No legacy redirects or `410` responses have been enabled.

The current public site is a WordPress article archive on Hostinger/LiteSpeed behind Cloudflare. GeneratePress, Yoast SEO, Google Site Kit and LiteSpeed cache are visible in public responses. The homepage advertises hundreds of archive pages and articles about AI, cryptocurrency, trading and other topics unrelated to the new product. This architecture is legacy infrastructure, not the starting information architecture for the new application.

## Evidence and exports

- [Crawl summary](legacy/crawl-summary.json): source counts, observed metadata, exact coverage and failures.
- [Full URL inventory and provisional migration map](legacy/url-inventory.csv.gz): gzip-compressed CSV, one deduplicated public URL per row.
- [Request manifest](legacy/request-manifest.json): source URLs, timestamps, SHA-256 checksums, safe response headers.
- [Robots snapshot](legacy/robots.snapshot.txt): the configuration observed during the audit.
- [Crawler and migration validator](../scripts/legacy-url-audit/README.md): reproducible commands and review format.

These are public evidence exports. Compressed public response snapshots are local under ignored `backups/legacy/`. The snapshot covers responses fetched by the crawler, not every article body, upload, database row, configuration file or account. It is **not a restorable WordPress backup**.

Public sources: [homepage](https://insightginie.com/), [sitemap index](https://insightginie.com/sitemap_index.xml), [WordPress REST index](https://insightginie.com/wp-json/), [robots.txt](https://insightginie.com/robots.txt).

## Backup gate

Before any production content removal or replacement, obtain WordPress/Hostinger access and preserve:

1. A transactionally consistent complete database dump, including plugin tables, revisions and unpublished posts.
2. `wp-content/uploads`, themes, plugins, `mu-plugins`, root configuration and server rewrite rules. Store secrets privately in encrypted backups, never in Git.
3. DNS, Cloudflare rules, cache configuration, redirects, cron configuration and external automated publishing jobs.
4. WordPress WXR export as a portable content copy in addition to the full backup.
5. A manifest with artifact checksums, encrypted off-host storage location, retention owner and a documented successful restoration into an isolated environment.

Host/admin access was not supplied to the audit workstream. The backup gate remains unsatisfied. The existing WordPress install and its automated publisher cannot be safely retired from public read-only access.

## URL coverage and evidence review

Sitemaps discover indexable URLs. Public REST pagination additionally discovers published posts/pages that may be omitted from the sitemaps. Homepage links contribute selected month archives, author pages and pagination endpoints. The export does not claim to enumerate every URL WordPress can generate; category/tag pagination, date archives, attachment variants, search URLs, historical redirects, alternate hosts, deleted pages and unlinked URLs require server logs and administrator exports.

Before migration, merge at least 16 months of available Search Console page-level performance, current and historical indexed-page exports, server access logs, supplied backlink exports, existing redirect rules, and WXR URLs. Keep metrics as missing when unavailable; zero is not a substitute for absent evidence. Record source/report date ranges and explicit review decisions.

No Search Console service credentials or backlink exports were supplied to this workstream. Site Kit's public presence is not authorization to access the connected Google account. No private analytics data has been claimed or fabricated.

## Decision rules

All exported decisions are provisional, with `approved=false` and `review_status=PENDING_EVIDENCE_REVIEW`.

- `KEEP`: homepage entry URL and recognized trust/policy routes awaiting content and value review. This does not approve republishing legacy article text or represent proof of ranking value.
- `REDIRECT`: only after a live replacement meets the same user intent and entity, with recorded genuine-equivalence evidence. No redirect targets are guessed by the crawler.
- `410`: provisional for legacy articles/taxonomies/archives with no demonstrated equivalent. This is a review queue, not permission to delete. Traffic, backlinks, external citations and business requirements can change the decision.

High-value evidence triggers manual investigation even for a topic outside the new product. Preservation requires a real editorial plan and responsible author/reviewer. A popular unrelated article must not be redirected to an unrelated calculator or the homepage merely to retain link signals.

## Enforcement and verification

Reviewed decisions should populate an explicit redirect/retirement registry with source URL, destination where applicable, rationale, evidence reference, owner, approval timestamp and backup manifest. Unknown URLs return normal `404`; they must not be caught by a blanket `410` rule. Handle approved redirects before page routing; return an actual `301` and direct canonical `200` destination. Approved retirements return actual HTTP `410`, including useful navigation, and stay out of the new sitemap.

Validate the registry for duplicate sources, loops, chains, homepage targets, missing approvals and redirected/gone targets. Verify every approved route in staging using GET, including slash variants and any query aliases explicitly present in the map. Confirm no profile/scenario parameters leak into redirected URLs. Then test representative routes in a real browser and check canonical, robots and sitemap behavior.

At cutover, freeze the publisher, capture a final delta inventory and backup, switch traffic only after staging verification, purge stale edge caches, and verify the live routes. Submit the new canonical sitemap through authorized Search Console/Bing accounts when access is available. Keep the backup and rollback environment available while monitoring crawl errors, `410` rates, accidental soft `404`s and valuable landing-page traffic.

Retire duplicate/archive installations only after their domains, backups, rewrite behavior and external references have been inventoried. No duplicate host was asserted from guesswork in this audit.
