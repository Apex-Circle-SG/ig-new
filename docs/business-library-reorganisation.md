# Business library reorganisation

The Business & Management landing page now presents **seven subject collections**, replacing 67 mixed article/collection cards across 14 sections. Library browsing starts with these collections rather than flattening 146 entries and 28 subtopic choices into one view.

## Reading structure

| Hub | Direct readings and indexes | Purpose |
| --- | ---: | --- |
| Strategy & Growth | 38 | Strategic diagnosis, competition, capabilities, growth choices and evaluation; historical strategy sits in its own nested collection |
| Marketing Strategy & Execution | 22 | Customers, positioning, pricing, channels, communication and planning |
| Brand Strategy & Experience | 16 | Meaning, identity, awareness, equity, experience and architecture |
| Sales & Customer Relationships | 17 | Selling, sales management, retention, customer systems and feedback measurement |
| Product Development & Innovation | 12 | Products/services, development, testing, lifecycle, discovery and experimentation |
| Leadership & Organizational Change | 12 | Teams, alignment, culture, change, responsibility and negotiation |
| Operations & Performance | 10 | Operating systems, logistics, workflow, goals, performance, risk and feedback learning |

The gateway displays subject cards before optional reading paths. Collections have their own categories, complete breadcrumbs and appropriate related-hub links. Empty categories are omitted. Project Management, Process Improvement and Communication & Personal Development remain connected destinations.

In the library, Business initially shows seven collection cards. A collection selector reveals only that collection’s immediate readings and subtopics. “All business articles” provides the complete view. Search still reaches nested readings: an Art of War chapter remains searchable through Strategy & Growth and Business. General search also finds readings moved to another topic.

Seven large featured-hub panels on the library landing page were replaced with compact cards using the existing visual style. No additional top-level topic buttons were introduced for the business subdivisions.

## Editorial changes

- **Customer feedback:** recommendation labels and the customer-service scorecard remain at the existing customer-feedback URL in Sales. Coaching, team huddles and systemic improvement now have a focused `feedback-learning-loops` guide in Operations. The original page explains the distinction and links to the detailed learning guide. Its existing section anchors remain available.
- **Market roles:** the marketing notes’ leader/challenger/follower/nicher definitions and leader response options now join the existing `competitive-actions` reading. Distinct source wording is preserved. The value-disciplines page focuses on efficiency, customer intimacy, product leadership and customer/competitor orientation, with an explicit distinction and link to market roles.
- **Product innovation:** innovation pathways and Lean Startup now sit with product discovery/development. Corporate diversification, acquisitions and build/buy/partner strategy remain in Strategy & Growth, with related links.
- **Operations:** logistics moves to Operations while preserving its URL and detailed commercial/distribution context. Distribution-channel choice and channel-partner management remain separate linked marketing readings.
- **Personal work:** personal productivity and the cross-method prioritisation comparison move to Communication & Personal Development. Kanban, goals and Pareto’s individual/team/company examples remain discoverable through Operations, with project/personal-context links.
- **Negotiation, risk and stakeholders:** general negotiation sits with Leadership and links to Sales/Communication. Business risk and stakeholder responsibility remain distinct from their project-specific counterparts and link across.
- **Historical strategy:** all 13 Art of War chapters retain their original sequence and specialist presentation under Strategy & Growth → The Art of War.

## Preservation and discovery

All 258 earlier generated guide/index URLs remain available, with all earlier guide-detail section identifiers retained. All 10,189 previously displayed detail strings remain accessible across the reorganised readings. Source archives and inventories are unchanged. The six source ledgers retain the same original text/hash items; only deliberate destination mappings change.

Four new URLs are added:

- `/library/knowledge/strategy-growth/`
- `/library/knowledge/leadership-change/`
- `/library/knowledge/operations-performance/`
- `/library/knowledge/feedback-learning-loops/`

No redirects are needed because earlier URLs remain valid. The catalogue automatically updates the combined sitemap, content sitemap and human-readable content index. All 367 current knowledge URLs are verified in preview discovery and return HTTP 200. Publishing these changes requires the next authorised push; this report does not claim a live deployment or confirmed Google indexing.

## Engineering and verification

Collection parentage and article membership are generated from the reviewed content plans. One lightweight navigation manifest supports the shared breadcrumbs, direct membership and ancestor-aware search. Generator assertions reject invalid/cyclic parents, duplicate primary homes, broken related destinations and unfiled business entries. The obsolete root-only manifest and unused featured-panel styles are removed. Existing consent-aware advertising remains in the shared layout.

Typecheck, optimized production build, full repository lint, three navigation unit tests and both library browser tests pass. The broader review covers 86 mobile/desktop renders, 18 accessibility audits, collection membership, empty categories, anchors, related links, canonicals, filter reset, all-article mode, nested search and moved-guide search. All 367 catalogue routes return HTTP 200 and appear in the combined/content sitemaps and content index.

Evidence: [preservation and navigation checks](verification/business-reorganisation.json), [browser and discovery checks](verification/business-reorganisation-browser.json), [updated source ledger](business-content-coverage.csv), [updated marketing ledger](marketing-content-coverage.csv).

Graphify’s bounded architecture graph is refreshed after structural changes. Scratch work and preview build files remain outside tracked source, and the preview server is stopped after review. Unrelated user changes are preserved. No dependency, public source-image asset or content unit-test suite is added. No push is performed; actual Google indexing and live deployment are not verified.
