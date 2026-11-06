# Budgeting, costing, finance and investment: upload review

Initial review, before implementation. At review time no site content, catalogue, sitemap, commit or deployment changes had been made for this upload. The later local implementation is documented in [the implementation report](finance-investment-library.md).

Archive SHA-256: `1cee9fd7808edfacc92463150066dd4eeee13149b9a075fea108822c52024615`.

## Recommendation

Expand the existing **Finance & Accounting** hub, with two focused additions: **Costing & Management Accounting** and **Investing & Portfolio Management**. Enrich existing budgeting, valuation and financial-performance readings instead of creating competing introductions. Keep specialist material such as pitch decks, strategic resources, physical commodity terminology and payments in the destinations that match its meaning.

The main reader distinction should be managing a business's costs and finances versus understanding investments and portfolios. Both belong within the finance entrance, but readers should not have to sort through one mixed document-shaped list.

## Material examined

All body text was read and all three embedded images were visually reviewed. Extraction files are outside Git at `/mnt/sdb/ig-new-review/finance-investment/`.

| Internal source reference | Nonempty paragraphs | Approximate words | Tables | Images |
| --- | ---: | ---: | ---: | ---: |
| Budgeting.docx | 146 | 1,116 | 12 | 2 |
| Costing.docx | 148 | 890 | 8 | 0 |
| Finance.docx | 53 | 280 | 4 | 1 |
| Investment.docx | 575 | 3,071 | 13 | 0 |
| Total | 922 | 5,357 | 37 | 3 |

No native equations, external document hyperlinks, substantive auxiliary text, embedded spreadsheets or charts were found. Expressions are ordinary text; the pension ranking is an image. No unavailable-download placeholders were found. There is incomplete prose and substantial name-only material, described below.

## Classification and reader flow

| Destination | Contents and proposed presentation |
| --- | --- |
| FP&A, Budgets & Forecasts | Enrich `budgeting-methods` with static/flexible/rolling/activity-based comparisons. Separate budget preparation/control and variance investigation into focused readings. Rebuild the two budget diagrams as linked operating, working-capital and cash-budget maps. Preserve planning stages, behavioral limitations and the purchasing-manager variance example. |
| New Costing & Management Accounting collection | Margin versus markup; decision-relevant, sunk and opportunity costs; cost behavior; cost drivers; full/job/batch/absorption costing; activity-based costing; gross profit versus contribution; margin of safety and operating gearing. Use compact comparisons and formula panels, explicitly marking concepts supplied only as names. Link project-cost estimation without burying general management accounting under Project Management. |
| Valuation & Transactions | Extend existing capital-project/DCF readings with NPV, IRR, payback and profitability-index comparisons. Integrate shareholder-value analysis and the Gordon dividend model with existing valuation material. Separate project profitability from public-market portfolio performance. |
| New Investing & Portfolio Management collection | Four reading sections: assets and investment vehicles; portfolio construction and maintenance; risk/performance measures and models; private capital and investment research. Provide a classified reference, model comparisons and checklists, rather than one long glossary or a page for every short label. |
| Private-capital section, cross-linked to Valuation & Transactions | PE/VC strategies, exits, investment stages, the due-diligence roadmap, MOIC/IRR distinctions and pro-rata terminology. Preserve the stage comparison and all supplied firm names as historical examples, with uncertain figures labelled. A diligence checklist is a useful reader format; no investment suitability score is supplied. |
| Product Development & Innovation | A pitch-deck guide for the supplied problem, solution, product, market, competitor and team sections. Link existing market sizing, positioning, concept testing and strategy. Explicitly identify the unfinished product passage; do not claim the six sections form a complete universal fundraising deck. |
| Existing Payments readings / Finance controls | Separate payment services, standards/messages, interfaces and ambiguous labels. Connect existing `payments`, `payment-stack` and `payment-providers` where appropriate. Present the brief money-laundering passage as financial-crime awareness and terminology, with prevention context and primary references. |
| Strategy & Growth / Operations | Merge the resource categories and capability discussion into `resource-base`, with VRIO links. Place the short scaling/accountability/antifragility reflections in organizational strategy or operating-practice material, labelled as supplied observations rather than investment rules. |
| Commodity reference linked from investing and physical trade | Distinguish investment exposure from product/trade terminology. The petroleum grades, fuel labels, sulphur numbers and UREA list should not become a list of interchangeable asset classes. Preserve the source labels; do not infer product specifications or transaction instructions from abbreviations. |
| Investing → Institutional investors and pension funds | A clearly dated historical pension-ranking reference: accessible data table, country filters if useful, compact summaries and original source attribution. Preserve all 100 entries and chart annotations through image/data reconciliation before implementation is considered complete. |

Suggested titles include “Build a Budget and Investigate Variances,” “Margin, Markup and Contribution: Know the Difference,” “Choose a Capital-Investment Measure,” “Assets, Funds and Strategies: Different Layers of an Investment,” “Read Portfolio Risk Measures,” and “Private Capital: Stages, Diligence and Exits.”

## Important editorial corrections and uncertainties

### Budgeting and costing

