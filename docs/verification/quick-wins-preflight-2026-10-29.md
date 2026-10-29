# Phase 1 Quick Wins — blocked preflight report

Verified at 2026-10-29T01:16:38.822995+00:00. Read-only live crawl and browser checks; no application, Worker, WordPress, dataset, schedule or infrastructure changes.

Backup taken: None. No site changes were made. Public response snapshots are saved under `artifacts/quick-wins-preflight/crawl.json`; these are NOT a full backup. A full WordPress backup needs database, uploads, themes, plugins, configuration and a restoration check. No WordPress hosting/admin credentials are available. No backup timestamp is claimed.

Pages found:

- https://insightginie.com/calc/individual-income-percentile/ — US Individual Income Percentile Calculator | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/tools/ — Business and Finance Calculators | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/tools/ai-workflow-roi/ — AI workflow ROI calculator | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/tools/break-even/ — Break-even calculator | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/tools/business-loan/ — Business loan payment calculator | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/tools/cash-runway/ — Cash runway calculator | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/tools/drawdown-recovery/ — Drawdown recovery calculator | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/tools/portfolio-concentration/ — Portfolio concentration calculator | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/data/us-income-distribution/ — US Individual Income Distribution: Census Data, Chart & CSV | InsightGinie (HTTP 200; matching canonical).
- https://insightginie.com/embed/income-distribution/ — US individual income distribution, 2024 (HTTP 200; intentionally not treated as a calculator landing page).
- https://insightginie.com/data/us-income-distribution.csv — complete CSV (HTTP 200).

No separately titled “Cost of automation” calculator was discovered; the verified related tool is AI workflow ROI. No guessed replacement URL was added. The /tools/ entry above is the existing tools hub, not an additional calculator.

Changes made, by task, with before → after URLs for every changed page:

1. Calculators hub: no changes; /calculators/ currently returns 404. /tools/ exists and the header already links to Tools. Homepage earning content and all guide disclaimers were preserved. No before/after URL changes.
2. FAQ/threshold answers: no changes. Live data table matches the supplied cumulative bands and dataset identifier `census-cps-asec-2025-pinc11-us-67587226ba277577-v1`. However, the live calculator prominently reports a single interpolated estimate inside a wide band: input $137,891.23 → 89.8%. Required band-only presentation would be 83.32–91.91% for the $100,000–$149,999 band. This is a presentation/precision discrepancy requiring owner confirmation under the explicit stop rule. Inputs at $50,000, $75,000 and $100,000 show 59.3%, 74.7% and 83.3% respectively; these agree with the lower-band boundaries, but do not display the requested FAQ range in the primary result. Neither the calculator logic nor either source was overwritten.
3. Permalinks/canonicals/sitemap: no changes. Main site is Next.js, not WordPress. All 64 live sitemap entries return HTTP 200 and have their own matching canonical. Sitemap: https://insightginie.com/sitemap.xml . Main-site robots.txt returns 200. No ?p= links were discovered in this bounded crawl. That is not proof that no historic ?p= duplicates exist. Main-site /wp-admin/ returns 404; blog.insightginie.com/wp-admin/ and /wp-json/ return 403 from this environment. WordPress permalink settings and installed SEO plugin are unknown; historical Yoast observations are not current admin verification. No sitemap submission or indexing claim.
4. Email/share: no changes. No recognized email-provider configuration names were found in the existing root/runtime environment files inspected; an account-side integration remains unknown. No subscriber data was accessed and no email was sent. Existing share controls were not replaced. Required integration: owner selects/confirms email provider and list/audience, supplies its scoped server-side subscription credentials and consent requirements; then connect an email-only endpoint without calculator values. Do not show the promised success message until the provider has accepted a subscription. No calculator gate was introduced.
5. Embed promotion: stopped before outreach research/drafting, per the final instruction to stop after crawl/verification without WordPress admin. No 20-target list or draft emails were produced. No outreach or social posting was initiated by this task. Existing scheduled automation was not changed or disabled.

Redirects created: None. No pages deleted or jobs bulk-redirected/pruned. Historic duplicate ?p= identifiers remain unverified; no blanket redirect was invented.

Tests passed:

- 72 public URLs fetched: all 64 sitemap entries plus homepage-linked tool/data resources and explicit availability probes. All sitemap URLs return 200. Existing /calculators/ and /wp-admin/ probes return 404; these were not new regressions. Full sitemap and browser evidence is in the local artifacts noted below.
- 22 live browser page/viewport checks: homepage, /tools/, seven calculator pages, income data page and embed at 390px mobile and 1280px desktop. All return 200, no detected horizontal document overflow, no browser-check failures.
- Seven calculators recalculated successfully at both widths. A distinctive synthetic input (137891.23) did not appear in observed outbound request URLs or request bodies. Parent-page localStorage/sessionStorage remained empty in these fresh browser sessions.
- All tested private calculator frames contain no AdSense/Google Analytics script markers; embed has no AdSense script marker. Browser checks blocked Google ad/analytics requests to avoid generating QA ad impressions. This verifies observed behavior, not every possible browser/network/storage pathway.
- Important pre-existing policy mismatch: every public calculator shell contains the AdSense script element, while the isolated private calculation frames do not. This conflicts with a strict interpretation of “no advertising on calculators”; no additional advertising/tracking was added. Owner must confirm removal from calculator shells as part of the resumed implementation. Real ad fill was not tested.
- New links/new 404 regression checks: not applicable because no pages or links changed. All discovered sitemap destinations were verified; not every outgoing link across the entire site was tested.

Blockers / owner actions needed:

1. WordPress access stop condition: provide the actual WordPress admin/hosting access with permission to export/restore files and database, inspect Settings → Permalinks and installed SEO plugin, and manage reviewed redirects. Credentials belong in protected configuration, never Git or chat. Current blog access returns 403 and will also require an authorized access path. Main-site Next.js deployment access already exists; alternatively explicitly authorize proceeding with the Next.js implementation without WordPress admin and leave legacy WordPress changes blocked. WordPress plugin settings cannot configure Next.js route canonicals.
2. Confirm how to resolve the live interpolation discrepancy before changing either calculator output or publishing conflicting precision claims. No dataset/version change is proposed.
3. Confirm email provider, intended audience/list and scoped subscription integration. No configured mailing list is assumed.
4. Owner submits the verified final sitemap via their Google Search Console property after the new hub exists, or provides scoped access. No Search Console submission was made.
5. Outreach list and draft emails require completion after the stop condition is resolved, then explicit approval before sending.

What is still NOT done, and why:

Full backup; new /calculators/ hub and navigation; homepage reprioritisation; reciprocal tool/guide links; FAQs/schema/metadata; WordPress permalink/plugin inspection; historic duplicate resolution/redirects; email capture; anonymous band-based share-result; 20 outreach targets and drafts; deployment, implementation commit and push are all not done because of the explicit WordPress-access stop instruction and the calculator precision discrepancy. Only this report and ignored verification artifacts were written. No remote Git operations were performed; unrelated working-tree changes were preserved.

Evidence: `artifacts/quick-wins-preflight/crawl.json` and `artifacts/quick-wins-preflight/browser.json` (ignored local artifacts; synthetic input only, no credentials). Existing Graphify map was queried to locate the income component, data page, sitemap and WordPress-origin configuration; it was not rebuilt because application code was not changed.
