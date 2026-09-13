# Changelog

## 2026-09-13 — Datadog workflow connection and live test

- Revalidated AP1 credentials and confirmed the selected published workflow now
  references the configured agent ID.
- Ran one synthetic health check. Execution succeeded and the workflow returned
  the exact expected `INSIGHTGINIE_READY` marker through its `answer` output.
- Recorded the verified input/output contract and current initiator identity;
  retained the earlier failed-configuration receipt as historical evidence.
- Updated production prerequisites. No visitor data was sent, no duplicate
  execution request was issued, and no production website or remote workflow
  configuration was changed.

See [the live-test receipt](docs/audits/2026-09-13-datadog/workflow-recheck.json)
and [remaining production work](docs/datadog-bits-requirements.md).

## 2026-09-13 — Datadog credential verification

- Verified API/application-key authentication and workflow reads against AP1
  with HTTP 200 responses; saved a sanitized access receipt.
- Inspected all three visible workflow definitions. Neither published workflow
  references the supplied agent ID; the workflow ID is absent from local config.
- Updated remaining integration requirements, including service-account
  execution, structured output, credits and retention checks.
- Tightened the ignored local `.env` to `0600`. No secrets were committed, no
  workflow ran and no production service or Datadog configuration changed.

See [access results and next steps](docs/datadog-bits-requirements.md).

## 2026-09-13 — Consolidation inspection (Phase 1, incomplete)

- Inventoried 41,211 distinct public blog URLs through complete published REST
  collections and 46 sitemap documents; preserved source metadata/provenance.
- Added source/browser audit tooling, explicit coverage records and an inactive
  old→new migration candidate map. Missing measurements remain null.
- Verified two broken, externally linked main-domain article URLs with live exact
  blog counterparts, and a sampled mobile overflow defect.
- Recorded blog pagination/search HTTP 429 responses and paused further blog
  crawling; exhaustive per-URL validation remains open.
- Documented Datadog Bits access requirements, inference/operations boundaries,
  required external evidence, editorial briefs and deployment/rollback gates.
- No application, production service, DNS, ad configuration, WordPress setting,
  redirect or editorial content was changed or deployed in this phase.

See [the audit](docs/audits/2026-09-13-consolidation/AUDIT.md),
[SEO_AUDIT.json](SEO_AUDIT.json), [MIGRATION_MAP.csv](MIGRATION_MAP.csv),
[CONTENT_BACKLOG.md](CONTENT_BACKLOG.md) and [MANUAL_REQUIRED.md](MANUAL_REQUIRED.md).

## 2026-09-13 — Public advertising and data explorer

Previously deployed in `e9a5848`: public advertising coverage, protected private
calculator frames, income dataset/CSV/embed, aggregate analytics and search
engine discovery. [Release report](docs/launch-2026-09-13.md).