- Budgeting paragraph 36 says a static budget is prepared at the start when actual output is known; this conflicts with its surrounding planned-versus-actual distinction. Paragraph 28 appears to place a financial-budget description under cash budget. These need visible clarification with source wording retained.
- The rolling-budget example runs from April 2018 to March 2018. The likely intended end date is March 2019; mark that correction rather than silently changing the source.
- Margin/markup conversions use fractional rates, while adjacent expressions multiply by 100. Explain percentage-versus-decimal inputs explicitly.
- Gross profit is described as subtracting direct costs, but the same source includes manufacturing overhead in cost of goods sold. Distinguish the source's shorthand from the intended cost basis; also distinguish gross-profit amounts from gross-margin percentages.
- The IRR expression contains “NPB” and depicts a limited cash-flow form. Retain the original, explain the full cash-flow/time basis and flag multiple/no-IRR cases rather than repeating the instruction to avoid any cash flows containing both signs. The supplied payback shortcut assumes level annual inflows; it is not a universal payback formula. [OpenStax's IRR treatment](https://openstax.org/books/principles-finance/pages/16-3-internal-rate-of-return-irr-method) provides an educational cross-check.
- Several cost categories, margin of safety and operating gearing are only named or briefly described. They are not complete worked methods. No company budget, variance dataset or completed ABC allocation is supplied.

### Investing and portfolios

- There are **29 numeric “Risk” labels**, ranging from 1 to 99, without scale definition, horizon, currency, methodology or source. Preserve them as unverified source annotations; do not turn them into official ratings, a sortable safety league or personalized allocation advice.
- Asset classes, product wrappers, strategies, institutions and contract features are mixed. ETFs/ETNs, hedge funds, private equity, structured products, loans and derivatives need separate classifications; retain cross-associations rather than forcing a single flat asset list.
- “Hedge funds: unregulated” is too broad. The SEC describes registration and regulatory distinctions, not a blanket absence of regulation. The US-specific context should remain explicit. [Investor.gov: hedge funds](https://www.investor.gov/introduction-investing/investing-basics/investment-products/private-investment-funds/hedge-funds).
- PE minimums, holding periods, the Angel-to-Buyout investment-size table and its very high IRR/multiple targets have no supplied dates or evidence. They are source examples, not current market benchmarks or promised returns. Firm/stage associations also require historical context.
- Risk/performance entries are introductory labels, not full models. Sharpe, beta, BARRA, information ratio, the information coefficient, BSM, duration and “maximum variance” need definition/version checks. The four consensus/flash/stock-return/neglect expressions lack necessary variable definitions or model provenance; retain them in an explicitly incomplete-model section, not a functioning stock predictor.
- The stock-market zero-sum claim, generalized fraud-like claims about mutual funds, return expectations and forecasting aphorisms need separation from established definitions. Quotations and the history-of-ideas name pairings have no adequate source citations.
- The statement that strong early returns always beat strong late returns needs cash-flow context. Without contributions or withdrawals, simply changing the order of the same multiplicative returns does not change terminal wealth. The +10%/−10% example can explain arithmetic versus compounded return without inventing a market dataset.
- The stock/bond weight-times-volatility expression is a limited two-asset balancing relation, not a complete multi-asset optimizer. No return series, covariance matrix, investor constraints or calibrated portfolio is supplied.
- The pitch-deck product passage ends “Everything you have to explain about your”. Its continuation is missing. Other ideas such as “disentangling and purify” are too abbreviated to expand confidently without marking editorial interpretation.

### Payments and financial crime

The list mixes named services, payment/message standards and undefined labels such as IPID, IPIP, ONEWAY and generic server/ledger transfer phrases. Do not assume that every label identifies an official or usable banking method. Retain ambiguous terms as requiring identification; verify each against its operator or standard owner before writing operational explanations.

MT103/MT202 material needs historical and current-context separation. Swift's migration guidance is specific about payment-message scope; corporate and infrastructure arrangements have exceptions. Avoid a universal claim that every MT message disappeared. [Swift's instruction-message migration overview](https://www.swift.com/news-events/news/iso-20022-bytes-payments-focus-instruction-messages-november-2025), [Swift's corporate guidance](https://www.swift.com/de/node/309567).

The placement/layering/integration material can be retained as a brief awareness model, replacing the source's instructional tone with descriptions of suspicious conduct. Do not imply that all banks, transfers, cryptocurrency or high-value purchases are illicit. [FATF's explanation](https://www.fatf-gafi.org/en/pages/frequently-asked-questions.html) and the [FFIEC overview](https://bsaaml.ffiec.gov/manual/Introduction/01) support that classification.

## Image provenance and presentation

The two budget diagrams should be reconstructed in the site's typography and colors, with short text explanations. Their connection lines and the production/sales ordering need interpretation, not blind tracing. A budget map should explain the direction of the underlying assumptions and cash consequences.

The large pension image is identifiable: **Visual Capitalist, “Ranked: The World's 100 Biggest Pension Funds,” published 24 November 2022; research/writing Jenna Ross, design Sam Parker, citing Thinking Ahead Institute**. It labels the ranking 2021 and contains footnotes with differing reporting cutoffs and exceptions. Those dates must accompany the data; this is not a current top-100 ranking. The original publisher page supplies a structured 100-row table useful for checking the image. [Original chart and table](https://www.visualcapitalist.com/worlds-100-biggest-pension-funds/).

Prefer an accessible historical table and restrained country/size summaries, with a source link and retained original in the editorial archive, instead of putting the huge copied infographic in the article body. Preserve the legend, reporting notes, country annotations and collaborator credits alongside the source record.

## Preservation and implementation scope

Keep all unique supplied information reader-accessible: source formulas, risk annotations, stage/firm lists, product labels, checklist questions, short observations and image-derived data. Consolidate overlaps with the accounting library while keeping every source association in a coverage ledger. Corrections and added explanations must be distinguishable from the original wording. An archive alone does not count as publishing the content.

Do not invent missing continuation text, model coefficients, risk scores, benchmark returns, a completed pitch deck, bank procedures or investment recommendations. If calculators are added later, use separately reviewed formulas and clearly stated assumptions; this upload alone does not justify a portfolio optimizer or investment-ranking tool.

Implementation should include category navigation, related-reading links, canonical/discovery registration and the combined sitemap/content index. The current review has changed none of those. Detailed figure/table mapping and item-level verification remain implementation work; this report does not claim that every financial assertion has been validated.
