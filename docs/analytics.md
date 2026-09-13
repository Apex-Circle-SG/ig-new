# First-party aggregate analytics

InsightGinie measures public page views and calculator use without analytics
cookies, user/session IDs, income values or third-party analytics scripts.
Collection is optional: if `ANALYTICS_DIRECTORY` is absent, the client provider
is disabled and `/api/events/` returns 204 without storing anything.

## What is counted

The client `PageAnalytics` component starts after page load on reviewed public
routes. It converts the pathname to a fixed route ID from the shared SEO registry;
it never reads query parameters for collection. Requests use same-origin `fetch`
with cookies omitted and no referrer.

Accepted dimensions are:

- `event`: `page_view`, `calculator_view`, `calculator_started`,
  `calculator_completed`, `calculator_result_shared`, or
  `related_calculator_clicked`.
- `route_id`: a reviewed fixed identifier, such as `home` or
  `calc:individual-income-percentile`.
- `calculator_id`: only `individual-income-percentile`, for calculator events.
- `interaction`: optional `form`, `example`, `what-if` or `copy-link`.

The isolated calculator sends only enumerated interaction events to its parent,
which reconstructs safe properties for the provider. Financial inputs and result
values remain inside the tool. Page view and calculator view are emitted once by
the public-page component; the old separate `ViewEvent` must not also be mounted.

The existing `track` boundary and the network provider both allowlist properties.
The server independently rejects unknown fields or invalid combinations instead
of silently storing them. No profile IDs, numeric income, geographic data, IP
addresses, raw URLs or event-by-event timestamps are written to analytics files.

## Storage and retention

Set `ANALYTICS_DIRECTORY` to a writable directory outside the repository, for
example `/var/lib/insightginie/analytics`. One JSON file per UTC day contains
only that day and aggregate counter totals. A key describes route, event,
calculator and interaction; it cannot identify a person or session.

Example shape:

```json
{
  "day": "2026-09-13",
  "counts": {
    "home|page_view||": 12,
    "home|calculator_completed|individual-income-percentile|form": 3
  }
}
```

Writes are serialized within the web process and atomically replace each daily
file, avoiding lost increments and partially written JSON. Directories use mode
0700 and new files 0600. A corrupt current-day file is preserved; collection
returns 503 until operations repairs or archives that file. Event failures never
block calculator results.

Every successful write removes dated aggregate files older than the latest 30
UTC calendar days. Independent daily maintenance at 00:15 UTC also removes expired
files when traffic stops or collection cannot write. The persistent systemd timer
`insightginie-analytics-prune.timer` catches up after downtime; it invokes
`scripts/operations/prune-analytics.mjs` and touches only regular files with valid
daily filenames. Today and the previous 29 dates are retained. Operators should
delete the directory when disabling collection and removing its data.
This implementation is for the current single-process
Node service. A horizontally scaled deployment must use a shared transactional
counter store before enabling concurrent writers.

## Abuse controls

The endpoint accepts JSON POST bodies of at most 1,024 bytes. It checks the Origin
and Sec-Fetch-Site headers, permits only reviewed route IDs, and rejects unknown
fields. It returns no aggregate data to callers and sets no-store/noindex headers.

Cloudflare’s connecting IP is used only as a temporary in-memory rate-limit key:
60 requests per minute, at most 5,000 keys, with timed expiry. It is never persisted
or logged by this collector. When the header is unavailable, requests share the
`unknown` bucket. The service trusts this header only because its public entry is
the existing Cloudflare tunnel; revisit that trust if exposing the origin directly.
A maximum of 100 active request-body readers, a five-second body deadline with
cancellation, and a bounded write queue prevent unchecked pending work.

## Tests and practical limits

`tests/unit/analytics-collection.test.ts` checks concurrent increments, strict
payload rejection, oversized bodies, cross-origin rejection, rate limits,
retention, corruption recovery and the browser’s cookie/referrer/property boundary.
Existing analytics tests continue to enforce property filtering.
Run `node --test scripts/operations/prune-analytics.test.mjs` to verify the
retention boundary, missing configuration and preservation of unrelated files,
directories and symbolic links.

These counters measure events, not unique visitors, attributable journeys or
conversion funnels. Refreshes, bots, network failures and browser blocking can
affect counts. Completion events can be compared with calculator views as a
rough operational measure, but cannot establish that the same people completed
the tool. Return visits, ad revenue and search performance remain unavailable
until a suitable separately reviewed measurement source is connected.

Search Console/Bing data are separate integrations requiring authorized account
access. Do not substitute these counters for indexation or revenue reports.
