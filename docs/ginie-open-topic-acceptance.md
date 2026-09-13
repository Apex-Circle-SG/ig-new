# Open-topic Ginie activation

The owner explicitly authorized general questions through the existing Datadog
agent despite unverified remote tool settings. This supersedes the earlier
tool-isolation activation blocker. No tool-free attestation has been recorded.

The application supports both actual operator tool-free attestation and explicit
owner authorization, bound to the configured agent ID. UI availability and the
provider use the same authorization check. Secrets remain server-side; known
credential filtering, input limits, output validation, abuse controls, run budgets
and basic model safety instructions remain active. The product is open-topic,
not a promise of unrestricted answers or unlimited capacity.

The [real provider check](verification/ginie-open-topic-provider.json) returned a
relevant JavaScript explanation in approximately eight seconds. This was one
actual workflow execution using the shared production run ledger. No response
body, credentials or visitor data were recorded in the report.

Remote tool settings remain unverified. A no-tool instruction and output filters
are not technical isolation or a guarantee against exposure. The owner accepted
this configuration; a dedicated agent with disabled tools is still recommended.
The application does not attach conversation history, cookies or browser headers.
Datadog may retain general prompts and answers under its account settings.

Existing limits remain 20 workflow executions per UTC day, 120 per UTC month,
one in flight, and a 60-second interval between uncached executions. These are
shared run limits, not a dollar cap. No additional model API key is needed.

Disabled configuration now says general answers are not enabled; incomplete
configuration asks for a site configuration update. It no longer misleadingly
describes either condition as a temporary provider outage.

## Release and rollback

The server remains on `127.0.0.1:3000` behind the existing tunnel. Deployment and
public browser verification receipts accompany this report after promotion.
The promotion archive retains the prior build and runtime configuration.

To disable general generation independently, set
`ASK_DATADOG_GENERAL_ENABLED=false` in both ignored root `.env` and the protected
runtime environment, then restart `insightginie-web`. Preserve
`/var/lib/insightginie/datadog-ask/selection-state.json` through rollback and restart.
See [deployment procedures](consolidation-release.md) and [provider configuration](genie.md).
