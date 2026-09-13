# Consolidation implementation and rollback plan

Phase 1 does not deploy anything. The current app, port 3000 service, calculator,
ads, Cloudflare routing and WordPress templates remain unchanged.

## Dependency order

1. Complete audit gaps and obtain GSC/log/backlink evidence, source-media rights,
   WordPress hosting access and a full backup. Test restoration to an isolated,
   authenticated host. Record archive checksums and the actual restore commands.
2. Implement a read-only WordPress sync against an allowlisted HTTPS origin.
   Preserve source IDs, body HTML, original author/byline, dates, media/captions
   and source links. Sanitize unsafe executable markup without inventing content.
   Store immutable raw responses, transformation version and content hashes.
   Publish only a validated last-good sync. Authenticate the backend before
   depending on private/draft access; never put CMS credentials in browser code.
3. Build `/insights/` rendering in an isolated, non-indexable preview. Reconcile
   migrated body/media/metadata with the source. Keep migration changes in their
   own commits, separate from redesign and the six new finance tools.
4. Validate each candidate destination and all slug/policy collisions. Confirm
   archive membership, explicit noindex decisions and real 404/410 behavior.
   Exact main-domain content with demonstrated value is retained unless a
   documented necessity requires one direct redirect.
5. Prepare one direct server/edge 301 or 308 for each approved old URL to its final
   canonical HTTPS destination. Requests to blog currently reach Hostinger;
   adding redirects only inside the main Next.js app will not affect that host.
   Preserve necessary authenticated backend/admin exceptions.
6. Test routing order, including HTTP, www, slash and approved query variants,
   so HTTPS normalization does not create an extra blog→blog→main hop. Do not
   disallow old article paths in robots before crawlers can discover redirects.
7. Switch article rendering and redirects together after validation. Keep the
   WordPress backend authenticated and out of public sitemaps. Verify that no
   duplicate full article remains indexable on both hosts. Keep public redirect
   responses crawlable, independent of backend access controls.
8. Submit only validated canonical 200 indexable destinations; verify sitemap
   processing and compare actual search/engagement results. Retain old URL maps
   and redirects. Do not expand finance editorial or programmatic inventory
   simply to create advertising pages.

## Deployment prerequisites

CREDENTIAL_REQUIRED: WordPress/hosting and scoped Cloudflare or equivalent
routing access. MANUAL_REQUIRED: restore-tested backup and final source/target
validation. EDITORIAL_REQUIRED: byline, source, archive and finance review.
LEGAL_REVIEW_REQUIRED: policies, consent, content rights and financial wording.

## Rollback

Before each future release, archive the exact web build, service unit, CMS export,
media manifest, redirect rules and environment-variable names (not secret values).
Record their hashes and a tested restoration process. Do not overwrite the last
working web build or last-good content sync in place.

If validation fails before cutover, leave production untouched. If a deployed
migration fails, restore the previous web build and routing registry as one
coordinated rollback; retain the new raw sync and request evidence for diagnosis.
Do not delete the WordPress database/media as a rollback strategy. Restore only
one indexable full-content host and explicitly verify canonicals/robots afterward.

The existing web rollback instructions and archived build are documented in
[deployment.md](deployment.md). This document does not claim a WordPress restore
has been performed or provide untested credentials/commands for an unknown host.
