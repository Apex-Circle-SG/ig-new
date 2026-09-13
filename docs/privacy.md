# Privacy boundaries and remaining requirements

Updated 2026-09-13. This document describes the implemented product and data
boundaries. It is not a legal opinion, deployment receipt or assertion that
external account settings have been verified.

## Browser calculators and intentional exports

The income calculator and six finance tools keep personal inputs and results
inside an opaque-origin sandboxed document, in browser memory. The public page
cannot read the frame's financial fields. Restrictive CSP blocks outgoing
calculator requests and native form submissions. Reloading resets the scenario;
no financial values are placed in URLs, cookies, localStorage or sessionStorage.

Only bounded frame dimensions, known interaction enums and requests to copy a
generic public tool link leave the frame. Share links contain no scenario
parameters. Finance tools can create a local CSV or print view when explicitly
requested; those copies can contain user inputs and are the visitor's files.
Analytics records at most an export enum, never the file or its values.

## Ask is a different, explicit submission

Questions entered at `/ask/` are sent to the InsightGinie server for transient
approved-source retrieval and narrow deterministic calculations. A person may
intentionally state a number in a question, so the calculator's no-network-input
promise must not be applied to Ask. The application does not retain or log raw
questions, answers or numeric examples. The current browser conversation is
memory-only and resets on reload.

Ask never invokes an external generative model or Datadog Bits. Requests use an
essential ten-minute `ig_ask_security` cookie and a signed request token. The
cookie is HttpOnly, SameSite=Strict and Secure on HTTPS. It is used for request
validation, not analytics. IP-derived abuse buckets are process-key HMACs kept
only in bounded memory. Feedback sends only an issue-category enum, without the
question or answer. See [the Ask contract](genie.md).

## Consent and cookies

| Cookie            | Purpose                                                      | Lifetime and behavior                                                                                                   |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `ig_analytics`    | Optional first-party usage-count preference, allow/deny only | Up to 180 days; collection is off until allowed and remains off under DNT or GPC; changeable through Analytics settings |
| `ig_advertising`  | Advertising preference, allow/deny only                      | Up to 180 days; decline is honored globally and changes reload the document                                             |
| `ig_ask_security` | Essential Ask request validation                             | Ten minutes; scoped to Ask API requests, with no question or financial value                                            |

Optional analytics also requires server configuration. Event requests omit
cookies/referrers and contain only allowlisted public-route, experience,
interaction and event enums. A search-engine landing can be classified locally;
the referring URL and query are not transmitted. No visitor/session identifiers,
income, answer text or browsing history are stored.

Daily optional usage totals and essential service-health totals are separate.
Both use private files retained for the current UTC day and previous 29 dates.
The maintenance command covers both directories; deployment must verify its
timer. Essential operations count answer/refusal/fallback/error and issue
categories without optional analytics consent. They do not retain conversations
or identities. [Analytics documentation](analytics.md) defines the schema and
limitations.

## Advertising and telemetry providers

Eligible public pages, including calculator shells, can load Google AdSense.
The private tool frames, Ask conversation, admin/API routes and nonpublished
content are excluded. Known regions outside the EEA, UK and Switzerland normally
load ads unless declined. Required or unknown regions wait for an affirmative
choice. Non-personalized requests are used after that consent gate and when GPC
is present. The local preference is not a certified CMP; the publisher still
needs applicable Google Privacy & messaging settings and account review.

Google may process ordinary device, network, page-context and cookie information
for advertising. The isolation boundary prevents the surrounding provider from
reading calculator inputs/results. Withholding an advertising choice does not
remove access to the tools. A provider's approval, actual fill, regional messages
and placements require account-side evidence. No claim of universal impressions
or verified legal compliance is made here.

The optional server-only Datadog exporter accepts ten fixed service-health
counters, uses no browser SDK and sends no raw question, URL, IP, cookie,
financial value or identifier. It reads operations totals, not optional browser
analytics. Local 30-day deletion does not delete samples already accepted by
Datadog; provider retention must be reviewed separately. APM, RUM, session replay,
Sensitive Data Scanner and Observability Pipelines templates do not establish
active integrations. The private Bits adapter defaults off with zero budget and
is separate from public Ask. See [observability](observability.md).

## Hosting, content and access

Ordinary website delivery sends requested paths, network and browser metadata to
hosting/edge infrastructure, including Cloudflare. The application does not save
individual access histories or request bodies. Host/edge logging and retention
still require an operator-specific inventory; application data minimization does
not imply that infrastructure receives no IP address.

WordPress sync reads public source material, including original author names,
dates and media references. The current two-post migration preview preserves
original blog canonicals and is noindex. These public-source snapshots are not
visitor profiles, a full backup or a completed migration. Editorial attribution
does not certify the original author's qualifications or content accuracy.

The protected operations area uses configured server credentials and exposes
aggregate/status information, not conversations. Accounts, saved financial
profiles/scenarios and email reports are not connected to public user flows.
Database tables alone do not implement authentication or user data rights.

## Remaining operator and review work

Confirm the legal operating entity, a private support/privacy contact, provider
retention and hosting logs, applicable consent/CMP settings and human legal
review. The public Contact route currently offers GitHub reporting; reports
must not include confidential information. Do not invent a private email address
or claim professional/trademark clearance.

Before accounts, email reports or persisted profiles are enabled, implement
ownership controls, encryption/key management where appropriate, data export,
deletion, retention, session/security tests and clear consent. No stored
financial profile exists in the current public product. Further collection
requires updated disclosures and verification. Remaining dependencies are
recorded in [MANUAL_REQUIRED.md](../MANUAL_REQUIRED.md).
