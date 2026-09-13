# Required external evidence and decisions

Updated 2026-09-13. Phase 1 is read-only. No application, DNS, WordPress,
redirect or advertising configuration has been changed by this consolidation
work. A missing integration is not a completed feature.

| ID | Label | Required input / decision | Blocks |
| --- | --- | --- | --- |
| CMS-01 | CREDENTIAL_REQUIRED | WordPress/hosting access that can export the database, uploads, themes/plugins/configuration and restore them. Public REST metadata is accessible but is not a full backup. | Destructive legacy-template changes and final migration cutover |
| CMS-02 | MANUAL_REQUIRED | A verified restorable WordPress backup and recorded restoration test. | Cutover; deletion/disablement of public templates |
| DNS-01 | CREDENTIAL_REQUIRED | Scoped Cloudflare/hosting authority to serve direct blog-host redirects and keep the backend private. A tunnel connector token does not grant DNS/redirect administration. | One-hop blog→main redirects |
| SEO-01 | CREDENTIAL_REQUIRED | Search Console domain-property access or page/query/date/device/country exports; GA4 reports if the legacy site uses GA4; server-log URL exports. | Traffic-bearing URL identification and measured organic baseline |
| SEO-02 | MANUAL_REQUIRED | Backlink/referring-page export, including destination URLs. Existing individually verified references are not a complete backlink inventory. | Evidence-based grandfathering and reclamation priorities |
| SEO-03 | EDITORIAL_REQUIRED | Review taxonomy/archive destinations. Tens of thousands of legacy tag URLs have no demonstrated equivalent in the three proposed finance hubs. No blanket redirects or invented equivalence. | Approved redirects for every archive URL |
| SEO-04 | MANUAL_REQUIRED | Complete source crawl, link-discovered URL expansion, and any remaining per-URL rendered review. Read progress/coverage before treating the audit as exhaustive. | Final Phase 1 acceptance and redirect cutover validation |
| DD-01 | CREDENTIAL_REQUIRED | Actual DD_SITE, restricted DD_API_KEY/DD_APP_KEY, Agent Builder/Workflow access and agent/workflow IDs; store secrets server-side. | Datadog account verification / private operational agents |
| DD-02 | EXTERNAL_SERVICE_REQUIRED | Available AI Credits, approved spend ceiling, supported models, API execution/result contract and account-specific retention/redaction controls. | Billable Bits execution; any inference feasibility assessment |
| DD-03 | EXTERNAL_SERVICE_REQUIRED | Supported inference appropriate for `/ask/`, or account documentation establishing a permitted integration consistent with the private-operations restriction. Bits UI access and observability access alone are insufficient. | Generative public assistant; deterministic search/tool fallback remains possible |
| DD-04 | MANUAL_REQUIRED | Confirm monitoring entitlements and the interpretation of a public RUM client token versus secret API/application keys. | Browser RUM configuration; no keys or SDKs have been deployed |
| EDIT-01 | EDITORIAL_REQUIRED | Verified authors, author bios, reviewers where applicable, source review and finance-content approval. Preserve existing bylines without inventing qualifications. | New finance/editorial publication and completed trust metadata |
| LEGAL-01 | LEGAL_REVIEW_REQUIRED | Review finance/AI disclaimers, privacy/consent, affiliate disclosures, content rights, operator identity and trademark clearance. | Legal claims of compliance or professional review |
| ADS-01 | CREDENTIAL_REQUIRED | AdSense account access or verified placement/CMP settings and actual earnings exports. | Account-side ad layout tuning and RPM/revenue baseline |
| OUTREACH-01 | MANUAL_OUTREACH | Controlled profile/account access and individually reviewed external reference corrections. | Changes to third-party articles/profiles; no messages have been sent |

See [Datadog requirements](docs/datadog-bits-requirements.md) for the precise
access checklist and documented capability boundary. Credentials must not be
pasted into chat or committed. Remaining entries are dependencies, not a request
to grant broad administrator access.
