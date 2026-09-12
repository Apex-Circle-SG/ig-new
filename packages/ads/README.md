# ads

Google AdSense integration for publisher `ca-pub-8735749779872017`.

`NEXT_PUBLIC_ADS_ENABLED=true` enables the integration. `ADSENSE_CLIENT_ID` may
override the public publisher identifier. The supplied asynchronous script is
loaded once in the document head after an advertising choice on the allowlisted
public data/methodology pages. A first-party cookie stores only allow/deny for
180 days; withdrawing reloads the document to remove loaded provider code.

Calculator pages and the homepage never load the provider. Internal navigation
uses fresh documents so third-party scripts cannot follow users into financial
tools. `/ads.txt` and the account verification meta tag identify the publisher.

The supplied snippet enables Auto ads. Ad serving and placement are controlled
in the publisher's AdSense account; no ad-unit ID was supplied, so no manual unit
is created. `AdSlot` remains a reserved-dimension boundary for future manual units.

See [advertising operations](../../../docs/advertising.md) for account setup,
consent limitations, CSP behavior, validation and disabling instructions.
