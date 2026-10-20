# Daily opportunity discovery and LinkedIn publishing

The opportunities Worker and Cloudflare D1 run independently of the frontend server. Cloudflare Cron Triggers, not the local machine's crontab, own the schedules.

## Schedules and content

| Trigger (UTC)        | Singapore time             | Work                                                                     |
| -------------------- | -------------------------- | ------------------------------------------------------------------------ |
| `*/10 * * * *`       | Every ten minutes          | One fixed source, with a persistent rotating batch of at most 25 records |
| `10 0,6,12,18 * * *` | 08:10, 14:10, 20:10, 02:10 | One quarter of earning-method links and catalog housekeeping             |
| `0 1 * * *`          | 09:00 daily                | One personal-profile LinkedIn opportunity post, or a recorded skip       |
| `0 13 * * *`         | 21:00 daily                | Evening Money Discovery trial, 20 October–2 November 2026                |

Eleven live adapters cover ten job sources and one curated bounty programme: Jobicy, Arbeitnow, Remote OK, GitLab, Canonical, Wikimedia Foundation, Zapier, Docker, Buffer, Linear and Tenstorrent's GitHub bounty programme. The job adapters require a remote flag or explicit remote/home-based location. Hybrid and onsite records are excluded. Country limits remain intact. Full-time, part-time, contract, freelance and temporary arrangements are available as filters when sources supply them.

The initial expansion verified 782 deduplicated active remote roles. Counts fluctuate. A role can have an old original publication date and still be actively listed by its employer; the UI preserves that date rather than making it look newly posted. Board feeds remain limited to recent records and sampled public feed coverage. Complete employer feeds can contain more records than fit a single import; their persistent cursor advances through the current snapshot. At present source sizes, a complete cycle fits within roughly a day. Larger future feeds may take longer.

Twenty-four original method guides cover paid participation, creative products, creative services and skill-based rewards. Eighty-four original business experiments include playful and unusual offers. These are not invented paid vacancies. Guides and experiments do not regenerate automatically; programme-link status and active source listings do update automatically. A reachable programme website proves neither open assignments nor acceptance. Unreachable links remain labelled for review rather than silently disappearing after a transient outage.

## Expiry and curation

- Failed HTTP requests or invalid schemas do not close an entire source.
- Complete employer snapshots close missing listings in bounded groups. Current listing IDs can return to active if the source lists them again.
- Partial job-board feeds use a seven-day unseen grace period. Explicit application deadlines exclude expired records from search.
- Tenstorrent discovery requires unassigned open issues, a bounty label, a monetary amount in the title and the curated organisation. A legitimate empty result is a successful refresh. An open issue or quoted amount is not proof of escrow, payment eligibility or authorisation to test systems.
- Fingerprints suppress duplicate employer/title/location combinations. Original publication and source URLs remain visible.
- Source terms excluded Himalayas and We Work Remotely aggregation; Remotive stays under permission review. A public endpoint is not automatically a licence to republish its full content.

