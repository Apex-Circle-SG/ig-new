# AdSense delivery and verification

Date: 2026-09-12. Publisher: `ca-pub-8735749779872017`.

## Delivered

- The supplied asynchronous, crossorigin AdSense loader, account verification
  meta tag and `/ads.txt` with the correct Google seller identifier.
- Auto ads support on opted-in public data/methodology pages. The provided code
  contains no manual ad-unit ID; no slot ID was fabricated.
- Allow/decline choices, a 180-day preference cookie and withdrawal by reload.
- Fresh nonce CSP, uncached dynamic HTML and complete document navigation to
  isolate financial tools from previously loaded advertising scripts.
- A separate `.next-live` production build and systemd configuration, preserving
  the previously running application while the new build was tested.

Public-domain verification exposed a Cloudflare Rocket Loader conflict with
nonce CSP. The AdSense tag now opts out of rewriting and all HTML carries
`no-transform`, preserving the framework scripts too. The provider and complete
calculator flow were then rechecked through the actual Cloudflare tunnel.
Starting the provider after React hydration also prevents its DOM changes from
interrupting application startup.

## Verified

ESLint and TypeScript pass. All 43 calculator/ingest/privacy/quality unit tests
pass. All 19 Playwright checks pass (53.5 seconds), including the original mobile
and calculator regressions plus advertising consent, withdrawal, script
isolation, ads.txt and nonce checks. A footer touch-target spacing issue found
by axe was fixed before release. The dependency audit reported zero vulnerabilities.
After the Cloudflare and startup corrections, all five targeted browser checks
passed again (13.1 seconds).

The final real-browser check of `https://insightginie.com` returned HTTP 200 for
the public information page, Google's supplied script and ads.txt. The calculator
returned 74.7% for $75,000, with no provider script present and no JavaScript
runtime errors across the flow. This verifies integration, not advertisement fill.

See [browser results](verification/ads-playwright-summary.txt),
[final regression checks](verification/ads-final-smoke.txt),
[public-domain verification](verification/ads-public-browser.json),
[mobile advertising choice](verification/advertising-choice-mobile.png), and
[mobile Lighthouse measurements](verification/ads-lighthouse-summary.json).
Lighthouse measures lab behavior, not real-user p75 Core Web Vitals. The financial
pages tested do not load ads; performance of actual filled ads remains dependent
on the publisher account and Google's creatives.

The final simulated-mobile run scored 80 for homepage performance and 89 for
the calculator, with accessibility and best practices both 100 and CLS 0 on
both pages. Homepage LCP was 2.61 seconds, slightly above the 2.5-second target;
calculator LCP was 1.87 seconds. These are single local lab observations. The
homepage needs further performance work and real-user measurement; switching
to nonce-based dynamic rendering also removes shared HTML caching.

## Account-side limits

The publisher ID is not an account credential. Approval, Auto ads settings,
Google Privacy & messaging/CMP configuration, ad fill and revenue cannot be
verified or modified with it. The local cookie choice is not a certified CMP.
See [advertising operations](advertising.md) for the exact page allowlist,
account actions and official provider documentation.
