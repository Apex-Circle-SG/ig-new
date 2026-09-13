# Datadog Bits access needed

Status: **LIVE WORKFLOW/AGENT TEST PASSED**. Rechecked 13 September 2026 after the
local agent/workflow settings were updated. Authentication, the selected
published workflow and one synthetic agent execution succeeded. No production
SDK or website integration has been enabled by this check.

## Verified access and remaining gaps

| Check | Result |
| --- | --- |
| Datadog site | AP1 (`ap1.datadoghq.com`), recognized from `DD_REGION` |
| API key | Valid: `/api/v1/validate` returned HTTP 200 and `valid: true` |
| API/application key pair | Revalidated: `/api/v2/validate_keys` returned HTTP 200 and `status: ok` |
| Selected workflow | `DD_BITS_WORKFLOW_ID` resolves with HTTP 200; published, API-triggered, one Run Agent step |
| Agent connection | Selected step's `customAgentId` exactly matches the current `DD_AGENT_ID` |
| Input/output contract | Input `question` is a string; the prompt references `Trigger.question`; output `answer` maps to `Steps.Run_Agent.finalResponse` |
| Live execution | One create request returned HTTP 200 with an instance ID; result retrieval returned HTTP 200 with `SUCCEEDED` and `outputs.answer = INSIGHTGINIE_READY` |
| Structured output | Workflow exports a string answer; the Run Agent step still has no explicit JSON output schema |
| Execution identity | Selected workflow runs as `initiator`; current API identity is a personal user, confirmed again by `/api/v2/current_user` |
| Execution permissions | Read, execute and result retrieval now verified for the current key and selected workflow; future service-account permissions need their own test |
| Secret handling | `.env` remains Git-ignored; local permissions tightened to `0600`; no credential values or account/resource IDs included in the receipt |

Latest evidence: [workflow and live-test receipt](audits/2026-09-13-datadog/workflow-recheck.json).
The [earlier read-only receipt](audits/2026-09-13-datadog/access-check.json)
preserves the initial missing-workflow/agent-mismatch findings. Those two
configuration blockers are now resolved. The latest check targets the selected
workflow; it is not a new inventory of every workflow in the account.

The synthetic prompt requested only `INSIGHTGINIE_READY`, with no tool use or
account-data access. No visitor input was sent. Exactly one execution-create
request was issued; the API returned 200 rather than the documented 201. The
instance was retrieved and its terminal status and answer verified without
repeating the create request. No claim is made about the agent's complete tool
allowlist, internal tool usage, credit balance or prompt-retention configuration.

Local validation passed: receipt JSON/invariants, local documentation links,
`git diff --check`, Git ignore/file-mode checks and a scan of changed reports for
supplied secret values. Repository changes are documentation-only; the
application test suite was not rerun locally.

Before production integration:

1. Review agent instructions/tools and configure strict structured-output
   validation. The workflow currently has no explicit API-trigger rate limit;
   add bounded server-side invocation, timeouts and a kill switch.
2. Use a restricted service account and retest its workflow-specific execution
   and required connection permissions.
3. Confirm available AI Credits, the selected model, a recurring spend cap and
   retention/redaction controls. This one successful diagnostic does not
   establish production capacity or recurring billing limits.

`DD_REGION` and `DD_AGENT_ID` were understood during this access check. They do
not need replacing to diagnose the account. The eventual server integration
must explicitly map them to `DD_SITE` and `DD_BITS_AGENT_ID`, or use the proposed
names below; Datadog's SDKs do not automatically interpret our application aliases.
Adding keys to the root `.env` alone does not install instrumentation or enable
the production assistant.