Source references: [Ashby public posting API](https://developers.ashbyhq.com/docs/public-job-posting-api), [Greenhouse Job Board API](https://docs.greenhouse.io/job-board.html), [Tenstorrent programme](https://github.com/tenstorrent/tt-metal#tenstorrent-bounty-program-terms-and-conditions), [Himalayas terms](https://himalayas.app/terms), [We Work Remotely terms](https://weworkremotely.com/api-terms-and-guidelines), [Remotive API conditions](https://github.com/remotive-com/remote-jobs-api).

## LinkedIn behaviour

Singapore weekdays prefer remote jobs on Monday, Tuesday, Thursday and Saturday, and creative methods on Wednesday, Friday and Sunday. An eligible item in the other category is a fallback; if neither qualifies, the day is skipped. Remote roles must have been originally published within 30 days and reconfirmed with a healthy source within a day. The newest 100 eligible unposted jobs are ranked by disclosed numeric pay, source-stated worldwide eligibility, excerpt substance, supplied skills and freshness. Extracted work/qualification text shorter than 100 characters is excluded; excerpts without recognised role or qualification markers are skipped. This conservative heuristic can miss suitable listings. Ranking is a heuristic, not a prediction of clicks. Methods require a recent successful link check plus substantive buyer, first-step and risk fields; selection is deterministic by ID. The site destination must return HTTP 200 before posting.

Job briefs now include a bounded source excerpt (up to 520 characters), supplied skills, arrangement, eligibility, disclosed pay and any supplied deadline, followed by the full-brief/application CTA. Excerpts are labelled as source content; missing responsibilities or requirements are never invented. Some source excerpts contain employer introductions rather than responsibilities. Creative posts describe the potential buyer, first step and specific limitation. No generative model or paid model service is needed.

Existing consent-gated GA4 remains intact. Per-post visit attribution and application-click reporting are not implemented in this update; canonical links carry no unique post identifier. Future audience-led optimisation needs that separate measurement work.

Each post states the nature of the item, avoids first-person experience claims and includes the canonical InsightGinie detail link. Canonical URLs keep these visits eligible for the existing consent-gated GA4 integration, which deliberately excludes query-string pages. Method posts explicitly say that they are not available paid assignments. Jobs state location and supplied payment terms without claiming worldwide eligibility. No LinkedIn Jobs submissions, comments, likes, outreach or automated bounty claims are made.

D1 claims the Singapore calendar day before the external request. The publication ledger prevents retries and repeat selections. A timeout or ambiguous server error becomes `uncertain`, held for manual inspection in LinkedIn rather than automatically retried. Known failures and empty-candidate days are also recorded. There is no catch-up burst after an outage. The first scheduled live post is the next 09:00 Singapore run after activation; QA previews do not publish.

Credentials remain in a protected local file for deployment and Cloudflare secret bindings for execution. Renewed runtime credentials are encrypted with AES-GCM before storage in D1. Access tokens renew before expiry; the refresh token's fixed lifetime does not extend. Revocation, refresh-token expiry or a LinkedIn permission/API-version change can still require operator attention. No permanent hands-off guarantee is implied.

The API version is `202609`; review LinkedIn's supported version calendar periodically. [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api), [refresh-token behaviour](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens).

## Advertising and analytics

AdSense Auto ads are eligible on the opportunity index, earning-method guides, idea pages, platform directory and valid active opportunity details. Root layout validates dynamic records before including the ad provider. Missing, closed/unavailable details, source-status pages, saved lists, Ask and private calculator frames remain excluded. Existing country/choice controls and GA4 measurement ID G-4HQVZL3586 remain. Loading the provider does not guarantee an impression: account approval, Auto ads settings, consent, blockers and Google's inventory decisions still apply.

The detail pages add practical eligibility, commitment, compensation and application guidance beyond source metadata. The original source is credited and linked. No source descriptions are copied into new employer or bounty records. Google's [replicated-content policy](https://support.google.com/publisherpolicies/answer/11190248?hl=en) still applies; ad eligibility is not an approval claim.

## Operate and inspect

```sh
node scripts/opportunities/automation.mjs
node scripts/opportunities/automation.mjs --preview
node scripts/opportunities/automation.mjs --preview --evening
node scripts/opportunities/verify.mjs
node --test apps/opportunities/*.test.mjs
```

The authenticated `/admin/` dashboard includes counts, ingestion cadence and recent LinkedIn status. `/opportunities/sources/` shows source health and a limited public publishing status without personal account identifiers. Neither screen automatically fixes credential expiry or ambiguous publication outcomes. No email alert channel is connected.

Deploy from the repository root without shell tracing:

```sh
set +x
source /root/.config/insightginie/cloudflare.env
node scripts/opportunities/deploy.mjs
```

`cloudflare.json` records the intended LinkedIn enabled state; `--disable-linkedin` overrides it for an emergency deployment. `--enable-linkedin` enables it explicitly. `--ingest` imports all bounded initial batches; `--check-methods` checks all four method groups. Do not use full initial imports as a frequent scheduled job. The Worker only fetches fixed endpoints and seeded method links; there is no arbitrary crawl-URL input.

The private credentials are `/root/.config/insightginie/linkedin.json`, `linkedin-state-key` and `ingest-secret` (0600). Never print their values. After renewed OAuth authorisation, replace the local LinkedIn file, deploy it and deliberately remove only the encrypted `linkedin_credentials` row from `automation_state` if runtime state exists. Preserve `social_posts` to prevent duplicate publishing. Do not delete all state as a credential-reset shortcut.

Graphify is a separate developer architecture tool, not an opportunity generator. Refresh it after source changes using [these instructions](../scripts/graphify/README.md). Graph extraction has documented unresolved external references and collapsed relationships; it is not runtime proof of correctness.

## Release evidence

[Release checks](verification/opportunities-automation-release.json), [live browser verification](verification/opportunities-automation-live.json), [active Cloudflare schedules](verification/opportunities-automation-schedules.json), [Graphify receipt](verification/opportunities-graphify.json), and [secret scan](verification/opportunities-automation-secrets.json). The first real LinkedIn publication is pending the scheduled run, not claimed by QA.

### LinkedIn link preservation (20 October 2026)

All job and creative-method posts place the InsightGinie destination immediately after the headline and repeat it with the closing call to action. Commentary is escaped using LinkedIn little text rules before transmission, including parentheses and brackets that can otherwise truncate rendered text. The 20 October Fresh Prints post was edited in place; LinkedIn returned HTTP 204. See `docs/verification/linkedin-link-fix.json`. Regression coverage checks reserved characters and early destination placement.

### Evening Money Discovery trial (20 October–2 November 2026)

Fourteen original, reviewed posts are queued in `apps/opportunities/data/discoveries.json`. The matching fourteen existing method guides now include the explanation, a practical step and limitations; the original reference is linked on each guide. The post destination appears immediately below the hook. Subjects cover website testing, mock juries, Notion templates, digital-product break-even maths, photography licensing, game assets, research games, tutoring commissions, footage, freelance hourly returns, interviews, audiobook production, print-on-demand and design projects versus contests. Calculations use explicit hypothetical assumptions rather than typical earnings claims.

The queue is editorially researched, not generated from unchecked daily model output. Original provider documentation was reviewed on 20 October. Direct source and destination links must respond successfully before an evening publication. A method must also have a successful source check within two days, and its reference must still match the reviewed queue. A changed, blocked, expired or unavailable source can cause a skipped evening; there is no catch-up burst. Reachability does not establish factual accuracy or available paid work. Several sources initially returned redirects or blocked automated requests; the final queue uses successfully checked references instead. The full queue and live checks are in [the launch receipt](verification/evening-discovery-launch.json).

`social_posts` remains the morning ledger, and `social_discovery_posts` independently claims each evening. Both reuse the existing encryption, token refresh, text escaping, URL validation and ambiguous-publication protections. Morning activity cannot suppress an evening post. `linkedin_evening_enabled` in `cloudflare.json` can disable just the evening slot; `linkedin_enabled` disables both. After 2 November, evening calls return `outside-trial` and publish nothing until reviewed content and dates are deliberately updated. This trial does not automatically renew or research its own replacement queue.

The read-only `/admin/social-preview?slot=evening` previews today's eligible evening item; it never posts. `/v1/automation` includes separate evening schedule, trial dates, enabled state and recent outcomes. The source status page shows separate morning and evening schedules and outcomes; the API and operating script also expose the evening status. Verify with `node scripts/opportunities/verify-evening.mjs` after sourcing the protected Cloudflare environment. That script reads Cloudflare schedules, D1 ledgers, preview and live guide content; it never calls LinkedIn publishing.

### Next SEO work proposed after the evening launch

These are recommendations, not changes shipped in this release. Analytics access remains export-based as agreed. LinkedIn distribution can bring visitors, but engagement alone is not proof of improved Google rankings.

1. **Indexing audit first.** The opportunity detail metadata currently applies `robots: { index: false, follow: true }` to every role (`apps/web/src/app/opportunities/[id]/page.tsx`). Keep thin syndicated listings excluded; enrich a selected set with useful original context and verify eligibility before making them indexable. Audit sitemap coverage for original earning guides and ideas. Google recommends accurate job data, visible matching content, and removing or expiring closed job markup: https://developers.google.com/search/docs/appearance/structured-data/job-posting . Do not blindly add JobPosting markup to every short feed excerpt.
2. **Build useful search landing pages.** Create substantive hubs for remote work by eligibility, paid research, creative services and digital products, with real current results, clear limitations and useful internal links. Avoid a mass of near-identical filter pages. Match titles and descriptions to the page's actual purpose: https://developers.google.com/search/docs/appearance/title-link .
3. **Give guides original value.** Add worked costs, decision checklists, comparisons and visible review/source information. Connect each guide to relevant live opportunities and tools. Audit mobile speed, canonical URLs, broken links and sitemap freshness with appropriate crawl and performance checks. Use exported Search Console queries to prioritise pages with impressions but weak clicks.
4. **Measure the traffic journey.** Add consent-compatible attribution for each LinkedIn post and outbound provider/application clicks without conflicting with the current query-string exclusions. This is analytics work, not a ranking factor; without it, a two-week comparison is limited to exported channel/landing-page results and owner-provided LinkedIn figures.
5. **Off-site assets and outreach preparation.** Produce a transparent snapshot of observed remote-job geography, disclosed pay and contract types, explaining feed coverage, missing data and collection dates. Do not describe it as a census of the whole job market. Create an embeddable useful widget or checklist and prepare targeted pitches for career newsletters, universities and relevant communities. I can research contacts and draft submissions; sending outreach needs explicit instruction. Avoid automated link dropping, paid ranking links or mass directory submissions: https://developers.google.com/search/docs/essentials/spam-policies#link-spam .

Suggested order: indexing audit and guide sitemap coverage, then substantive search hubs and journey measurement, then a useful data asset for off-site promotion. No new Google credentials are required for code audits or these content improvements; Search Console exports improve prioritisation.
