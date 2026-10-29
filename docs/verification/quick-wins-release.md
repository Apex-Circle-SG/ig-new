# Phase 1 Quick Wins release report

Status: LIVE AND VERIFIED on October 29, 2026; remaining integration/precision decisions are listed below. WordPress stop condition waived by owner; legacy WordPress remains untouched.

Backup taken: gzip tar of source including uncommitted files, live Next.js build, runtime configuration, local application state and systemd units; git bundle --all. Completed 2026-10-29T01:18:54.016911+00:00 (09:18 Singapore, October 29). Private archive: `/root/.local/share/insightginie-backups/quick-wins-20261029T011834Z`. Archive readability and live BUILD_ID verified; checksums in local evidence. A separate read-only D1 schema/table copy completed at 2026-10-29T01:29:43Z (09:29 Singapore), before live changes. All 11 normal tables were restored into a private local SQLite file; the FTS index was rebuilt locally, with matching table counts, integrity check OK and no foreign-key violations. Source rows and live database were not modified. This is a logical copy while existing cron continued, not an atomic/frozen database snapshot. Redis holds disposable cache entries and was not backed up. Legacy WordPress is excluded. No full application restoration drill was performed.

Pages found:

- [US Individual Income Distribution: Census Data, Chart & CSV | InsightGinie](https://insightginie.com/data/us-income-distribution/) — verified HTTP 200 in preflight.
- [US Individual Income Percentile Calculator | InsightGinie](https://insightginie.com/calc/individual-income-percentile/) — verified HTTP 200 in preflight.
- [Business and Finance Calculators | InsightGinie](https://insightginie.com/tools/) — verified HTTP 200 in preflight.
- [AI workflow ROI calculator | InsightGinie](https://insightginie.com/tools/ai-workflow-roi/) — verified HTTP 200 in preflight.
- [Break-even calculator | InsightGinie](https://insightginie.com/tools/break-even/) — verified HTTP 200 in preflight.
- [Business loan payment calculator | InsightGinie](https://insightginie.com/tools/business-loan/) — verified HTTP 200 in preflight.
- [Cash runway calculator | InsightGinie](https://insightginie.com/tools/cash-runway/) — verified HTTP 200 in preflight.
- [Drawdown recovery calculator | InsightGinie](https://insightginie.com/tools/drawdown-recovery/) — verified HTTP 200 in preflight.
- [Portfolio concentration calculator | InsightGinie](https://insightginie.com/tools/portfolio-concentration/) — verified HTTP 200 in preflight.

Also verified the income CSV and https://insightginie.com/embed/income-distribution/. No standalone “Cost of automation” URL existed; the hub labels the existing AI workflow ROI tool accordingly.

Changes made, by task, with before → after URLs for every changed page:

1. **Calculator discovery.** Added `/calculators/` with the requested intro verbatim, eight cards in the requested order (seven calculators plus income data), source/method context and the optional email UI. Main desktop/mobile navigation and footer now say Calculators. Homepage keeps earning content and replaces its buried calculator block with a prominent card immediately after the hero/statistics. Seven calculator pages link to the hub and related tools; income → runway → automation and reverse links are present. Every one of the 24 earning guides adds “Make the numbers work” with break-even/runway links and retains its disclaimer.

2. **Income FAQs and metadata.** Both income pages have the eight requested FAQ answers verbatim, a source line under every answer, and nonce-protected FAQPage JSON-LD matching that text. Both explain the published-band scope and the existing calculator’s interpolation assumption. Income metadata title changed to “Compare My Income — US Income Percentile Calculator | InsightGinie”; data title retained; hub title matches the request. All three descriptions include “Free, no sign-up, source: US Census Bureau.” Dataset, version, formulas and calculation engine are unchanged. Existing single-number interpolated primary results remain an explicit accuracy limitation pending owner confirmation; the new FAQ/share do not invent a point estimate.

3. **URLs and sitemap.** Consolidated the two redundant hub URLs into `/calculators/` with explicit HTTP 301 redirects. Individual tool URLs stay unchanged. Updated canonical index, internal links, sitemap partitions and advertising crawler inventory. Sitemap is prepared locally; Google Search Console submission is not performed. No historical `?p=` links were found in the bounded crawl; historic ID mappings remain unknown. Unknown WordPress IDs are not redirected to arbitrary content. No job listings were pruned, deleted or bulk-redirected.

4. **Retention/share and privacy.** Added email-only form UI in exactly three locations: income calculator below its private tool, below the income data table, and calculators hub. Headline/subtext/button match the request. No configured email provider was found, so submit remains disabled with a clear integration-pending message; no endpoint, list, subscriber record or false success message exists. “Share this insight” runs wholly in the opaque-origin calculator frame, generates a published income band and rounded band-bound range, and lets the visitor review/edit before copying. It includes the calculator URL and Census credit, never the exact input by default. Clipboard fallback selects the text for manual Copy if a browser denies copying. The existing generic tool-link action remains. No band/result is sent to the parent or server. Calculator shells now exclude AdSense and GA4 even with consent; private frames and chart embed stay ad/tracker-free. Other eligible public pages retain existing advertising/analytics settings. Privacy and advertising disclosures reflect these changes.

5. **Draft-only embed promotion.** Prepared [20 researched target pages and personalized complete emails](../quick-wins-embed-outreach.md), ordered by the requested four groups. All drafts include the exact iframe and optional attribution terms. No recipients or addresses were invented. Access limitations and placement fit are documented. No emails, posts, link requests, purchases or external submissions were made. Existing scheduled social automation was not changed or triggered by this release.

URL changes and retained destinations:

| Before | After | Change |
|---|---|---|
| Not present (404) | https://insightginie.com/calculators/ | New hub |
| https://insightginie.com/tools/ | https://insightginie.com/calculators/ | 301 |
| https://insightginie.com/calc/ | https://insightginie.com/calculators/ | 301 |
| https://insightginie.com/ | Same URL | Content/internal links updated |
| https://insightginie.com/calc/individual-income-percentile/ | Same URL | Content/internal links updated |
| https://insightginie.com/data/us-income-distribution/ | Same URL | Content/internal links updated |
| https://insightginie.com/tools/cash-runway/ | Same URL | Content/internal links updated |
| https://insightginie.com/tools/ai-workflow-roi/ | Same URL | Content/internal links updated |
| https://insightginie.com/tools/break-even/ | Same URL | Content/internal links updated |
| https://insightginie.com/tools/business-loan/ | Same URL | Content/internal links updated |
| https://insightginie.com/tools/drawdown-recovery/ | Same URL | Content/internal links updated |
| https://insightginie.com/tools/portfolio-concentration/ | Same URL | Content/internal links updated |
| https://insightginie.com/privacy/ | Same URL | Content/internal links updated |
| https://insightginie.com/advertising-disclosure/ | Same URL | Content/internal links updated |
| https://insightginie.com/insights/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/website-user-testing/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/research-interviews/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/academic-studies/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/research-panels/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/mock-jury/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/stock-photos/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/stock-footage/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/sell-printables/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/sell-spreadsheets/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/sell-notion-templates/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/game-assets/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/3d-models/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/custom-pet-portraits/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/wedding-speech-editing/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/podcast-clips/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/presentation-polish/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/voiceover/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/audiobook-narration/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/online-tutoring/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/paid-open-source/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/security-bounties/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/design-competitions/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/self-published-workbooks/ | Same URL | Content/internal links updated |
| https://insightginie.com/earn/paid-expert-consulting/ | Same URL | Content/internal links updated |

Shared header/footer navigation updates also apply across remaining public pages; their URLs/canonicals are unchanged. The sitemap/robots resources retain their URLs with updated route inventory.

Redirects created:

- https://insightginie.com/tools/ → https://insightginie.com/calculators/ (301).
- https://insightginie.com/calc/ → https://insightginie.com/calculators/ (301).

Tests passed: Candidate verification passed 41 distinct browser checks (40 in the full suite plus one corrected navigation-selector rerun). Both new mobile/desktop guide sweeps, anonymity/network checks, schema, source lines, redirects, sitemap, calculator inputs, consent and accessibility checks passed. One older test still expected the renamed Tools menu; its corrected Calculators navigation rerun passed. Preliminary run also hit the terminal execution time limit; that incomplete run is not counted as a completed suite. Additional results: 424 unit tests; subsequent final share helper 8/8; 35 operations checks; typecheck; lint; content preservation validation; production candidate build; 222 public source/build files scanned against 11 configured secret values with zero matches. Graphify refreshed a bounded 147-file code map (646 nodes, 1,311 edges), zero LLM/API calls; graph health warnings are not runtime evidence. Exact candidate receipt: `docs/verification/quick-wins-candidate.json`. Live receipt: `docs/verification/quick-wins-live.json`; deployment receipt: `docs/verification/quick-wins-deployment.json`. The live build passed 11 browser tests, including both 390px/1280px sweeps of changed pages and all 24 earning guides, seven working calculators, input privacy, anonymous band sharing, source/schema checks and redirects. All 63 sitemap URLs return HTTP 200 and their matching clean canonicals (64 before: two duplicate hubs consolidated to one). The embed URL remains HTTP 200. Initial generic Python-agent HTTP probes received 403; the identified owner-audit agent and live browser checks passed, without firewall changes.

Blockers / owner actions needed:

- Email: select/confirm the provider and audience/list, supply its scoped server-side subscribe credential and consent/double-opt-in requirements. Connect an email-only subscription endpoint without calculator values; enable the button only after provider acceptance can be verified. Publish the requested success message only after a real accepted signup. No subscriber test emails have been sent. A weekly editorial/delivery workflow is also not configured.
- Accuracy: existing primary calculator results still interpolate inside closed bands. Confirm any subsequent presentation/precision change; this release preserves the protected engine/dataset. New FAQs clearly distinguish source ranges from that assumption, and new share text uses ranges only.
- Search Console: owner submits the final verified sitemap using their existing property or supplies scoped access. No indexing/ranking/traffic result is claimed.
- Historical duplicate `?p=` URLs: provide the actual links or historical route mapping for per-URL review. WordPress changes are outside the now-authorized Next.js release.
- Outreach: review targets, individualized wording and verified recipient addresses before any send. Some publisher pages block raw HTTP; PDFs need a companion resource/article placement. No send is authorized by this draft.

What is still NOT done, and why:

Functional email subscriptions/delivery (provider missing), changing the protected interpolating calculator output (owner precision decision pending), historic WordPress query-ID redirects (mapping unknown), Google submission/indexing (no account access), and sending outreach/starting Phase 2 (not authorized). No WordPress backup, frozen/atomic D1 snapshot or full application restore rehearsal; the read-only D1 logical backup passed a local database restoration check. No live AdSense fill or field SEO/performance measurement was attempted.

Verification artifacts (ignored, local): `artifacts/quick-wins-preflight/` includes initial crawl/browser results, private-backup metadata and D1 restore-check receipt, final share tests, unit/type/lint/build/operations logs, screenshots, secret scan, outreach source checks and Graphify log. Source and live-release receipts will name exact build/commit IDs.

## Deployment and Git receipt

Source commit: `81a9a6a849538b71cc568ef19db5ba43de0d8cbd`. Live build: `mPbHgmGVoyIFwtWycWwdo`. Deployed: 2026-10-29T01:33:24.078403+00:00. Service health passed. Reversible prior release: `/root/ig-new/artifacts/releases/pre-consolidation-20261029T013319Z`. Ask/Datadog owner authorization and durable state were preserved. Worker, Redis, job-update schedules and existing LinkedIn schedules were not deployed, changed or manually triggered. Source was committed before promotion; live receipts are committed separately. Git push verification is recorded below after the remote accepts it.
