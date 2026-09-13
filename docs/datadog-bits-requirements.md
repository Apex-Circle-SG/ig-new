# Datadog Bits access needed

Status: **AUTHENTICATION VERIFIED; WORKFLOW CONFIGURATION REQUIRED**. Checked
13 September 2026 with read-only Datadog API requests. The server's ignored `.env`
now contains Datadog credentials. No SDK, agent execution or production
integration has been enabled by this check.

## Verified access and remaining gaps

| Check | Result |
| --- | --- |
| Datadog site | AP1 (`ap1.datadoghq.com`), recognized from `DD_REGION` |
| API key | Valid: `/api/v1/validate` returned HTTP 200 and `valid: true` |
| API/application key pair | Valid: `/api/v2/validate_keys` returned HTTP 200 and `status: ok` |
| Workflow configuration access | HTTP 200; all three visible workflows inspected, including unpublished definitions |
| Published workflows | Two have API triggers and Run Agent steps; both reference agent IDs different from `DD_AGENT_ID` |
| Unpublished workflow | One draft; its two Run Agent steps have empty agent IDs |
| Agent ID | Present and UUID-shaped; existence and agent configuration are not independently verified |
| Workflow selection | `DD_BITS_WORKFLOW_ID` is absent; no inspected workflow references the supplied agent ID |
| Structured output | None of the inspected Run Agent steps explicitly configures an output schema |
| Execution identity | Current key belongs to a personal user; all three workflows run as owner |
| Role permissions | Current user's roles include `workflows_read`, `workflows_run`, `connections_resolve`; application-key run scopes and workflow-specific Runner authorization remain unverified |
| Secret handling | `.env` remains Git-ignored; local permissions tightened to `0600`; no credential values or account/resource IDs included in the receipt |

Evidence: [sanitized API receipt](audits/2026-09-13-datadog/access-check.json).
The workflow list was requested with both `includeSpecs` and
`includeUnpublished`; its returned count matches the pagination total. The
initial default list omitted the draft and workflow specs, so it was not used
to conclude that no workflow references the agent.

Local validation passed: receipt JSON/invariants, complete returned workflow
coverage, local documentation links, `git diff --check`, Git ignore/file-mode
checks and a scan of changed reports for supplied secret values. These are
documentation-only changes; the application test suite was not rerun locally.

To complete a private operational integration:

1. Select the intended agent in a dedicated workflow's **Run Agent** step, or
   resolve whether the supplied agent ID should refer to an existing selection.
   Do not silently switch to either existing agent. Configure a JSON output
   schema, bounded instructions and reviewed tools. Store that workflow's ID as
   `DD_BITS_WORKFLOW_ID`. API-triggered workflows must be published.
2. Use a restricted service-account identity for production and verify its
   workflow-specific Runner and required connection permissions. Successful
   read access does not prove execution access.
3. Confirm available AI Credits, allowed model, spend cap and retention/redaction
   controls before enabling recurring execution. No balance or budget was
   invented and no paid test was run.

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
website-chat or general model-completion API**. Account authentication and
workflow reads are now verified; successful agent execution, credits and public
inference entitlements are not. [Workflow API](https://docs.datadoghq.com/api/latest/workflow-automation/),
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
