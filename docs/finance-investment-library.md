# Budgeting, costing and investment library

Implemented locally from the approved [review](finance-investment-content-review.md): **26 new guides, two collection indexes, source additions to five existing readings, and link/context updates to two more**. The catalogue grows from 458 to 486 knowledge URLs. The new work is not pushed.

The previous business reorganization, accounting library and people/leadership work were pushed first, through `088a2d5`, as requested. Public requests from this environment returned HTTP 403, so the push is confirmed but the resulting Cloudflare deployment was not independently confirmed here.

## Reader structure

Finance & Accounting now has ten focused collections. Its three reading paths distinguish understanding the numbers, planning/controlling a business, and evaluating investments. Business & Management retains its seven subject entrances.

| Destination | Material |
| --- | --- |
| New Costing & Management Accounting | Margin/markup, relevant and opportunity costs, cost behavior/drivers, full/absorption costing, ABC and gross profit versus contribution |
| New Investing & Portfolio Management | Assets and vehicles; allocation, exposure and upkeep; risk/evidence/research; private capital and institutional investors |
| Existing FP&A, Budgets & Forecasts | Expanded budget-method comparison, budget preparation/control and variance investigation |
| Existing Valuation & Transactions | Capital-appraisal comparison; shareholder-value and dividend-model context; related cash-flow readings |
| Existing Product Development & Innovation | Six-section pitch-deck guide, with the missing product continuation identified |
| Existing Finance controls | Payment-transfer terminology and financial-crime awareness, linked to existing Payments readings |
| Existing Strategy / Operations | Resource systems and capabilities, scaling reflections and the short antifragility reference |

The investment list is classified by meaning rather than its original heading. Assets, vehicles, contractual features, institutions and strategies remain distinct. Physical fuel/product terms have a separate reference. Cost-driver examples and asset annotations use compact tables, so related terms and descriptions remain together. General costing is connected to project costing without being placed entirely under Project Management.

## Source preservation

Archive SHA-256: `1cee9fd7808edfacc92463150066dd4eeee13149b9a075fea108822c52024615`.

| Supplied document | Nonempty paragraphs | Approximate words | Tables | Images |
| --- | ---: | ---: | ---: | ---: |
| Budgeting | 146 | 1,116 | 12 | 2 |
| Costing | 148 | 890 | 8 | 0 |
| Finance | 53 | 280 | 4 | 1 |
| Investment | 575 | 3,071 | 13 | 0 |
| Total | 922 | 5,357 | 37 | 3 |

All paragraphs and images have destinations in the [925-row coverage ledger](investment-content-coverage.csv). The [inventory](../content/sources/finance/investment/editorial/inventory.json) retains original wording, table/cell positions and document/media hashes. The original archive is stored beside it. Unique substantive text is reader-accessible; archive storage alone is not counted as publication.

All earlier URLs, guide sections, figures, visual explanations and 135 formula entries remain unchanged. The new material extends existing guides instead of replacing older batches. The source builder checks archive fingerprints, complete paragraph/image coverage, reviewed expressions, valid destinations and the complete pension ranking before writing generated catalogues.

## Expressions and uncertain material

The shared formula reference adds **17 costing/investment entries**, making **152 source entries** in total. Four new analyst-signal expressions remain unresolved, so the combined reference has eight entries marked as needing clarification. These counts describe source entries, not unique universally valid identities.

New panels cover margin/markup conversions, NPV, IRR, simple payback, profitability index, gross profit/margin, contribution and the limited two-asset volatility relation. Each preserves its original wording in an accessible disclosure, with reviewed units, inputs and scope. The review CSV now records the source document as well as its paragraph, because several documents can share the same paragraph number.

Important distinctions are explicit:

- Decimal rates and percentage display are separated in margin/markup conversions.
- Gross profit and contribution use different cost boundaries; direct costs are not silently equated with the applicable cost of goods sold.
- IRR's typo and incomplete cash-flow form are corrected, with multiple/no-IRR limitations. The level-inflow payback shortcut retains its assumptions.
- Consensus, flash, stock-return and neglect expressions lack definitions or model provenance. They are retained as incomplete references, not executable prediction tools.
- All **29 numeric risk labels** are retained as unverified source annotations. They are not calibrated ratings or portfolio recommendations.
- PE stage sizes, holding periods, return targets and firm associations are undated source examples. All supplied firm names remain in the comparison.
- The pitch-deck product sentence is unfinished. No missing continuation, traction figures, financial forecast or fundraising ask is invented.
- Undefined payment labels remain unidentified; provider names are not endorsements. Legacy message references have scope notes and primary Swift links.
- The laundering passage is retained as educational source wording about suspicious conduct, with an explicit awareness context and a primary reference.
- Investment aphorisms, quotations and historical-name pairings are separated from established definitions. The return-sequence claim is explained using its cash-flow assumptions and the supplied compounding example.

Primary further-reading links support associated explanations, including OpenStax, Investor.gov, William Sharpe's paper, Swift and FFIEC. They do not authenticate every assertion in the supplied notes. No portfolio optimizer, model coefficients, investment recommendations or new calculators are invented.

## Visuals and pension data

The two budget images are reconstructed as a planning flow and a comparison of operating, working-capital and cash-budget relationships. Their undirected connections and production/sales ordering are explained rather than blindly copied. All components, including purchases, labor, overhead, R&D, fixed assets, receivables, payables and inventories, remain represented.

The pension infographic becomes a theme-consistent, accessible **100-entry historical table**. The reconstruction retains rank, fund, market and rounded asset amounts, checked against the original publisher's table. It also retains the image's legend meaning, country annotations, collaborator credits and mixed reporting-date/estimate exceptions in readable sections.

Source: Visual Capitalist, “Ranked: The World's 100 Biggest Pension Funds,” published 24 November 2022; research/writing Jenna Ross, design Sam Parker; underlying credit Thinking Ahead Institute / Pensions & Investments, September 2022. The graphic labels the ranking 2021. Its Electricity Supply Pension bubble incorrectly repeats rank 90; the graphic's top strip and publisher's table show 91. That discrepancy is displayed beside the reconciled rank.

These are historical rounded amounts, not a current ranking or a measure of investment quality. Country contribution/benefit statements remain dated chart claims, not present-day financial guidance. No oversized source raster is added to public assets. Source originals remain in the editorial archive; comparisons use contained, keyboard-accessible scrolling on small screens.

## Engineering, discovery and checks

The existing rendering and source pipeline is reused. Reviewed table/pair presentation was extracted into the shared source formatter, serving the people and investment batches without duplicate implementations. Formula rendering supports the new reviewed document entries while preserving existing IDs and originals. No new runtime dependency or scheduled process is added.

The catalogue updates canonical discovery, the combined sitemap, content sitemap and human-readable index in the same change. There are no new static tool routes. Existing consent-aware advertising and privacy safeguards remain in the shared page layout.

Evidence:

- [Preservation checks](verification/investment-library.json): 922 paragraphs, three images, 29 source risk annotations, 100 pension entries, 17 new expression destinations and preservation of earlier content/URLs.
- [Mobile/desktop checks](verification/investment-browser.json): 104 renders, 26 accessibility audits, 44 formula-original checks, six source-visual checks, 2,008 readable field comparisons, all 152 directory links and 486 successful knowledge routes with sitemap/content-index coverage.
- [Final table/navigation checks](verification/investment-final-browser.json): ten additional renders after refining asset, cost-driver and relevant-cost tables and the finance reading paths.
- TypeScript and production build pass. The three existing library navigation/formula-reference browser checks pass; their counts now follow the catalogue instead of assuming eight finance collections and 135 formulas.
- Graphify's bounded architecture graph is refreshed. Its existing extraction limitations remain documented in the Graphify README.

No new content test suite is added. Temporary extraction scripts, screenshots, browser profiles and preview data remain outside Git under `/mnt/sdb/ig-new-review/finance-investment/`. The owned preview server is stopped after verification. Missing source definitions and unverified claims remain disclosed; local checks do not establish deployment or Google indexing.
