# Marketing, brand and product library

The refreshed upload is curated into **49 new guides in three collections**, with **nine existing guides expanded**. All **2,495 paragraphs and 16 images** are mapped. Exact repetition is consolidated without discarding distinct source wording. The original archive is retained privately in the repository; it is not copied to the public downloads directory.

## Reader routes

- [Marketing Strategy & Execution](https://insightginie.com/library/knowledge/marketing-strategy/): 23 guides covering customer value, segmentation, targeting, positioning, pricing, channels, communication, digital activity, planning and international decisions.
- [Brand Strategy & Experience](https://insightginie.com/library/knowledge/brand-strategy/): 16 guides covering identity, awareness, equity, valuation, communication, relationships, experience, architecture and extensions.
- [Product Development & Innovation](https://insightginie.com/library/knowledge/product-innovation/): 10 guides covering product levels, services, development, testing, lifecycle, adoption, design sprints, Kano and Lean UX.

Each collection sits under Business & Management, offers reading paths and topic groups, and connects to relevant existing strategy, sales, customer, innovation, project and quality material. Marketing and Brand positioning material share one guide. Three-layer and five-level product models share a comparison. Repeated digital material has one canonical treatment. A Bullseye channel inventory and direct-response guide make those distinct subjects easy to find.

## Content and traceability

| Document | Paragraphs | Images | Treatment |
| --- | ---: | ---: | --- |
| Product.docx | 302 | 2 | Product/service, development, testing and learning guides; innovation material extends the existing innovation guide |
| Brand.docx | 821 | 4 | Brand collection; positioning joins the marketing guide |
| Marketing.docx | 1,372 | 10 | Marketing collection; product/service and relationship passages join their meaningful destinations; strategy/customer passages extend existing guides |
| Total | 2,495 | 16 | No unmapped items |

Archive SHA-256: `3820e4d4ee3fc7dc67d9050f49e4630c6cff671262d77894494012f22409b054`.

The [coverage ledger](marketing-content-coverage.csv) records original paragraph positions and image hashes against destinations and sections. The [inventory](../content/sources/business/marketing/editorial/inventory.json) retains original text, styles, table positions and media fingerprints. The [reviewed plan](../scripts/content-business/marketing-plan.json) records editorial classification, introductions, section boundaries, subheadings, further reading and limitations. The [figure plan](../scripts/content-business/marketing-figures.json) records all image reconstructions.

The generator asserts every non-structural passage remains in displayed detail, validates image coverage, verifies the pinned archive and resolves related links and collection categories before writing. An assert-based self-check verifies that merging repeated passages retains distinct wording and tables and is idempotent. Three flattened comparisons are rebuilt as tables: the seven-item customer scorecard, five company examples, and corporate versus product branding.

All 206 earlier guides remain present, with earlier sections and figures unchanged. All 97 catalogue entries outside the generator’s ownership are unchanged. Nine earlier guides receive source sections, reading notes and related links: competition landscape, competitive positioning, customer feedback, customer systems, innovation pathways, strategic business units, strategic management cycle, strategic thinking and value chain.

## Visual treatment

All 16 images were reviewed and reconstructed as themed, accessible comparisons or compact visual summaries. No oversized source raster is shipped. Two bounded SVG plots explain lifecycle and adoption patterns; they are explicitly conceptual and unscaled, with readable HTML axis labels, text legends and accompanying tables. Tables remain keyboard accessible and scroll within their panel on small screens, with a visible scrolling hint.

The reconstructions retain the STP tasks, value-position grid, Tesla canvas labels, adopter shares, communication tactics, 17 Bullseye channels, orientation matrix, planning/control feedback, global adaptation examples, valuation branches, relationship patterns and all 15 printed model paths/coefficient labels. The original drawings remain recoverable from the archive.

## Missing, uncertain and corrected material

- **Targeting:** the source’s “Concentration” repeats mass-marketing descriptions, while “Undifferentied” describes multiple offers. A corrected comparison sits alongside retained source wording.
- **Valuation:** financial valuation, customer-based equity and accounting recognition are different. The blanket balance-sheet claim is qualified using IAS 38; historical Interbrand weights are not advertised as current methodology. No cash-flow forecast or discount rate is supplied.
- **Perceptual map:** visible bubbles are 1, 2, 3, 4, 5 and 7; no 6 is visible. Brand identities, sample, measurement procedure and bubble-size key are absent. None are inferred.
- **Bullseye:** the outer ring names 17 channels; the six middle and three inner slots are empty. No selected winners or test results are invented.
- **Research diagram:** all 15 paths and the literal `*` / `**` marks remain available, but sample, estimation context and significance-key definitions are missing. Related experience research is linked without claiming authentication of this exact figure.
- **Survey and corporate claims:** scorecard percentages, brand-experience statistics, failure rates, market shares, Google practices and platform descriptions lack sufficient study details or dates. They remain identified historical study claims rather than current benchmarks.
- **Model variants:** three product layers versus five levels, different personality constructs, and the source’s five-phase sprint versus Google’s six-phase Sprint Kit remain distinguished. “Geunes” likely means Geuens; “Staple” remains unresolved.
- **Incomplete fragments:** Samsung’s acquisitions section repeats its accelerator explanation; the missing acquisitions account is not fabricated. The green-marketing fragment is separated from its misplaced relationship-spectrum heading. Supply analysis, completed Kano/SERVQUAL instruments, ROI inputs and completed market tests are not supplied.
- **Historical/legal context:** the R-22 example is identified as historical, country-etiquette claims as unsourced generalizations, and trade/contact/trademark terms as introductory outlines rather than current jurisdiction-specific instructions. Tesla canvas features are an undated exercise.
- **Conceptual models:** lifecycle, diffusion, relationship curves, CLV purchase streams and prestige-price observations are not turned into forecasts or calculators without the missing assumptions and data.

Relevant primary-source links appear beside affected guides: Strategyzer, Interbrand, IFRS, Google Sprint Kit, MSI/Keller, the original brand-experience journal paper, USPTO, Smart Insights and EPA. These references clarify specific issues; they do not authenticate every supplied note.

## Git integration and discovery

`git pull --no-rebase origin main` merged cleanly as `fbbeb14`, incorporating remote commit `489c91e` and preserving local work. The remote household-versus-individual-income guide is retained, with JSX punctuation escaped for lint and its previously missing sitemap/content-index registration added. No uncommitted user files were staged or reverted.

The 52 new library URLs are discovered automatically from the published catalogue in the combined XML sitemap, content sitemap and human-readable content index. The pulled static guide is registered in the combined sitemap, site sitemap and content index. Existing consent/privacy-aware advertising remains in the shared layout; no tracking or advertising integration is added.

The final review passes 136 mobile/desktop renders, 16 accessibility audits, 32 visual checks and 5,662 displayed-passage comparisons. All 64 reviewed library URLs and the pulled static guide appear in the applicable XML sitemaps and human-readable index.

Graphify’s bounded architecture graph is refreshed after the generator and renderer changes: 887 nodes, 1,593 edges and no dangling endpoints in the merged graph.

Validation evidence: [source and preservation checks](verification/marketing-library.json), [mobile/desktop browser checks](verification/marketing-browser.json). No content unit-test suite is added. Production build, typecheck, lint, source-retention assertions, link/canonical checks, table/visual checks and accessibility audits cover this change. Preview processes are stopped after review. No push or live deployment is performed.