[Key-pair validation](https://docs.datadoghq.com/api/latest/key-management/validate-api-and-application-keys/),
[workflow configuration API](https://docs.datadoghq.com/api/latest/workflow-automation/list-workflows/),
[current-user permissions](https://docs.datadoghq.com/api/latest/users/get-current-user/).

## What to provide

Keep secrets in the server environment or a protected server-only environment
file; never paste them into chat, commit them or prefix them with NEXT_PUBLIC_.
The following are proposed integration settings, not proof that an integration
is already installed:

```dotenv
DD_SITE=datadoghq.com
DD_API_KEY=
DD_APP_KEY=
DD_BITS_AGENT_ID=
DD_BITS_WORKFLOW_ID=
DD_ENV=production
DD_SERVICE=insightginie-web
# Application-level control; disabled until an integration is verified.
INSIGHTGINIE_AI_ENABLED=false
```

1. **Datadog site and organization:** the account's actual region/site, such as
   datadoghq.com, datadoghq.eu, us3.datadoghq.com or ap1.datadoghq.com.
2. **Product access:** confirm Bits Agent Builder and Workflow Automation are
   enabled. Bits Chat UI access alone does not establish that either is enabled.
3. **Restricted service account:** an API key and application key scoped to the
   read/run operations actually required. The workflow needs specific Viewer/
   Runner permissions; connections need only the Resolver access used by that
   workflow. Do not provide a broad administrator key by default.
4. **Agent/workflow IDs and configuration:** agent instructions, selected model,
   tool allowlist, workflow trigger, output schema and execution identity. A
   new private operational workflow should have no automatic posting, deployment
   or permission-changing actions.
5. **Credits and limits:** available AI Credits, allowed models, monthly spend
   ceiling and expected execution volume. We need an explicit budget before
   enabling recurring or user-triggered billable execution.
6. **Account-specific API/privacy evidence:** supported API invocation and result
   retrieval, limits, timeouts, retention of workflow inputs/outputs, prompt/chat
   retention, redaction options and any contractual restriction on public use.
   A redacted account documentation link or configuration export is sufficient
   for review; do not expose credentials in it.

## What the documented products support

Bits Agent Builder provides models, tool allowlists and a Run Agent action in
Workflow Automation/App Builder. The action accepts instructions and an optional
JSON output schema. Agents consume Datadog AI Credits, so a private Bits workflow
need not require a separately supplied OpenAI/Anthropic API key solely for the
Bits-provided model. [Agent Builder](https://docs.datadoghq.com/actions/agents/).

Workflow Automation has authenticated execution and result APIs. That is a
possible server-side workflow integration, **not evidence of a standalone public
website-chat or general model-completion API**. Account authentication, workflow
reads and a synthetic agent execution are now verified; credit allowances and
public inference entitlements are not. [Workflow API](https://docs.datadoghq.com/api/latest/workflow-automation/),
[execution identities and permissions](https://docs.datadoghq.com/actions/workflows/access/).

The requested architecture explicitly limits Bits to private operations: error
triage, aggregate failed-answer categories, freshness alerts and reviewed work
items. Keep that boundary. `/ask/` can still offer public-content search,
source-linked deterministic answers and calculators while generative inference
is unavailable. Do not scrape the Bits UI or route anonymous questions through
privileged operational agents.

Prompt privacy also needs verification. Datadog documents retained chat/workflow
and observability data; a restricted API key does not itself turn off retention.
Do not send raw visitor prompts, income values, cookies, account data or full IPs
to Bits or telemetry. Use aggregate categories and approved public facts only.
[Retention](https://docs.datadoghq.com/data_security/data_retention_periods/),
[Agent Observability governance](https://docs.datadoghq.com/llm_observability/data_governance/).

## Monitoring is separate from inference

APM, RUM and Agent Observability report application behavior; none of these
alone supplies model inference. Confirm which products and usage allowances are
actually included. SDK collection, privacy filtering and consent need independent
validation before enabling them on the production site.

The browser RUM SDK normally uses an intentionally public client token; API and
application keys must remain server-only. The strict requirement for no Datadog
credentials in browser code means we should first specify aggregate Web Vitals
forwarding through our server, and resolve the public-client-token interpretation
before enabling the browser RUM SDK. Masking fields is not a substitute for
preventing private data collection at its source.
[Datadog client-token and API-key distinction](https://docs.datadoghq.com/getting_started/feature_flags/#credentials-at-a-glance).
