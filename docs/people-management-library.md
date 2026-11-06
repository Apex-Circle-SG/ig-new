# Leadership, people and management library

Implemented locally from the reviewed upload: **31 new guides/reference pages, four new collection indexes and additions to eight established guides**. The existing Leadership & Organizational Change entrance is now **Leadership, People & Change**, at its original URL. The catalogue grows from 423 to 458 knowledge URLs; none of the earlier URLs are removed. This change is not pushed or deployed.

## Reader organization

| Destination | What readers find |
| --- | --- |
| Leadership, People & Change → Leadership & Organizational Culture | Leadership/management, situational leadership, managerial grid, behaviors, Maxwell principles, culture, identity, power and existing team/alignment readings |
| Leadership, People & Change → Organizational Change & Development | Problem diagnosis, uncertainty, structure, change approaches, motivation, Change Delta, organization development and enriched existing change readings |
| Leadership, People & Change → People & Employee Experience | HR operating models, talent lifecycle, wellbeing, fairness, engagement, employee voice and quiet-quitting notes |
| Operations & Performance | Executive KPI directory; purpose-to-performance alignment; enriched OKR/KPI/CFR comparison |
| Problem Solving | Six Thinking Hats, critical-thinking/writing principles, all 48 questioning prompts and critical/tame/wicked problem distinctions |
| Communication & Personal Development | Emotions, relationships, influence, conflict, feedback awareness, the 20-prompt energy reflection, and enriched prioritization/productivity readings |
| Personality Narratives & Workplace Metaphors | All 26 SBTI descriptions, ten meeting caricatures and the four-animal performance/commitment model, clearly distinguished from validated assessments |
| Beliefs & Mysteries | Hawkins's complete 17-level spiritual table, with its evidence and measurement limitations |
| Process Improvement / Product & Innovation | Constraints-cycle reading and an integrated four-type innovation comparison |

Business Management retains its seven focused entrances. Leadership's three new child collections keep the expanded people material out of the Business gateway's direct article list. Existing negotiation readings remain connected through the leadership entrance. Existing guide URLs and all their earlier sections, figures and visual explanations are retained.

## Executive KPI directory

The source supplies **314 role/metric occurrences**, organized into **272 distinct normalized display names**. CEO has 57 source entries, CFO 54, COO 57, revenue leadership 48, people/HR leadership 55 and CMO 43. Repeated names share an entry, while potentially different scopes remain separate.

Readers can search normalized names and original wording, filter by role and subject, and expand original wording/role context. Every original occurrence remains attached, including repeated occurrences within a role. All entries are present in the initial server-rendered directory; they are not dependent on a load-more action for access. Topic-specific cross-links connect measures with existing customer economics, financial ratios, cash flow, forecasts, marketing, people and other readings.

Most entries are names, not complete metric specifications. The directory explains what to define before use and does not invent formulas, benchmarks, index algorithms or survey instruments. Cross-links give related context rather than pretending every entry has a verified formula.

The source has two “CRO KPIs” headings. The first concerns revenue; the second lists HR measures. The latter is labelled People / HR leadership as an explicit editorial inference. Original classification and that caveat remain available. Obvious display-name corrections retain the exact supplied wording in disclosures; uncertain repairs such as “Londorship”, “Randy”, “processors” and an incomplete financial-information label have individual notes. OEE's standard expansion is linked to a primary specialist source.

## Source preservation

The [review](people-management-content-review.md) records the inventory, source map and original proposal. Archive SHA-256 is `4e3fd4f581ee5f1d34b5cbf11166151aa547e34dcf88ae6314a89a526e2c2a13`.

All **1,659 nonempty source paragraphs, approximately 13,201 words, 51 tables and nine embedded images** are inventoried. The [coverage ledger](people-content-coverage.csv) maps every paragraph and image to a reading/section or reconstructed figure. The [inventory](../content/sources/business/people/editorial/inventory.json) preserves exact text, paragraph/table-cell positions and document/media hashes. The original archive is retained beside it.

