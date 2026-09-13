# Changelog

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
