# Consolidation build contract

The current operator instruction authorizes implementation and deployment of the
previously requested consolidation platform. Existing working routes and private
calculator isolation must survive. Commits and builds remain reversible.

## Scope and dependency order

1. Preserve the existing release and phase-one evidence. Implement the six
   deterministic finance tools, trust infrastructure and useful content hubs.
2. Build a versioned, read-only WordPress sync and non-indexable migration
   previews. Public originals remain authoritative until backup/restore,
   per-URL validation and blog-host redirect authority are available.
3. Deliver `/ask/` with approved-public-content retrieval, deterministic tools,
   citations, refusal/fallback behavior, bounded requests and no private-input
   logging. Bits remains a private operational integration under the existing
   product requirement; a successful health check does not override this scope.
4. Integrate canonical route inventory, feeds, content index, sitemap partitions,
   analytics, monitoring templates, private operations and migration controls.
5. Run correctness, integration, browser, accessibility, SEO and performance
   checks. Deploy a separate candidate build on this host, verify it, then
   promote it to the existing port 3000 service with a retained rollback build.
6. Complete remote migration only after its external dependencies resolve. Do
   not equate software completion with unavailable hosting or editorial review.

## Shared interfaces and ownership

The root engineer owns global navigation/styles, `packages/seo`, proxy/headers,
analytics integration, assistant endpoints, operational access, dependency/CI
configuration and release promotion.

Calculator work owns `packages/calculators/src/business.ts`, its tests,
`apps/web/src/app/tools/[slug]/page.tsx`, the `/tools/` hub, a dedicated finance
component/style module and self-contained private finance embed generation.
Export six tool definitions using these stable slugs:

- `ai-workflow-roi`
- `cash-runway`
- `break-even`
- `business-loan`
- `drawdown-recovery`
- `portfolio-concentration`

`FINANCE_TOOLS` holds typed metadata/input fields; `calculateFinancialTool(id,
inputs)` validates inputs and returns deterministic values, result rows,
assumptions and formula version. Numerical business logic stays outside React.
Sensitive calculator inputs/results stay in an opaque sandboxed document under
`/private-tools/{slug}/`. Public share links contain a tool slug only; exports
are deliberate local downloads. No external datasets/rates are fabricated.

Content work owns `apps/web/src/lib/content/`, `scripts/content-sync/`,
`content/`, `/insights/`, `/insights/[slug]/`, `/research/` and related content
tests. Public-source HTML is sanitized; snapshots are immutable and last-good
publication is atomic. Legacy previews are noindex and retain the original
canonical until the migration cutover gate passes. New editorial articles stay
draft without verified authors/review. A public retrieval document has `id`,
`title`, `path`, `text`, `updatedAt`, `sources` and `approved: true`; only explicitly
approved public product/methodology text belongs in the assistant corpus.

Trust work owns additional policy routes, an organizational maintainer profile,
reusable finance attribution UI, editorial briefs and its own tests. Do not
invent people, credentials, reviews, dates or professional approval. Existing
policy pages may be updated for actual behavior after root integration.

## Gates

- No production secrets in Git, browser bundles, URLs or analytics.
- No ads in chat or private tools; public tool shells reserve labeled ad space.
- No unreviewed editorial/programmatic publication or duplicate indexed articles.
- API inputs are bounded/validated, same-origin writes checked, errors redacted.
- CI correctness failures block promotion. External evidence remains explicitly
  labeled in `MANUAL_REQUIRED.md`, with deployment/rollback instructions.
