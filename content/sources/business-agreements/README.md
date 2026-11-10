# Business agreements: anonymised teaching sources

Reviewed 10 November 2026. Twelve historical DOCX agreements, 874 nonempty paragraphs, nine tables and no embedded images.

This repository is public. `collection.zip` is a teaching copy with five identifying strings replaced by role placeholders and a minimal body-XML package that omits metadata and package-level style definitions. Original formatting remains in the private upload. Its body paragraphs and table structure are retained; it is not the byte-identical upload or an approved legal template.

The exact upload and replacement map remain outside Git in private local storage under `/mnt/sdb/agreement-review/private/`. Root `D.zip` is ignored. Original upload SHA-256: `c9d5791996a5fb451f756f534900358ca28f54de727b7db75f031f8711ed3e70`.

- Anonymised inventory: `editorial/inventory.json`
- Editorial plan: `scripts/content-business/agreements-plan.json`
- Coverage: `docs/business-agreements-content-coverage.csv`
- Structure, primary references and unresolved issues: `docs/business-agreements-implementation.md`

Rebuild with `python3 scripts/content-business/build.py`. The build checks teaching-archive identity, all source clauses against public expanded detail, complete paragraph coverage, collection placement and related links. Local verification also compares the teaching copy with the private original after reviewed replacements. No raw identifying-string map or original upload is committed.
