# Consolidation audit — Phase 1, 13 September 2026

**No production/application changes.** Discovery completed for the known public
WordPress collections; exhaustive per-URL source/rendered validation is **not
complete**. Blog pagination/search browser probes returned HTTP 429, so further
blog crawling was paused. No redirect, CMS setting, ad setting or DNS record was
changed. [Machine summary](../../../SEO_AUDIT.json).

## Verified findings

- Public WordPress remains at blog.insightginie.com, with blog-host canonicals,
  public REST APIs and 46 sitemap documents. REST enumeration matched **9,071
  posts, 17 pages, 68 categories and 32,045 tag records**. Duplicate tag permalinks
  reduce the distinct tag URL count to **32,033**. The discovered blog inventory
  contains **41,211 distinct URLs**.
- Main is the existing Next.js/React/TypeScript app behind Cloudflare Tunnel,
  supervised by systemd on port **3000**. Its production calculator needs no live
  database, email or inference provider. PostgreSQL/Drizzle schemas exist, but
  no production database connection is configured.
- Two externally referenced main-domain article URLs return 404; their exact
  WordPress counterparts return 200. These are concrete restoration/migration
  priorities, without any claim about their traffic volume.
- `/insights/`, `/tools/`, `/research/` and `/ask/` hubs are absent. The existing
  `/tools/income/` is the opaque financial-input frame, so its privacy boundary
  must survive the new public tools architecture.
- The sampled DougDoug article overflows a 390px viewport. Main-page checks did
  not find horizontal overflow or automated accessibility violations in the
  tested views. This is not WCAG certification.
- Blog pagination and search returned 429 during browser checks. Accessibility
  failures on those responses describe rate-limit pages, not the underlying
  archive/search templates.
- No Datadog instrumentation or credentials are configured. Main analytics are
  first-party aggregate counters, without organic attribution or unique users.

## Inferred risks

Large tag/archive inventory may dilute discovery and duplicate archive context;
counts alone do not prove poor traffic or justify removal. Unrelated legacy
subjects need a preservation plan separate from the proposed finance hubs.

Public WordPress and main currently have different self-canonical content.
A future headless rollout would create duplicate full content if both copies
were indexed before blog redirects. The audit does not claim all existing pages
are already cross-host duplicates.

Auto ads control placement outside the private calculator frame. Existing lab
results do not establish field performance with ads; account-side placement
review and consent configuration still need evidence.

## Unavailable evidence and acceptance gaps

No GSC, GA4, backlink export or server-log URL inventory was supplied. Existing
aggregate counters include prior verification and cannot establish an organic,
conversion or RPM baseline. No URL is classified as having zero search value.

The inventory is complete for successful public sitemap/REST discovery, **not
for every possible URL**. Unlinked URLs, attachments, deeper archive pagination
and arbitrary query combinations require more discovery. Source records with
missing measurements use nulls and explicit coverage reasons. Browser findings
cover the 13 main public pages and listed blog/viewport samples only.

Public metadata/HTML snapshots are not a restorable WordPress backup. The backend
cannot be safely made private or redirected without backup/restore evidence and
hosting/Cloudflare authority. The tunnel connector token does not provide that
authority. [Required inputs](../../../MANUAL_REQUIRED.md).

## Proposed migration map

[MIGRATION_MAP.csv](../../../MIGRATION_MAP.csv) is **inactive**. It proposes exact
article copies under `/insights/{slug}/`, preserves working main-domain URLs,
and identifies overlapping trust-page merges. Tag/category/date/pagination
counterparts are proposed separately with noindex, rather than mapping unrelated
archives to a finance hub or homepage. Their content, empty-state behavior and
membership must be validated before approval. No candidate is automatically
published, redirected, deleted or declared high quality.

The discovery bootstrap's former automatic 410 proposals were removed from this
new audit. The original output is retained locally for reproducibility; it does
not apply to the preservation instructions in the current request.

## Evidence

- [Infrastructure](infrastructure.json)
- [Discovery counts and source coverage](blog-inventory/crawl-summary.json)
- [Versioned request manifest](blog-inventory/request-manifest.json)
- [Raw URL inventory](blog-inventory/url-inventory.csv.gz)
- [Measured source documents](measured-source.jsonl.gz)
- [Browser/source comparisons and accessibility](browser-audit.json)
- `url-records-*.jsonl.gz`: one record per known URL, including null/unmeasured
  fields, sitemap membership and references to browser measurements.
- [Linked article checks](known-linked-url-checks.json)
- [Available analytics](available-analytics.json)
- [Checks and phase acceptance](checks.json)

The source extractor records title, description, H1, robots, canonicals, schema,
language, word count, content hash, links and declared image dimensions. Browser
probes add actual dimensions and visible-content comparisons. Different source
and rendered text hashes alone do not establish cloaking. Inlinks and duplicate
groups are limited to measured source documents and must not be interpreted as
an exhaustive orphan/duplicate audit.
