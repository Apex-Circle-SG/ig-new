# Datadog-backed Ask: contract review

The supplied AP1 credentials support the configured workflow read and have
`workflows_read` / `workflows_run` permissions. The latest user request authorizes
server-side Datadog-backed Ask; the earlier private-only brief is superseded for
this feature. This review made **five read-only account requests, zero executions
and zero remote changes**. It does not claim the new provider is deployed.
[Sanitized verification](verification/datadog-ask-contract.json).

## Confirmed integration contract

The selected published workflow has one Run Agent step, matching the configured
agent. It accepts a string `question` and maps a string `answer` from
`Steps.Run_Agent.finalResponse`. Its prompt also contains static instructions.
The step currently sets neither an explicit Output Schema nor Conversation ID.

Send one `POST /api/v2/workflows/{workflow_id}/instances` with
`meta.payload.question` containing the serialized, approved source-selection
task. Current documentation specifies HTTP 200; accepting 200/201 preserves the
existing compatibility behavior. Read `data.id`, then use instance GET requests.
Fresh read-only instance GETs verified
`data.attributes.instanceStatus.detailsKind` equal to `SUCCEEDED`, with a string
`data.attributes.outputs.answer`. `instanceStatus` is an object; its
`displayName` is cosmetic. The earlier synthetic receipt normalized status and
did not establish an `attributes.status` field. The public response schema is
an open object, so runtime validation remains necessary. Cancellation is
`PUT .../instances/{instance_id}/cancel`, requiring workflow run permission. No
cancellation was executed in this review.
[Execute](https://docs.datadoghq.com/api/latest/workflow-automation/execute-a-workflow/),
[poll](https://docs.datadoghq.com/api/latest/workflow-automation/get-a-workflow-instance/),
[cancel](https://docs.datadoghq.com/api/latest/workflow-automation/cancel-a-workflow-instance/).

## Recommended request and response boundary

Construct the outbound task from a finite approved intent and immutable public
source records. Include only source IDs, sentence IDs and reviewed excerpt text.
Never forward the visitor's question, financial inputs, browser headers, IP,
cookies, conversation history or free-text tool output. Resolve numeric questions
through deterministic engines locally. Do not include those numeric results in
the provider request.

Require a small strict JSON answer containing only allowed source/sentence IDs
and an allowlisted disposition. Reject additional fields, arbitrary prose,
unknown IDs, duplicate selections and oversized arrays. Reconstruct every
displayed sentence and citation from the local approved corpus. A model response
must not supply URLs, HTML, arithmetic, external actions or publication authority.
The current workflow can transport JSON inside its string answer; because its
Output Schema is unset, incompatible responses must fall back cleanly until a
synthetic selection test establishes the actual behavior.

Run Agent supports a JSON Output Schema, and each invocation is standalone unless
Conversation ID is supplied. Omit Conversation ID. A workflow read does not
expose the selected agent's model, full instructions or tools. No documented
public Agent Builder configuration-read endpoint was identified in the reviewed
API reference. Review those settings in the selected agent's UI: the product
documentation states that Datadog MCP is enabled by default. Prompt instructions
such as “do not use tools” do not verify that tool access is disabled.
[Agent Builder](https://docs.datadoghq.com/actions/agents/).

## Bounds and cost controls

Cache successful selections by approved intent, source-version fingerprint and
provider configuration, never by visitor text. Deduplicate concurrent cache
misses and allow one creation at a time. Use explicit small daily/monthly run
caps with durable reservations before POST. Ambiguous creation failures retain
their reservation; never automatically retry a potentially accepted creation.
Refusals, unsupported questions, numeric tool answers and cache hits need no
provider call. A bounded failure cooldown prevents repeated paid failures.

Keep outbound tasks within a fixed size, for example 8 KiB; bound provider
responses independently, for example 16 KiB transport and 2 KiB selected output.
Use five-second request limits and one overall execution deadline aligned with
the browser timeout, for example 15–20 seconds with at most ten polls. On a known
nonterminal instance, attempt one bounded cancellation after timeout or invalid
state. Cancellation failure is not proof that execution stopped. An ambiguous
create without an instance ID requires operator reconciliation, not a second
POST. Preserve a public-source fallback for all provider failures.

The account permits `usage_read`. A current-month usage-summary GET returned
numeric `ai_credits_agent_builder_ai_credits_sum` fields. The bounded hourly
AI/Bits query returned no rows; that is not evidence of zero spending. These
APIs report consumption, not a remaining balance or a per-run cost bound.
[Usage summary](https://docs.datadoghq.com/api/latest/usage-metering/get-usage-across-your-account/),
[hourly usage](https://docs.datadoghq.com/api/latest/usage-metering/get-hourly-usage-by-product-family/).

Datadog documents organization and per-user monthly AI Credit caps through
**Bits AI → AI Credits Management**, requiring `billing_edit`; the current role
has that permission. No documented public cap-read endpoint was identified, and
the actual account caps were not inspected. Workflow Agent Builder usage is
attributed to the workflow creator; service-account-created workflows attribute
to Autonomous Agents. Do not assume a cap on the API initiator protects these
runs. Local reservations supplement a verified account cap and are not a live
billing meter. [AI Credit Limits](https://docs.datadoghq.com/account_management/billing/ai_credit_limits/).

## Retention and remaining evidence

The published default for Workflow Automation is 30 days. Agent Builder docs
describe retained chat history. Omitting Conversation ID does not make workflow
inputs or outputs ephemeral. No documented account-specific retention-read API
was identified, and configured retention remains unverified. Sending only public
approved excerpts avoids placing visitor conversations in that storage.
[Published retention defaults](https://docs.datadoghq.com/data_security/data_retention_periods/).

Before claiming the provider works, record a bounded synthetic source-selection
execution, strict output acceptance, fallback behavior and cancellation behavior
where applicable. Confirm the agent's tools/model and the relevant account cap.
These are configuration/verification gaps, not a claim that the user's newly
authorized Datadog integration is forbidden or technically unavailable.

The implementation plan selected by the root engineer is 120 runs per month,
20 per day, at least 60 seconds between cache misses and a 25-second overall
deadline. These are local limits, not a verified Datadog credit allowance. One
bounded test using only a fixed public-source packet is authorized separately;
the unresolved account-setting review is not treated as a prohibition on that
test. This read-only review did not perform it or change provider settings.

The root engineer subsequently completed the authorized fixed-public-packet
test: Datadog returned `IN_PROGRESS` then `SUCCEEDED`, strict excerpt IDs passed
validation, and a cache read made zero additional requests. The run took about
6.1 seconds. This verifies the narrow source-selection integration; it does not
establish an account credit allowance or unrestricted generative chat.
[Live selection receipt](verification/datadog-ginie-execution.json).
