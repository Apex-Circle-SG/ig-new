# Datadog Bits access needed

Status: **CREDENTIAL_REQUIRED / EXTERNAL_SERVICE_REQUIRED**. Checked 13 September
2026. No Datadog credentials or SDKs are configured in this repository. The
available root environment contains GitHub credentials only.

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
website-chat or general model-completion API**. We have not authenticated your
account or confirmed its entitlements. [Workflow API](https://docs.datadoghq.com/api/latest/workflow-automation/),
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
