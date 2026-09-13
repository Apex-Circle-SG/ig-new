# Consent-controlled first-party aggregate analytics

Optional usage analytics are **off by default**. Collection requires both a
configured `ANALYTICS_DIRECTORY` and the visitor's explicit
`ig_analytics=allow` choice in the footer. The preference cookie contains only
allow/deny and lasts up to 180 days. Do Not Track or Global Privacy Control
overrides an allow choice. Declining analytics never disables a tool or Ask.

This document describes implemented collection boundaries. Runtime enablement,
maintenance and external monitoring require their own deployment evidence.

## What is counted

`PageAnalytics` starts after page load on reviewed public routes, derives a fixed
route ID from the shared SEO registry and configures the first-party provider
only with consent. It counts a page view once per mounted page, including when
consent is granted after load. Query parameters are not included. The browser
may classify a recognized search-engine referrer locally as `organic_landing`;
only that fixed event is sent, never the referring host, URL or query.

Requests to `/api/events/` omit cookies and referrers. The client reads the
analytics preference locally and sends the fixed
`X-InsightGinie-Consent: allow` header; the server also rejects collection when
DNT/GPC request headers are present. This is a collection gate, not a user
identity or tamper-proof consent receipt.

Only these dimensions are accepted:

- `event`: `page_view`, calculator view/start/completion/share/related-tool
  events, `tool_exported`, `article_engaged`, `organic_landing`,
  `ask_answer_cited`, `ask_fallback` or `ask_refusal`. The exact names are
  allowlisted in `packages/analytics/src/index.ts`.
- `route_id`: a fixed reviewed public-route identifier from
  `packages/seo/src/routes.ts`, never a raw URL.
- `calculator_id`: a historical field name containing an allowlisted
  experience ID: the income tool, one of six finance tools, `ask`, `insights`
  or `research`.
- `interaction`: optional `form`, `example`, `what-if` or `copy-link`.

The isolated calculators relay only validated interaction enums to their parent,
which reconstructs safe events. Income, result values, exports and arbitrary
strings never cross this analytics boundary. An export event records only that
an export occurred; it does not include the downloaded file. Ask usage events
contain no question, answer or numeric example. Event names are permitted
vocabulary, not a claim every route emits every event.

The track boundary, network provider and server independently allowlist fields.
The server rejects unknown fields and invalid enum values. It stores no profile
IDs, financial values, country, IP, raw URL, cookie, search term, device ID or
event-by-event timestamp.

## Storage and retention

Set `ANALYTICS_DIRECTORY` to a private writable directory outside the repository,
for example `/var/lib/insightginie/analytics`. With no directory, collection is
disabled and the endpoint returns 204 without storage. Each UTC day's JSON file
contains only a date and counters, for example:

```json
{
  "day": "2026-09-13",
  "counts": {
    "home|page_view||": 12,
    "home|calculator_completed|individual-income-percentile|form": 3
  }
}
```

Writes are serialized within one Node process and use atomic replacement.
Directories are created with mode 0700 and new files with 0600. Corrupt current
files are preserved and yield a collection error until repaired or archived;
measurement failures never block calculator results.

Retention keeps the current UTC day and previous 29 dates. Successful analytics
writes prune expired daily files. The supplied daily maintenance command,
`scripts/operations/prune-analytics.mjs`, prunes both analytics and operations
directories, including when usage has stopped. It touches only regular files
with valid daily filenames. The persistent
`insightginie-analytics-prune.timer` must be enabled and verified by deployment;
do not infer active maintenance from the template alone. Remove old files when
decommissioning collection. Multiple writer processes require a shared
transactional counter store before horizontal scaling.

## Essential operations and optional Datadog export

Service-health collection is separate from optional browser analytics. When
`OPERATIONS_DIRECTORY` is configured, the server records only daily totals for
`ask_answer`, `ask_refusal`, `ask_fallback`, `ask_error`,
`feedback_source`, `feedback_unclear`, `feedback_unsafe`,
`ingest_success`, `ingest_failure` and `datadog_delivery_failure`.

These essential operational totals do not require the optional analytics cookie.
They contain no visitor question, answer, identity or financial value and use
the same 30-UTC-day retention policy through daily maintenance. Availability of a
counter does not imply every subsystem has produced data for it.

The optional Datadog exporter reads current-day operations totals only. It does
not read browser analytics files. Explicit server configuration permits ten
fixed cumulative daily gauge series, with service/environment tags and no
per-visitor dimension. Gauges must not be summed across repeated exports to
derive event totals. Datadog account retention and metric allowances are separate
from local file retention. See [observability](observability.md) for intake,
timeouts, scheduling and remaining access evidence. Bits is not part of usage
analytics and receives no visitor prompts.

## Abuse controls and interpretation

The usage endpoint accepts at most 1,024 JSON bytes, checks Origin and
Sec-Fetch-Site, bounds request-body reading to five seconds and permits at most
100 active readers and 100 queued writes. Temporary in-memory rate limits allow
60 requests per minute per edge-supplied address with at most 5,000 buckets.
Addresses are neither persisted nor logged by this collector. Without the edge
header, requests share an unknown bucket. Revisit this trust boundary before
exposing the origin outside the Cloudflare tunnel.

Tests in `tests/unit/analytics-collection.test.ts` cover consent/privacy signals,
field rejection, browser transmission, concurrency, limits and retention.
`scripts/operations/prune-analytics.test.mjs` checks retention boundaries and
preservation of unrelated files, directories and symbolic links.

Counts describe consented events, not unique visitors, individual journeys,
complete organic traffic or conversion funnels. Repeat visits, bots, consent
selection, request failures and browser blocking affect them. Essential Ask
totals and optional Ask usage counts have different populations and must not be
added together. Search Console/Bing reports, returning-user measurement and
AdSense earnings require separate authorized sources; no revenue or organic
growth claim can be derived from these totals alone.
