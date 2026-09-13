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

## Nonces and advertising isolation

Public HTML receives per-request nonce/strict-dynamic CSP and no-store/no-transform.
AdSense is permitted on reviewed public documents subject to regional choices.
Personal calculator inputs/results run in an opaque-origin sandbox, enforced
both by iframe attributes and the response CSP. No allow-same-origin is granted.
The tool has no network access, cookies or storage; CSP form-action none blocks
native submissions even though allow-forms is needed for React submit handling.
Only bounded frame size, fixed event enums and generic sharing messages pass to
an exact parent/child window. Source links are static and open separate tabs.
See [advertising](advertising.md) for the supported provider/CSP boundary.

The aggregate analytics endpoint is the only new public write endpoint. It
accepts a small strict schema of known events/route IDs, enforces same-origin
browser metadata, limits bodies and request rates, and writes daily counters.
No financial input, raw URL, IP or user identifier is persisted. The deployment
uses a dedicated state directory and independent daily retention maintenance.
See [analytics](analytics.md) for scope and operating limits. This lightweight
single-host counter is not an authenticated profile or general telemetry API.
