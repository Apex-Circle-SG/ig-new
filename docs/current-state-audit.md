# Current-state audit

Audit started 2026-09-12. Repository: Apex-Circle-SG/ig-new, branch main.

## Repository

Initial repository has no commits and no application files. Only .git and an untracked .env exist. No WordPress installation, archive, package lock, database export, deployment configuration, SEO artifact, application code, or test harness was supplied. There is no existing source architecture to preserve. Graphify inspection is not useful until code exists.

## Credentials and infrastructure

Only GH_USER and GH_PAT are configured in .env. Values are never recorded. Git remote points to the supplied GitHub repository. No hosting, database, WordPress, Search Console, analytics or dataset API credentials are supplied. Node 24 and npm 11 are available. All environment files except .env.example must be ignored before the first commit.

## Live site

https://insightginie.com is publicly accessible and displays WordPress/GeneratePress-style article listings, AI/crypto/trading categories, tag archives and dated archive navigation. It is still publishing September 2026 articles. Homepage pagination advertises 363 pages. This is evidence of the legacy strategy, not proof of exact post count. Canonical/SEO, sitemap inventory and crawl coverage are detailed in docs/legacy-migration.md and docs/legacy/ when the read-only crawl finishes.

## Risks and debt

There is no recoverable full production backup in this repository. Public crawling cannot back up WordPress database, uploads, plugins, configuration or publishing automation. URL classification must remain provisional without traffic/backlink data. Legacy publishing jobs cannot safely be retired without host/admin access. A preview can be built without changing live DNS or WordPress; replacing production is blocked by backup, evidence review and infrastructure access. No automatic homepage redirects are acceptable. Human trademark clearance and legal review are required before public launch.

## First deliverable

A source-backed individual-income calculator and reusable platform foundation. Missing integrations are visible and fail gracefully. Claims of production readiness require deployment verification; local checks alone are insufficient.

## Completed public inventory

The read-only audit discovered 41,211 distinct public URLs with zero fetch errors. It enumerated all 9,071 REST posts, 17 pages, 68 categories and 32,045 tag records and fetched all 46 sitemap documents. Twelve pairs of tag IDs share permalinks. There are 436 empty taxonomy URLs. All 463 response snapshots passed checksum verification. Provisional dispositions are five KEEP, 41,206 candidates for 410 and zero redirects, all unapproved. These are review candidates, never automatic production instructions.

See [evidence index](legacy/README.md) for coverage, compressed CSV and exact counts. Search Console/backlink impact and a full WordPress backup remain unavailable. Current public metadata indicates WordPress, GeneratePress, Yoast and Site Kit, with LiteSpeed/Hostinger and Cloudflare header evidence; these are observations, not an authenticated infrastructure inventory.
