# Venture building, business planning and ethics: implementation

Completed locally from the approved review. **Not pushed or deployed.**

## Reader structure

The integration adds **19 guides**, enriches **39 existing guides**, and adds the **Business Ethics & Governance** collection under Leadership, People & Change. The Business gateway retains its seven main entrances.

The new **Build and review a business plan** pathway sits in Strategy & Growth. Six linked stages connect customer/problem evidence, offer validation, delivery/people, economics, funding and responsibility. Readers can open the relevant detailed guide directly from each stage rather than navigate a second copy of all the material.

New readings include venture validation; PoC/prototype/MVP comparisons; pitching; funding readiness, routes and terms; evidence/BADIR; Mintzberg’s organization design; corporate parenting; business-model renewal; manufacturing/service process types; and ethical reasoning, purpose, CSR, practice, decisions and historical cases. Erikson’s human-development outline belongs in Personal Development, separate from organizational lifecycles.

Existing Product, Strategy, Finance, Marketing, Operations, Process Improvement, People, Problem Solving and Project Management guides keep their relevant source additions. “Building” is correctly treated as venture building, not Property. The stakeholder guide remains the primary home for stakeholder mapping; ethics and CSR link to it.

## Completeness and provenance

Archive SHA-256: `2ec3d061109bcd5318a048b62ffd2a459699d369f0724dae7b8cf5768161b072`.

| Supplied document | Paragraphs | Words | Tables | Images |
| --- | ---: | ---: | ---: | ---: |
| Building.docx | 319 | 1,063 | 8 | 0 |
| Business Checklist.docx | 332 | 1,306 | 6 | 0 |
| Business.docx | 271 | 1,545 | 11 | 5 |
| Ethics.docx | 190 | 1,063 | 9 | 2 |
| Total | **1,112** | **4,977** | **34** | **7** |

All 1,112 paragraphs are mapped, with zero unmapped items. Substantive wording is retained in displayed source detail or expandable original-note disclosures; structural headings can be consolidated. The grids are reorganized into sections and readable comparisons, preserving meaningful cell associations. The four-column venture-validation associations and CSR-stance comparison have explicit source-cell mappings. No native equation objects or unexamined embedded/auxiliary text were found.

- [Paragraph/image coverage ledger](venture-ethics-content-coverage.csv)
- [Section classifications and review assessments](venture-ethics-source-reviews.csv)
- [Original archive](../content/sources/business/venture-ethics/collection.zip)
- [Parsed inventory with table-cell positions and image hashes](../content/sources/business/venture-ethics/editorial/inventory.json)
- [Editorial plan](../scripts/content-business/venture-ethics-plan.json)
- [Reviewed diagram data](../scripts/content-business/venture-ethics-figures.json)

The source contains 32 sections needing explicit clarification or qualification. Original disclosures preserve disputed wording without presenting it as verified guidance. The archive provides traceability alongside integrated content; it is not the only place the substantive material is available.

## Seven rebuilt visuals

All seven images are rebuilt as theme-consistent SVG diagrams with accessible comparison tables. No source JPEG screenshots or new bitmap assets are inserted into the site.

The visuals retain the organizational parts; structure/culture/power relationships and unclear E label; resource/activity/offering/market relationships and described model boundary; the four product/segment focus scopes; business-model feedback; stakeholder power/interest quadrants; and Carroll’s four layers with their side captions.

Across the seven reconstructions, 37 labelled elements and 20 explicit connections are represented. The renewal/exploration feedback model retains **all 12 elements and 13 signed connections**, including the time delay and its negative effect. Diagram-only text is included in library search.

Diagrams scroll inside bounded keyboard-accessible regions on smaller screens. The two long companion tables are expandable, reducing mobile page length while preserving every label and relationship. The five Mintzberg configurations also have a readable corrected comparison in the main guide. Empty “At a glance” sections no longer render when there are no steps.

## Corrections and limits

The integration distinguishes mechanism from organizational part in the Mintzberg table; flags the Evan/Friedman versus Evan/Freeman attribution; separates the 1962 Friedman reference from the famous 1970 essay; corrects EBITDA versus EBITA and capacity versus achieved throughput; identifies the source’s different DISC acronym; and qualifies the story/deal percentage, fixed PoC timings, “recession-proof” label, undefined grades/indexes and ambiguous investor example.

Founder terms link to Singapore VIMA and US NVCA documents with jurisdiction context, rather than being presented as universal agreements. Source insurance, entity, lease, IP and employment prompts do not become individualized legal or policy instructions. The supplied SCOR list and Adizes stages are identified as supplied versions/excerpts, not complete current standards. Bare names and explicit placeholders remain identified as incomplete.

The ethics cases distinguish dated official proceedings for Volkswagen, Cambridge Analytica, Barclays and BAE from the source’s broader shorthand. Other named examples—News Corporation, Primark, Nike, Microsoft, British Airways, BHS and RBS—retain their original wording and uncertainty; no unspecific claim is adopted as a verified current finding. The abbreviated TI checklist is distinguished from TI’s broader official code. Missing quotation editions/pages and unclear diagram labels remain unresolved rather than acquiring invented provenance.

## Verification

- Production build, TypeScript and ESLint pass for the changed rendering code.
- All three existing library browsing checks pass. No new content-only test suite was added.
- [Source/catalogue verification](verification/venture-ethics-library.json): previous guide sections/figures remain intact; the existing 152-entry finance formula directory is unchanged.
- [Full browser review](verification/venture-ethics-browser.json): **126 renders**, **24 accessibility audits**, **542 catalogue routes**, **14 figure checks** and **2,504 rendered passage checks** across 390 px and 1440 px.
- [Final diagram/table refinement review](verification/venture-ethics-final-browser.json): verifies 16 renders, 12 accessibility audits and 14 figure checks, including the refined diagrams, expanded companion tables, corrected historical-reference placement and final discovery. Complete diagrams fit the desktop reading column.
- Category membership, seven-entry Business gateway, nested Ethics discovery, cross-links, breadcrumbs, anchors, canonical URLs and diagram-text search pass. Diagram labels fit their nodes; scroll regions work without page overflow. Representative screenshots were inspected locally.
- Combined sitemap, content sitemap and human-readable index include the final **542 catalogue URLs**, up from 522. Existing routes are preserved; no static tool routes were added.
- The builder now rejects images mapped to a destination but not actually attached to a page, broken reading-path links, missing diagram labels and invalid node/edge references.
- Graphify’s bounded architecture graph is refreshed. Existing consent-aware advertising remains in place; no new dependencies are introduced.

Only this integration is committed. Unrelated edits and deletions are preserved. Preview servers are stopped after verification; no new background service is left running.