Unique substantive text is reader-accessible, not merely stored in the archive. Layout tables are reflowed into prose, reference cards or meaning-preserving comparisons. Reflowed material includes structural configurations, change approaches, the talent lifecycle, organizational justice/participation, energy score bands, the feedback matrix, OKR/KPI/CFR notes and the Hawkins table. Exact repeated source passages can share a displayed treatment; distinct wording and every source position remain mapped.

Eight established readings receive additions rather than competing introductions: change communication planning, change responses, Kotter, personal productivity, prioritization methods, innovation pathways, principled negotiation and OKR goals. Existing sections and visual explanations remain intact. Builder checks prevent a new archive from silently replacing older batches or dropping paragraphs, metric associations or image destinations.

## Visuals and uncertainty

All nine raster figures have readable reconstructions using the existing site presentation: the change curve, grid/group perspectives, situational styles, Eisenhower matrix, skill/leverage matrix, constraints cycle, innovation types, workplace energy quadrants and managerial grid. The managerial grid includes a compact 9×9 SVG and a text comparison. No new oversized raster image is shipped in public assets. Wider tables scroll within keyboard-accessible regions on mobile.

The change curve is illustrative and unscaled. The situational figure's outer axes mix ability with required guidance and commitment with required support; that ambiguity is explained rather than silently mapped to another model. Grid/group cultural perspectives are distinct from the managerial grid. Dollar/hour values are heuristic labels, not earnings evidence. Model descriptions, worldview examples and quadrant explanations remain accessible in text.

Explicit gaps and limits include:

- Two unavailable-download placeholders before the SBTI profiles. The attachments are absent; a questionnaire or scoring algorithm is not invented.
- One HR operating-model paragraph ending “…research, and visits to peer”. Its continuation is absent.
- Uncertain graphic origins, quotations, model editions, statistics and forecasts. Supplied statements are retained with their status; they are not presented as current verified facts.
- Hawkins's numerical table is an attributed spiritual framework without supplied physical units, measurement protocol or empirical validation. It is separate from the workplace reflection checklist.
- The energy checklist retains all 20 statements and original category/overall bands. Source words such as “Burned out” are not a clinical diagnosis or an instruction to label employees.
- SBTI and animal labels are retained as satire/narratives or unvalidated metaphors. Staffing recommendations, personality judgments and automatic dismissal rules are not derived from them.
- Key results are clarified as measurable outcomes. The mixed original OKR/KPI examples remain visible as source notes, accompanied by a corrected conceptual comparison.

Further-reading links support the associated models or corrections, including Kotter, de Bono, the Center for Leadership Studies, Intercom's RICE explanation and OEE. They do not authenticate every supplied statement. Existing consent-aware advertising and privacy controls remain in the shared page layout.

## Discovery and verification

The catalogue drives the combined sitemap, content sitemap, canonical URLs and human-readable content index. The new and relocated entries are registered in the same change. No new static tool routes are introduced.

The production build and TypeScript check pass. Source assertions cover every paragraph and image, all 314 metric associations, valid metric references and the five managerial-grid coordinates. Comparison with the previous commit confirms that earlier URLs, sections and visuals remain present. Graphify's bounded architecture graph is refreshed; its extraction limits remain documented in `scripts/graphify/README.md`.

[Preservation evidence](verification/people-library.json) records inventory, destination and previous-content comparisons. [Browser evidence](verification/people-browser.json) records 106 mobile/desktop renders, 22 accessibility audits, 18 source-visual checks, 3,082 readable source-field checks, metric filters/disclosures, 458 successful knowledge routes and complete sitemap/content-index discovery. After refining metric-specific related readings, [targeted final checks](verification/people-kpi-browser.json) recheck the directory at both widths, every original metric occurrence, all context links, filters, disclosures and 51 linked reading routes. Screenshots and temporary extraction tools stay outside Git under `/mnt/sdb/ig-new-review/people-management/`.

No new automated tests are added for the content itself. Verification focuses on source preservation, changed directory behavior, navigation and presentation. Local verification does not establish live deployment or guarantee Google indexing; the supplied missing attachments and unresolved attributions remain unresolved.
