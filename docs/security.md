# Security

## Current boundary

The initial site serves public, versioned Census data and runs anonymous
calculations in the browser. It does not expose account, profile-save, chat,
payment, email-send or admin mutation endpoints. Private financial input must
remain out of URLs, application logs, analytics, ad calls and persistent storage.
Public tool links contain no entered values.

The web configuration owns security headers and the content security policy.
Production uses HTTPS; staging remains non-indexable. Input schemas reject invalid
numbers, and calculator output is plain text/structured data rather than raw HTML.
SEO structured data must escape content before embedding it in HTML.

## Secret handling

`.env` and environment-specific secrets are ignored by Git. `.env.example` contains
names and safe defaults only. Do not print credentials while debugging. Runtime
and CI logs must not include database URLs, access tokens, full provider errors or
financial values. Rotate a credential immediately if it appears in Git history;
deleting the latest file does not remove an earlier disclosure.

The CI PostgreSQL service is disposable and uses trust authentication only on its
isolated runner. It holds synthetic verification fixtures. This configuration must
never be copied to hosted or production databases.

## Database controls

Use parameterized queries and transactions through Drizzle/Postgres.js. Schema
constraints enforce source provenance, valid counts, version uniqueness, publication
approval and redirect dispositions. The migration enables and forces row-level
security without policies on the reserved private tables. Runtime roles must not
be superusers or have `BYPASSRLS`. Separate migration, public-read and future
authenticated-write roles.

Ciphertext fields are schema placeholders. Encryption at rest, authenticated
encryption with managed keys, key rotation, account sessions, CSRF protection,
ownership checks, export and deletion are not implemented. Do not activate private
persistence until those controls have been tested against cross-account access.

## Before adding externally callable writes

Add server-side validation, request/body limits, durable rate limits, origin/CSRF
checks for cookie-authenticated writes, secure rotating sessions, bot protection
where warranted and an audited authorization decision. Use a supported identity
provider; do not invent password storage. Admin publishing needs authenticated
approvers plus explicit batch approval. Turnstile is an optional integration,
not an implemented control merely because an environment variable exists.

## Vulnerabilities and incidents

CI runs `npm audit --audit-level=moderate`. Inspect and fix material findings; do not
mask an audit failure with `continue-on-error` or unreviewed forced upgrades.
Dependency audits complement review and runtime monitoring; they do not establish
that the application is vulnerability-free.

The 2026-09-12 audit reported zero vulnerabilities after setting the esbuild
override to the patched `^0.28.2` line. Drizzle schema generation, migration replay
and all 33 database integration assertions passed with that override. Do not
expose a development tool server or use the audit command's proposed breaking
dependency downgrade without reviewing its effects. Re-run the audit on updates.

For a suspected disclosure, disable the affected integration, preserve restricted
logs, rotate credentials, determine scope, patch and verify before re-enabling.
Record an incident timeline without copying user financial data. See the
[operations runbook](operations-runbook.md) for publication rollback and ownership.

## Static-rendering CSP tradeoff

The current CSP restricts resources to this origin and denies embedding, objects,
external form actions, camera, microphone and location. Inline script/style
permission supports Next.js static hydration. This is not a strict nonce-based
CSP. Before enabling account or administrative pages, implement and verify their
per-request nonce policy along with the other authenticated controls.

Financial controls are disabled until hydration and have no named form fields.
Even a native submission after JavaScript failure cannot serialize income into a
GET URL. Browser regression tests cover normal use, disabled JavaScript and failed
chunk loading.
