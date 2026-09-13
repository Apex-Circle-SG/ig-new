# Ginie general-question release

The broad topic filters have been removed. Questions are no longer rejected just
for mentioning APIs, taxes, investing, loans or similar subjects. Existing
sourced explanations and deterministic calculations remain available.

**General generation is implemented but remains off until the operator confirms
that every Datadog agent tool is disabled.** A successful unit mock is not proof
of live general inference. The existing source-selection connection has separate
live verification; no arbitrary visitor prompt has been sent to the agent.

## What changed

- Unmatched questions can use a server-side Datadog general-answer path.
- General answers have a distinct label, no fabricated citations, and an explicit
  source-verification limitation. Text is escaped, including code examples.
- The form discloses external processing before general submissions. Known
  identifiers are blocked and detected financial amounts are omitted. These
  checks are not guaranteed anonymization. No conversation history is attached.
- General questions, question hashes and generated answers are not stored in the
  application cache or logs. Datadog may retain them under its account policy.
- Both provider modes share the existing durable budget, concurrency lock,
  cooldown, timeouts and cancellation behavior. There is no second run allowance.
- Generated and cited answers have separate consent-aware analytics events;
  neither event contains the question or answer.

## Required Datadog setting

In the configured Ginie agent’s **Tools** section, disable **Datadog MCP**, every
other MCP connection, and all Action Catalog actions. Save, reopen and confirm
that no tool is connected. Keep Conversation ID unset in the workflow.

Datadog’s [Agent Builder documentation](https://docs.datadoghq.com/actions/agents/)
and [editor screenshot](https://docs.dd-static.net/images/actions/agents/agent-builder-interface.a7d1f23bb07d7485f6813ac6154bb102.png)
show these switches. Run Agent uses the configured tools; its documented options
provide no per-request override. No supported configuration-read/write API was
found, so the current tool settings have not been independently verified.

The agent could otherwise receive requests to access private account telemetry.
This is a configuration risk, not evidence that any data was exposed. General
mode stays off while the operator’s confirmation is pending.

After confirmation, the deployment configuration can enable
`ASK_DATADOG_GENERAL_ENABLED=true` and set `ASK_DATADOG_TOOL_FREE_AGENT_ID` to the
reviewed `DD_AGENT_ID`. That value records human review; it is not API verification.
A change to the agent or its tools requires another review. See the
[full implementation and activation instructions](genie.md).

## Verification and deployment

The [acceptance receipt](verification/ginie-general-acceptance.json) records the
exact accepted build and completed checks: lint, types, 399 Vitest tests, 35 Node
tests, 50 Python tests and 56 browser tests. Four visual snapshots passed; the
two changed Ask snapshots were reviewed at desktop and mobile sizes.

The [mobile Lighthouse run](verification/ginie-general-lighthouse.json) scored
95 performance and 100 accessibility, best practices and SEO, with 2.29-second
simulated LCP and zero CLS. This is lab evidence, not field Core Web Vitals.

Commands: `npm run lint`, `npm run typecheck`, `npm test`, the repository's
Node/Python script suites, `SITE_INDEXABLE=true NEXT_BUILD_DIR=.next-candidate
NEXT_PUBLIC_ADS_ENABLED=true npm run build`, and
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3011 npx playwright test`.

General provider tests use controlled responses; production source-selection
checks use the real configured workflow or its validated cache. These scopes
must not be conflated.

Deploy using the [existing promotion procedure](consolidation-release.md). The
service remains on `127.0.0.1:3000`. Its private release archive supports rollback
of the application and runtime settings. Preserve
`/var/lib/insightginie/datadog-ask/selection-state.json` across release and rollback
so run reservations are not reset. General mode can be disabled independently;
WordPress migration status is unaffected.
