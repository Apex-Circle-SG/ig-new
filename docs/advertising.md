# AdSense integration

Publisher: `ca-pub-8735749779872017`. The publisher ID is public, not a secret.

## Behavior

The supplied asynchronous AdSense script loads once in the document head after
React hydration and after a visitor allows advertising, on these public-information pages:

- `/data/`
- `/data/census-cps/`
- `/methodology/`
- `/methodology/individual-income/`

No financial inputs exist on these pages. The homepage and calculator never load
advertising code. Native document navigation isolates any previously loaded
third-party code from a subsequent calculator session. This deliberately limits
initial ad coverage to preserve the product's financial-input privacy boundary.

The footer exposes Cookie settings. Allow and decline are equally prominent.
The first-party `ig_advertising` cookie stores only `allow` or `deny` for up to
180 days. Withdrawing reloads the document without the provider. Consent choices
do not alter calculator access or results. There is no ad refresh loop, synthetic
traffic, tracking of income bands, or ad-click automation.

`/ads.txt` authorizes Google for this publisher and a `google-adsense-account`
meta tag supports account verification. The site continues to discourage general
search indexing during the preview; advertising crawlers can inspect the public
information routes and ads.txt.

## Publisher account actions

The code does not authenticate to or alter the AdSense account. Verify that
InsightGinie is approved, enable Auto ads, and configure modest in-page formats
in Ads → By site. Disable overlay/anchor/vignette and ad-intent formats to retain
the intended UX. Preview placements before applying account-side settings.
Google decides eligibility, fill and timing; loading its script is not proof of
ad revenue or a visible advertisement. No manual unit was created because the
supplied code has no `data-ad-slot` identifier.

Configure applicable messages in AdSense Privacy & messaging. The local
allow/deny control is a script-loading preference, **not a Google-certified CMP**
or a substitute for TCF consent requirements. Google's European regulations
message provides a certified option for EEA/UK/Swiss traffic. Its configuration
and account approval could not be verified from the supplied publisher ID.

Official references: [Auto ads setup](https://support.google.com/adsense/answer/9261307?hl=en),
[ads.txt](https://support.google.com/adsense/answer/12171612?hl=en),
[publisher CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en),
and [Google's use of partner-site information](https://policies.google.com/technologies/partner-sites).

## Security and rendering

`src/proxy.ts` generates a fresh nonce and CSP for each HTML request, forwarding
the policy to Next.js so framework scripts receive the nonce. Explicit JSON-LD
and AdSense tags also receive it. HTML uses private/no-store/no-transform caching and dynamic
server rendering; do not override this with shared HTML caching in Cloudflare.

Financial pages retain a policy limited to their own origin, with no production
eval permission. Consented advertising pages permit Google's dynamic script
chain, eval and HTTPS advertising resources. Google documents nonce/strict-dynamic
CSP support; a fixed hostname allowlist is not its supported integration.
See [Google's CSP guidance](https://support.google.com/adsense/answer/16283098?hl=en)
and [Next.js nonce guidance](https://nextjs.org/docs/app/guides/content-security-policy).

The AdSense tag includes `data-cfasync="false"` before `src`. Public-domain
verification also found Rocket Loader rewriting Next.js framework scripts.
The `no-transform` response directive preserves the entire nonce-protected HTML
through Cloudflare, so both the provider and the app remain executable without
relaxing CSP. This also disables supported Cloudflare body injections, including
JavaScript Detections; origin compression is preserved. See
[Cloudflare's script exclusion](https://developers.cloudflare.com/speed/optimization/content/rocket-loader/ignore-javascripts/)
and [no-transform behavior](https://developers.cloudflare.com/cache/concepts/cache-control/).

## Operation

The hosted release is built separately in `apps/web/.next-live`. Its systemd
unit sets `NEXT_BUILD_DIR=.next-live`, `NEXT_PUBLIC_ADS_ENABLED=true` and the
publisher ID. Future builds must include the public advertising flag because
Next.js can embed public environment variables at build time.

```sh
NEXT_BUILD_DIR=.next-live NEXT_PUBLIC_ADS_ENABLED=true npm run build
systemctl restart insightginie-web
```

Stop the service before rebuilding its active directory, or prepare another
build directory and verify it before switching. To disable advertising, set the
public flag to false, rebuild and restart. Never infer an account secret from
the publisher ID; no Google account credential is stored in source.

The browser suite intercepts the AdSense script instead of requesting real ads.
It verifies no provider before a choice, withdrawal, fresh nonces, ads.txt, mobile
accessibility and complete document isolation when entering the calculator.
This does not verify the account's approval, CMP setup or actual ad fill.

For the full local browser suite, build with `NEXT_PUBLIC_ADS_ENABLED=true` first.
CI sets that flag explicitly. A separate running build can be tested using
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:e2e`.
