# Privacy-safe Datadog operations

Implemented and locally tested 13 September 2026. This implementation work made
read-only availability checks, with no metric submissions or workflow executions.
Deployment is preparing one approved current-day aggregate submission followed
by the five-minute metrics timer only if intake returns HTTP 202. **Runtime
activation evidence is pending and must be recorded separately. Bits remains
disabled with a zero execution budget.** No dashboard, monitor, SDK or pipeline
has been activated by these files. Templates are configuration proposals, not
evidence of active Datadog products. Existing access evidence is in
[the Bits requirements record](datadog-bits-requirements.md).

## Verified and unresolved access

A read-only workflow request returned HTTP 200 on AP1 at
`2026-09-13T08:10:42.314Z`. The new adapter successfully checked the published
single-agent workflow shape, configured agent match, string `question` input and
string `answer` output. This check performed zero writes and zero executions.
The earlier explicitly authorized synthetic execution remains separate evidence;
it does not establish recurring capacity or complete account governance.

| API or service                                                            | Required access                                    | Current evidence                                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| API-key validation                                                        | API key                                            | Earlier receipt: HTTP 200, valid key                                                  |
| Key-pair validation                                                       | API and application keys                           | Earlier receipt: HTTP 200, valid pair                                                 |
| Selected workflow and instance reads                                      | `workflows_read` and resource access               | Live read HTTP 200; earlier instance retrieval succeeded                              |
| Selected workflow execution                                               | `workflows_run` and resource/connection access     | Earlier authorized synthetic execution succeeded; disabled in this adapter by default |
| Workflow cancellation                                                     | Workflow run access and applicable resource access | Documented request implemented and mocked; not live tested                            |
| Metrics intake `/api/v2/series`                                           | API key; application key is not sent               | Local payload validation passes; live intake verification pending                     |
| APM, Error Tracking, RUM, Sensitive Data Scanner, Observability Pipelines | Product-specific configuration and entitlements    | Unverified; no SDK, agent, pipeline or remote product activated here                  |

This table records observed endpoint capabilities, not a complete enumeration of
all scopes held by the supplied key. No documented validation-only metrics
endpoint was identified. A local dry run checks shape and privacy boundaries;
only an actual approved submission can establish intake acceptance. HTTP 202
does not establish an included billing allowance or dashboard visibility.

The following still need operator/account verification:

- A restricted production service account. The last recorded execution identity
  used a personal initiator; this implementation does not replace that identity.
- The agent’s internal tool allowlist, instructions, model, retention controls,
  and credit usage ceiling. A single Run Agent workflow step does not prove the
  agent itself has no tools.
- Available AI Credits and a confirmed spending policy. Local reservations do
  not read live billing or guarantee the provider will charge at most a reservation.
- Custom-metric ingestion/billing, APM/Error Tracking, RUM, Sensitive Data Scanner
  and Observability Pipelines access. Workflow access does not imply entitlement
  to these products. No monitoring write was used to probe availability.
- Workflow cancellation permission and terminal behavior in the account. The
  implementation and mocks exercise the documented cancellation request; the
  request has not been executed against the configured workflow.

## Aggregate metrics

`scripts/observability/metrics.mjs` reads only the current UTC day from
`OPERATIONS_DIRECTORY/YYYY-MM-DD.json`. The input must have exactly `day` and
`counts`; accepted counters are `ask_answer`, `ask_refusal`, `ask_fallback`,
`ask_error`, `feedback_source`, `feedback_unclear`, `feedback_unsafe`,
`ingest_success`, `ingest_failure` and `datadog_delivery_failure`.

Unknown keys, invalid dates, negative/non-integer/oversized counts, non-regular
files, symbolic links and oversized files fail before export. First-party visitor
analytics files are deliberately not included in this exporter: their route/event
keys do not pass the operations schema. No raw prompts, answers, financial values,
request URLs, IPs, cookies, identifiers, exceptions or headers enter a metric.

