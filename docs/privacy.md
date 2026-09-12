# Privacy design and release requirements

The anonymous income calculator keeps inputs and results in React memory only. It sends no financial values over the network and stores no financial values in cookies, localStorage or sessionStorage. Link sharing copies the public calculator URL with no parameters. The Playwright suite inspects requests and storage and verifies reset after reload.

Advertising uses a separate `ig_advertising` cookie holding only an allow/deny
choice for 180 days. AdSense loads only after opt-in on public source/methodology
pages. Calculator pages never load the provider; full document navigation clears
provider scripts when entering a tool. See [advertising](advertising.md) for the
page allowlist, withdrawal behavior and Google account-side CMP requirements.

The database account/profile/scenario tables are infrastructure only, deny access to ordinary roles, and are not connected to web routes. Do not enable them before authentication, encryption key management, owner-authorized access, export/deletion, retention, session/security testing and clear user consent. No sensitive data may enter analytics, advertising or LLM requests by default.

Production prerequisites: identify operating entity, configure a real support/privacy channel, disclose hosting-specific log processing and retention, finalize terms through appropriate human review. These facts are unavailable from the supplied environment. Preview pages explicitly describe the implemented behavior and pending configuration. The site stays noindex pending release.
