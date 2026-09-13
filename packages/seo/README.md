# seo

Canonical, breadcrumb, WebApplication JSON-LD, script-safe serialization and publication quality checks.

`PUBLIC_INDEXABLE_PATHS` is the reviewed launch-page registry; `PUBLIC_AD_PATHS`
shares that inventory. Unknown paths, drafts, private tools, embeds and account
areas are excluded by exact path matching. `siteIsIndexable()` requires explicit
`SITE_INDEXABLE=true` and rejects Vercel previews. The sitemap, robots rules and
request-level indexing/advertising controls consume these exports.

Add a route only after its content, source attribution, canonical, functionality
and privacy behavior are verified. See [the launch notes](../../docs/seo-launch.md).
