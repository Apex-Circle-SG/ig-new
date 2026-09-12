# Privacy design and release requirements

The anonymous income calculator keeps inputs and results in React memory only. It sends no financial values over the network and stores no cookies, localStorage or sessionStorage. Link sharing copies the public calculator URL with no parameters. The Playwright suite inspects requests and storage and verifies reset after reload.

The database account/profile/scenario tables are infrastructure only, deny access to ordinary roles, and are not connected to web routes. Do not enable them before authentication, encryption key management, owner-authorized access, export/deletion, retention, session/security testing and clear user consent. No sensitive data may enter analytics, advertising or LLM requests by default.

Production prerequisites: identify operating entity, configure a real support/privacy channel, disclose hosting-specific log processing and retention, finalize terms through appropriate human review. These facts are unavailable from the supplied environment. Preview pages explicitly describe the implemented behavior and pending configuration. The site stays noindex pending release.
