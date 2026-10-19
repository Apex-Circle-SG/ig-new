# Opportunities hub release — 19 October 2026

Cloudflare D1 and a dedicated Worker now power the opportunity catalog. The Next.js site reads the public API; Cloudflare management credentials stay outside the frontend and repository.

## What is included

- 181 recent remote roles at initial verification, refreshed automatically from Jobicy, Arbeitnow and Remote OK.
- 21 earning-platform profiles, clearly separated from available paid tasks.
- 60 original, unvalidated business experiments, including funny and creative ideas. These ideas are static editorial seeds, not automatically generated paid opportunities.
- A register of 33 researched source channels; only three have live adapters. Remaining sources need access/permission review and implementation.
- Server-rendered keyword, location, source and listed-pay filters, pagination, original source links, RSS and browser-local bookmarks.
- Source status, update history and honest eligibility/pay disclosures. No guarantee of acceptance, earnings, source completeness or worldwide eligibility.

The hourly cron rotates one source at minute 17. Each provider is fetched once every three hours in bounded, rotating batches. Records unseen for seven days leave active search. The API remains portable through an environment-configured endpoint and SQL/JSON data exports.

## Analytics and advertising

GA4 uses the owner-supplied measurement ID **G-4HQVZL3586**. The tag endpoint returned JavaScript successfully. Browser tests verify opt-in, manual pageview commands, withdrawal and private-page exclusions using intercepted requests, without sending artificial pageviews to the property.

Live verification loaded the real Google tag after consent and Google accepted the pageview for G-4HQVZL3586 with HTTP 204. This confirms transport, not GA4 dashboard receipt. The Google-served tag also contains destination G-DRNHRZSYP2 and sent an automatic scroll event to it. That ID is absent from the site source and comes from the supplied tag’s Google-side configuration. Review connected destinations and Enhanced Measurement in Google Admin if that destination is unintended. See [live verification](verification/opportunities-live.json).

Existing consent to anonymous first-party counts does not opt visitors into Google Analytics. Google Analytics requires the updated consent. Ask, private tools, saved lists and query-string pages do not load it. Private calculator frames remain isolated.

AdSense publisher **ca-pub-8735749779872017** is preserved on existing approved inventory. The new opportunity, idea and platform surfaces are excluded pending review. AdSense consent is managed separately.

GA4 dashboard receipt and ownership cannot be verified from the measurement ID. In GA4 Admin, check Realtime after allowing analytics on a public page. Review Enhanced Measurement: disable browser-history pageviews and automatic form/site-search collection because explicit pageviews are sent by the site.

## Validation and limits

See [API checks](verification/opportunities-api.json), [release checks](verification/opportunities-release.json), [secret scan](verification/opportunities-secret-scan.json), and [lab Lighthouse results](verification/opportunities-lighthouse-summary.json). Visual snapshots were reviewed for mobile and desktop. Lab performance ran amid concurrent tests and scored 60–69; accessibility, best practices and SEO scored 100. This is not field Core Web Vitals evidence or a traffic/revenue forecast.

Production dependency audit is clean after updating Next.js to 16.4.2, Sharp and source-map-js. Five high-severity development-only audit entries remain in the lint tooling dependency chain; no compatible automated fix is available, and a breaking downgrade was not applied. The previous Next.js version was flagged; advisory: https://github.com/advisories/GHSA-vcvr-r3jv-pc5j.

Email alerts, accounts, marketplace payments, paid placement, additional ingestion adapters, automated idea generation and revenue reporting are not implemented. Individual mirrored role details are noindex initially. Source terms, expired listings and ingestion errors still need periodic operational review. This deployment does not establish a fully unattended business or guaranteed traffic.

Operations, recovery and migration notes: [catalog README](../apps/opportunities/README.md).
