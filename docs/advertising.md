# Advertising operation

Publisher: `ca-pub-8735749779872017` (public identifier).

## Coverage

AdSense is integrated across every route in `PUBLIC_AD_PATHS`, shared with the
reviewed public indexing registry in `packages/seo/src/routes.ts`. The launch
has 13 pages including the homepage, calculator, data explorer and trust pages.
Private tools, embeds, APIs, unpublished authors and error pages never load ads.
Coverage means the publisher tag is eligible to load; it does not guarantee an
impression, approval, advertiser demand or revenue.

The provider starts after hydration. Ad blockers, network errors and disabled
JavaScript do not prevent calculator use. There are no fabricated ad-unit IDs,
forced clicks or ad refresh loops. The supplied snippet enables account-managed
Auto ads. Fixed slots require a real ad-unit ID.

## Regional choices

The server uses Cloudflare's `CF-IPCountry` header, not browser language, URL
parameters or user-entered location. The EEA, UK, Switzerland and unknown regions
wait for a local affirmative choice. Other known regions load ads by default.
A prior `ig_advertising=deny` choice is respected everywhere. The cookie stores
only allow/deny for 180 days; changing it reloads the document.

After the consent gate in required/unknown regions, the integration requests
non-personalized advertising. `Sec-GPC` and browser Global Privacy Control also
trigger a non-personalized request. Google supplies its own applicable regional
privacy processing. The local cookie is **not a certified CMP**. The publisher
must configure applicable Google Privacy & messaging settings; account approval,
Auto ads and messages cannot be managed with a publisher ID alone.

Google currently requires a certified TCF CMP for personalized ads in the
EEA/UK/Switzerland; other eligible treatments still depend on the provider and
required consent. Non-personalized ads are not automatically cookie-free.
[Google CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en),
[personalization code](https://support.google.com/adsense/answer/9042142?hl=en),
[non-personalized ads](https://support.google.com/adsense/answer/9007336?hl=en).

## Financial-input isolation

The homepage renders a clearly labeled, server-calculated public example and
loads `/tools/income/` only after **Try your income**. The full calculator loads
the same tool immediately. Both use an opaque-origin sandbox.
The response's CSP also enforces the sandbox, independently of the iframe
attribute. The sandbox omits `allow-same-origin`; surrounding advertising code
cannot read its income input or result DOM. The document bundles its public
snapshot, styles, React and the shared deterministic engine and makes no network
requests after loading. `connect-src 'none'` and `form-action 'none'` prohibit
outgoing calculator data. `allow-forms` permits the React submit event, while
CSP still blocks native network submission. Inputs have no form names.

Only bounded dimensions, known interaction enums, and the generic share action
cross the frame boundary. No financial values, result snapshots or arbitrary
URLs cross it. Static source links open a separate tab. Reloading clears the
calculation. Tests check parent access, messages, requests, native submissions,
no-JavaScript behavior and recovery after a failed document load.

## Account settings

Verify site approval, enable Auto ads, preview placements and configure regional
messages in the AdSense account. Keep overlay/anchor/vignette and ad-intent
formats disabled if they interfere with the input-to-result flow. Account access
was not supplied to this checkout, so these settings remain unverified.
[Auto ads](https://support.google.com/adsense/answer/9261307?hl=en).

## Hosting and CSP

Next Proxy issues fresh nonces and request-specific CSP. Advertising documents
permit Google's supported dynamic resource chain. Isolated calculator documents
use their own restrictive nonce policy. Public chart embeds have no scripts or
ads. CSP frame-ancestors controls framing; only the tool's same-origin framing
and the deliberately embeddable public chart are permitted.

Calculator documents are compressed at the origin with Brotli or gzip to avoid
sending the uncompressed bundled application. HTML uses
`private, no-store, no-transform`; the latter prevents Cloudflare
Rocket Loader from rewriting the nonce-protected framework. AdSense additionally
uses `data-cfasync=false`. Do not override HTML caching at the edge.
[Google CSP](https://support.google.com/adsense/answer/16283098?hl=en),
[Cloudflare no-transform](https://developers.cloudflare.com/cache/concepts/cache-control/).

Build with `SITE_INDEXABLE=true NEXT_PUBLIC_ADS_ENABLED=true`, prepare a separate
release directory, test, then switch the service. To disable ads, rebuild with
`NEXT_PUBLIC_ADS_ENABLED=false` and restart. The publisher meta tag and ads.txt
provide site verification; the publisher ID is not a secret.
