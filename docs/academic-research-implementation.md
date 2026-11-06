# Academic research collection — implementation

Implemented locally on 6 November 2026. No push or deployment is included in this change.

## Reader destinations

New topic: `/library/knowledge/research-methods-academic-skills/`.

The topic has six reading areas and 21 guides/indexes: 15 methods guides, a reference catalogue and five subject reading maps. The methods sequence covers questions/proposals, philosophy/design, measurement quality, data collection, evidence appraisal, literature synthesis, writing, referencing, action research/consultancy, sampling, questionnaires, analysis selection, SPSS and hypotheses. Reading maps connect finance, marketing, change/leadership, projects and strategic HR to their existing subject guides.

Nine existing guides gain relevant reading connections: balanced scorecard, integrated reporting, HR operating models, resource-based strategy, project stakeholders, organizational culture, marketing planning, business-analysis evidence and economic evidence. Existing article sections, figures and substantive material are preserved. `/research/` retains the site's own research/data purpose and links to the new academic topic.

The reference catalogue supports search, subject, theme, year, publication-type, metadata-state and reading-state filters, incremental browsing, copyable references, publication links and direct links to individual records. Global library search includes reference titles/authors/citations. Internal reference anchors are not reader-facing titles. Each record preserves the original supplied wording and sheet/cell in a disclosure.

## Completeness and provenance

Archive SHA-256: `0cae02431186b7e87516c8d03a9b43583bd4881caf5e2d455944efdea323fbaf`.

- Two documents: **723 paragraphs, 4,658 words, 14 tables and one image**. Every paragraph and image has a destination. Structural headings may be consolidated; substantive source text remains accessible beside reviewed explanations.
- Workbook: **344 populated cells across five sheets**, all mapped to **342 reference records** through 345 source-to-record mappings.
- Split the two marketing books sharing one cell; join the exact Ulrich duplicate, the verified Milliman fragment/title pair, and the Deloitte report/link pair. Original cells remain separately attributable.
- Retain the unchanged original archive at `content/sources/academic-research/collection.zip`; document/workbook inventory is in its `editorial/inventory.json`.
- Recreate the source image as a themed vector diagram with all **seven displayed elements and six branches**, searchable labels and a readable companion table. No copied oversized bitmap is published.

Coverage: [document ledger](academic-research-content-coverage.csv), [workbook ledger](academic-reference-coverage.csv), [section reviews](academic-research-source-reviews.csv), [reference verification ledger](academic-reference-verification.csv), [coverage assertions](verification/academic-research-library.json).

## Editorial and citation decisions

Reviewed explanations qualify or correct the handouts' shortcuts: reliability versus validity/causality; nominal versus numeric scales; sampling fractions versus intervals; purposive versus convenience samples; ANCOVA versus nonparametric alternatives; paired versus independent tests; factors versus group counts in ANOVA; and null-hypothesis decisions versus proof. Practical comparison tables and process summaries accompany the retained detail. SPSS documentation is explicitly version-labelled.

**176 records have metadata checks**, **160 need verification**, **one is incomplete**, and **five are journal suggestions**. Four have bounded abstract-level reading notes; **no record claims a full-text or claim-level evidence review**. Metadata checking identifies a publication, not proof of its conclusions or quality. Journal suggestions are not presented as verified current rankings.

Corrections include Cardinaels/van Veen-Dirks volume/pages and Too/Weaver pagination. The IIRC framework preserves the supplied 2013 version with 2021 revision context. Unresolved Buller/Butler and Watson author/year differences remain explicit. Publisher records correct the Minavand author list where the registry mistook an affiliation for an author, and Peter F. Boxall's split name. JST bibliographic metadata resolves the malformed Delery/Doty registry title. The source URLs and review dates are recorded per reference; original citations are never silently overwritten.

Four identical unavailable-download placeholders in the research document are disclosed; their absent underlying material cannot be reconstructed. No SPSS dataset, output or worked exercise was supplied. Incomplete in-text handout citations are kept distinct from the workbook rather than guessed into matches. The diagram's unclear original phrase “upgrade realist” is retained and flagged; its branching is described as a teaching heuristic rather than a method-selection rule.

## Discovery and hygiene

The combined sitemap, content sitemap and human-readable content index discover all **564 catalogue entries**, including 22 new URLs. Canonicals remain clean when a reference is linked through a query/hash. The existing category-search metadata gap is repaired: category indexes now have useful descriptions; special directories use their existing summaries when they have no prose sections. The prior 542 catalogue URLs and formula directory are retained.

The workbook parser rejects unexpected auxiliary parts, formulas, non-text/hidden content, unknown source cells, duplicate anchors and uncovered bibliography cells. No new dependencies or content-only test suite were added. The bounded Graphify architecture graph was refreshed. Temporary extraction, metadata caches, browser scripts and screenshots remain outside Git on `/mnt/sdb`.

## Verification

Production build, changed-file ESLint, TypeScript and the five existing library/category tests pass. Source-preservation assertions cover all supplied document paragraphs, workbook cells, reference links and the diagram; they also compare all previous guide sections/figures and the formula directory with HEAD.

Browser evidence: [guide/page checks](verification/academic-research-browser.json), [reference interactions](verification/academic-reference-browser.json). Review covers mobile (390px) and desktop (1440px), category membership, headings, anchors, canonicals, related links, retained text and disclosures, diagram labels/scrolling, selected accessibility audits, all catalogue routes and sitemap/index discovery. Reference interactions exercise every filter value, all records and original source mappings, clipboard copying, late-record deep links, reading-map navigation and library search.
