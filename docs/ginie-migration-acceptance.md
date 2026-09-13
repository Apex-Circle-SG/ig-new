# Ginie and migration release acceptance

September 13, 2026. **Ask Ginie is live using the configured Datadog workflow.**
All 9,088 inventoried public WordPress post/page bodies are preserved locally.
**The blog-host cutover is not complete.**

## Working and verified

- The assistant is named **Ginie**, including navigation, page metadata and
  buttons. Public browser verification confirms a Datadog-backed cited answer
  and a separate deterministic calculation. See the [live browser receipt](verification/ginie-live-browser.json)
  and [actual Datadog execution/cache receipt](verification/datadog-ginie-execution.json).
- Datadog receives bounded approved public passages and returns excerpt IDs.
  Answers are reconstructed from those passages. Raw visitor questions, income
  values, cookies and IPs are not forwarded. Cached, live and local fallback
  answers have distinct visible labels. The provider has durable 20/day and
  120/month run limits; these are not monetary limits.
- The existing menus, tools, sources, privacy controls and mobile layouts pass
  the production-candidate browser suite. All 330 Vitest, 35 Node, 49 Python
  and 55 Playwright tests passed, including four visual snapshots. Lint,
  typecheck, production build and credential scans passed.
- The migration mirror preserves 9,071 public posts and 17 pages. Normalization
  prepared 9,070 exact article candidates. One literal placeholder remains
  REVIEW. The 41,227-row map contains no approved redirect, invented archive
  destination or blanket homepage redirect. The 36,280-row redirect CSV is an
  inactive rehearsal artifact, not a deployed configuration.

Commands and results are recorded in [release checks](verification/ginie-migration-acceptance.json),
[browser checks](verification/ginie-migration-browser.json) and the
[preservation handover](audits/2026-09-13-migration-preservation/handover.md).
The first Ginie implementation also passed [GitHub CI](verification/ginie-ci.json).
The final application build is `vp4vAp13jZLVwN8E3_4r1` from commit `e87ed43`;
see [deployment](verification/ginie-migration-deployment.json) and
[background-service verification](verification/ginie-migration-runtime.json).
Public checks passed for [31 canonical pages and 35 internal destinations](verification/ginie-migration-public-routes.json),
[sitemaps and indexing](verification/ginie-migration-public-seo.json), and
[mobile menu and keyboard calculator use](verification/ginie-migration-public-menu.json).

## Still blocked or unverified

| Acceptance criterion | Status and dependency |
| --- | --- |
| Main host is the only indexable editorial host | Blocked. The source blog remains public; two main-host previews stay noindex with source canonicals. |
| One-hop redirects for every relevant old URL | Prepared for normalized article copies, not activated. Requires verified live targets and scoped blog-host/Cloudflare authority. |
| WordPress is a private headless backend | Requires hosting access, full database/files/uploads/configuration backup, an isolated restore test and backend access controls. |
| Media and all rendered article pages preserved and reviewed | Public media references are retained; binaries and archive-wide browser checks remain outstanding. A checksum is not editorial or licensing approval. |
| Datadog account-level spending, tools and retention | Requires account review. Existing access and a successful run do not prove remaining credits or a monetary cap. |
| Field Core Web Vitals and organic/revenue baselines | Unavailable. Latest local mobile Lighthouse LCP misses the target on income and cash-runway pages. No field-performance claim is made. |

The latest [Lighthouse run](verification/ginie-migration-lighthouse-summary.json)
scored accessibility, best practices and SEO at 100 on all four tested pages;
performance ranged from 80 to 96. The [earlier run](verification/ginie-lighthouse-summary.json)
is retained because lab measurements vary. See [MANUAL_REQUIRED.md](../MANUAL_REQUIRED.md)
for credential, editorial and legal dependencies.

## Deployment and rollback

The Node.js/Next.js service remains `insightginie-web`, bound to
`127.0.0.1:3000` for the existing Cloudflare tunnel. The release process builds
and tests `.next-candidate`, records its exact build ID in
`artifacts/candidate-acceptance.json`, and uses:

```sh
python3 scripts/deploy/promote.py --verify-only
python3 scripts/deploy/promote.py --promote
node scripts/verification/ginie-live.mjs
```

Promotion privately archives the previous build, runtime configuration and
service units, then verifies local health and core routes. Its deployment
receipt records the rollback directory. To restore that exact release:

```sh
python3 scripts/deploy/promote.py --rollback /root/ig-new/artifacts/releases/RECEIPT_DIRECTORY
node scripts/verification/ginie-live.mjs
```

For this release, `RECEIPT_DIRECTORY` is `pre-consolidation-20260913T093938Z`.
It restores the preceding working Ginie release. The Datadog budget and
cache directory `/var/lib/insightginie/datadog-ask` must survive promotion and
rollback. Never reset it to bypass run limits. A rollback to a pre-Datadog build
requires its corresponding smoke tests, rather than the Ginie-provider check.

The WordPress mirror remains in ignored `backups/wordpress-mirror-2026-09-13/`;
it is a public-content copy on this server, not a full or off-host WordPress
backup. Do not disable the source blog or import the redirect CSV until the
[documented cutover prerequisites](audits/2026-09-13-migration-preservation/handover.md)
are satisfied.