The exporter sends ten `insightginie.operations.<counter>.daily` **gauge** series
to the official `/api/v2/series` endpoint. Each is the current cumulative daily
total, not a per-interval count or rate. Gauges prevent repeat exports from
artificially multiplying counts. They reset with a new UTC day; do not sum gauge
samples to calculate event totals. Fixed service/environment tags avoid per-user
or per-day cardinality. Missing data are reported as `no_data`, not invented zero
measurements. [Datadog metric submission](https://docs.datadoghq.com/api/latest/metrics/submit-metrics/).

`DD_METRICS_ENABLED=true` is required. Requests have a five-second timeout, a
16 KiB outbound maximum and a 64 KiB response cap. The exporter makes at most two
attempts, retrying once after one second only for HTTP 429/502/503/504. A private,
atomic state file enforces at least five minutes between attempts across process
restarts. Only one exporter holds the state lock. HTTP 202 means accepted by the
intake API; dashboard visibility still needs verification.

Run manually only after configuring and authorizing the integration:

```sh
node scripts/observability/metrics.mjs
```

The command prints a status and fixed error code, never a request/response body
or credentials. A failed export exits nonzero. The root operations layer can
record `datadog_delivery_failure` after a failed invocation; this exporter does
not concurrently mutate the application’s daily operation files.

## Server configuration and optional scheduling

Use [the server environment template](../deploy/datadog/server.env.example).
Keep real keys outside Git, for example in `/etc/insightginie/datadog.env` with
mode 0600. The scripts read their process environment; they do not automatically
load the repository `.env`. `DD_REGION` maps explicitly to an approved Datadog
site, including `AP1` → `ap1.datadoghq.com`. A conflicting `DD_SITE` fails closed.
`DD_AGENT_ID` aliases `DD_BITS_AGENT_ID`; conflicting values are rejected.

`OBSERVABILITY_STATE_DIRECTORY` must be an absolute private directory. Atomic
state and lock files use mode 0600. State contains only attempt timestamps and
budget counters, not API keys or workflow answers. A crash can leave a lock;
inspect running processes and any workflow instance before manually removing a
stale lock. Do not automatically clear an ambiguous lock and create another run.

The optional [metrics service](../deploy/datadog/insightginie-metrics.service) and
[timer](../deploy/datadog/insightginie-metrics.timer) require deployment activation
after a successful aggregate submission; that runtime receipt is pending.
They run at most once every five minutes and default to disabled export. The unit
reads operation files and has write access only to its private state directory.
No timer or recurring inference command is provided for Bits.

## Private Bits adapter

`runPrivateBitsTask(task, options)` in `scripts/observability/bits.mjs` accepts only:

- `{kind: 'synthetic-health'}`: a constant marker request without data or tool use.
- `{kind: 'aggregate-triage', aggregate: {day, counts}}`: the same strictly
  allowlisted operation totals described above.

There is no public endpoint, arbitrary prompt argument, user/URL context or
automatic job loop. `/ask/` must not import or invoke this adapter. A model
response cannot authorize a deployment, ticket, message, content publication or
other external action. It returns only fixed severity/counter/check categories
after strict validation; raw generated prose is discarded and never logged.

Execution requires all of:

```dotenv
DD_BITS_ENABLED=true
DD_BITS_WORKFLOW_REVIEWED=true
DD_BITS_BUDGET_CONFIRMED=true
DD_BITS_MAX_MONTHLY_RUNS=<positive approved run cap>
DD_BITS_MONTHLY_CREDIT_BUDGET=<positive approved credit budget>
DD_BITS_RESERVED_CREDITS_PER_RUN=<positive conservative reservation>
```

Defaults are disabled/zero. These are operational kill switches, not evidence
that a human review occurred. The account owner must confirm the agent’s tools,
retention and a defensible per-run/billing bound before setting the review flags.
**The credit guard caps local reservations and run count; it is not a live
Datadog billing meter or an enforceable provider-side spend limit.** If no reliable
per-run bound/account cap can be established, keep private execution disabled.

Before creation, the adapter reads and checks the published workflow, one Run
Agent step, configured agent and input/output contract. A 0600 ledger reserves
the run and credits before a single execution POST. Minimum spacing is one
minute, with a monthly run cap and reservation cap. Ambiguous create failures
consume their reservation and are never automatically retried.

Creation accepts HTTP 200 or 201 and requires an instance ID. Polling reads
`data.attributes.outputs.answer` after `SUCCEEDED`, with at most 15 polls, a
30-second execution deadline and five-second request caps. A known nonterminal
instance receives one bounded `PUT .../cancel` request on failure or timeout.
If creation times out without an instance ID, cancellation cannot be addressed:
an operator must inspect the workflow history before another attempt. Cancellation
failure does not refund the reservation or imply the remote work stopped.
[Workflow creation](https://docs.datadoghq.com/api/latest/workflow-automation/execute-a-workflow/),
[instance retrieval](https://docs.datadoghq.com/api/latest/workflow-automation/get-a-workflow-instance/),
[cancellation](https://docs.datadoghq.com/api/latest/workflow-automation/cancel-a-workflow-instance/).

The existing workflow exports a string, without a verified agent JSON output
schema. Aggregate triage requests a restricted JSON object inside that string;
the adapter rejects incompatible answers. Configuring the corresponding agent
output schema and reviewing its tool access remain account-side tasks.

## APM, Error Tracking and browser telemetry

`scripts/observability/manual-apm.mjs` is an optional adapter for a separately
installed, reviewed Datadog Node tracer. It imports no SDK and the application
does not load it. Initialization defaults off; automatic plugins, log injection,
runtime metrics, profiling and client-IP collection are disabled. Only fixed
route categories, a bounded duration and `ok/error/refused` status are accepted.
Errors are marked with constant type/message, without passing an Error object,
stack, request, prompt or financial input. No automatic HTTP instrumentation
should be enabled merely to get traces. Configure the local Agent’s site and
credentials independently. [Node tracer options](https://github.com/DataDog/dd-trace-js/blob/master/index.d.ts).

RUM remains disabled. [The RUM policy template](../deploy/datadog/rum-policy.mjs)
contains no application ID or client token, and no browser SDK is installed.
Sampling, interaction/resource/long-task tracking and session replay are disabled
in the proposal. The `beforeSend` rejection example is defense in depth only:
Datadog documents that **view events cannot be discarded by that callback**.
Do not initialize RUM until the public-client-token requirement and source privacy
design are resolved. Masking or downstream scanning does not make collection of
private calculator contents acceptable. [Browser event controls](https://docs.datadoghq.com/real_user_monitoring/application_monitoring/browser/advanced_configuration/).

## Pipeline, scanner, dashboards and alerts

[The privacy pipeline specification](../deploy/datadog/privacy-pipeline-spec.json)
is deliberately labeled a review specification, not an importable account API
configuration. It describes a dedicated sanitized source, schema reconstruction,
rejection of unexpected attributes, worker-side sensitive-data scanning and
approved egress. Configure it against the installed worker/version and available
standard scanner rules. Scan/redact in the worker before egress; hosted Sensitive
Data Scanner is an additional check, not permission to transmit raw data first.
[Worker Sensitive Data Scanner](https://docs.datadoghq.com/observability_pipelines/processors/sensitive_data_scanner/).

[Dashboard](../deploy/datadog/dashboard.json) and [monitor](../deploy/datadog/monitors.json)
templates use the submitted gauge names and standard Datadog API shapes. They
have not been imported or remotely validated. Select approved notification
destinations and validate them in the authorized account before activation.
The templates show daily cumulative outcomes; thresholds are provisional
operational settings, not learned baselines. No-data monitoring is important
because failed delivery cannot reliably report its own outage through the same
intake endpoint. No-data also occurs when no current-day operation file exists.

## Verification

Run `node --test scripts/observability/observability.test.mjs`. Tests use mocked
network responses only and cover region/host boundaries, strict counters and
tags, disabled/missing-data behavior, retries, persistent rate limits, private
file modes, timeout/size bounds, task rejection, both create success codes,
reserved-budget persistence, independent monthly caps, concurrent execution
locking, month transitions, cancellation, workflow shape checks and response
redaction. ESLint and systemd unit syntax checks pass. Activation and actual
Datadog ingestion/trace/dashboard behavior remain separate deployment checks.
