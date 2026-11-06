# Deal models and calculator opportunities — review and proposal

Reviewed 6 November 2026. **Proposal only: no application changes, commit or push.**

Upload SHA-256: `832858de004964d5fe9819dcbb3685569f718081bdd1c8d7275754f17c3320ec`.

## Recommendation

Build a connected **Corporate Finance & Deals** calculator collection, a separate **Trading & Markets** tool, and clearly identified diligence/integration planning tools. Preserve the explanatory documents as curated knowledge with appropriate destinations. Use the supplied spreadsheets as reviewed source models and examples; rebuild their calculations with explicit inputs and independent checks rather than presenting the workbooks as validated applications.

The upload contains **12 files: five DOCX and seven XLSX**. I inspected all document text, both document images, all 25 worksheets, formula families/shared formulas, named-range definitions, auxiliary parts and the 12 embedded VWAP charts. The documents contain **1,672 nonempty paragraphs, 12,888 words and 63 tables**. The worksheets contain **101,504 populated cells, including 90,634 formula cells**. Most formula cells are repeated Gantt/calendar or price-bucket scaffolding, not separate financial concepts. No hidden worksheets, rows or columns, workbook external-link parts or VBA project were found in this upload. The inspected formula cells have no cached calculated values, so the absence of cached Excel errors is not validation of the models.

## Proposed calculator groups

| Tool group | Inputs and resulting behavior | Presentation and source scope |
| --- | --- | --- |
| Acquisition impact / EPS accretion and dilution | Buyer/target earnings and shares, offer price/premium, cash/stock/debt funding, FX, financing rates, tax and synergies; calculate new shares, ownership, pro forma earnings/EPS, absolute/percentage EPS change, break-even synergies and leverage. Explicitly define timing, costs and excluded accounting adjustments. | Funding and EPS bridges, before/after ownership, price × funding sensitivity grid. Retain the source's eight-sheet SGX/ASX example as a historical case with unresolved reconciliation notes. EPS improvement is distinct from value creation. |
| Debt capacity and debt-service scenarios | Revenue and margin forecasts, capex, working capital, taxes, cash reserve, senior/subordinated debt, rates, maturity/amortization and cash sweep; show supported debt under stated assumptions, cash/debt schedules and coverage. Separate total capacity from incremental borrowing. | Debt paydown and cash charts, leverage/coverage indicators, downside growth/rate sensitivities. Rebuild constant and variable-growth modes explicitly; distinguish a repayment model from a simple leverage screen. |
| LBO and recapitalization model | Sources/uses, operating forecast, balance-sheet adjustments, capex/depreciation, working capital, debt tranches/revolver, fees, cash/PIK preferred, ownership/options and exit assumptions; calculate cash/debt balances, sponsor/management proceeds, MOIC and timed IRRs. | Guided assumptions with linked statement/schedule detail, debt waterfall, return drivers and exit-year × multiple sensitivities. Preserve both LBO and recap modes and the nine-sheet source scope, with unresolved dependencies corrected before publication. |
| Valuation and deal-pricing workbench | DCF with forecast cash flows and an explicit terminal method; enterprise-to-equity bridge; user-entered comparable multiples; offer/control-premium arithmetic; exchange ratios; synergy value with timing, integration costs and downside assumptions. Cost of capital and NPV/IRR are shared supporting calculations. | Valuation bridges, terminal-value contribution, sensitivities and assumptions beside results. Extend/cross-link existing DCF, cost-of-capital, market-valuation and investment-appraisal guides; avoid duplicate standalone pages for the same formula. Financial synergy valuation requires an explicit new model—the culture workbook does not supply one. |
| SaaS growth and scale planner | Starting ARR, year-by-year growth/retention assumptions, annual ARPA, customer counts, ARR per employee, expense/profit assumptions and funding/valuation scenarios. Show revenue, required customers/headcount and user-defined growth/profitability comparisons. | Editable multi-year table and charts. Preserve the supplied trajectory and funding-stage figures as an attributed example with unknown benchmark vintage. Label the chosen growth/profitability definition. A Rule-of-40 target is not an automatic profit forecast or IPO qualification rule. |
| VWAP and price-volume analysis | Paste/import one instrument's dated price/volume rows, choose a window, units and price basis; calculate a clearly labelled weighted-price measure and retain the source's volume-by-price buckets, turnover relative to shares outstanding and period comparisons. A daily-close × daily-volume input is a proxy, not exact trade-level VWAP. | Price/weighted-price chart, volume-profile histogram, period comparison and data-quality summary. Link from Trading & Market Analysis and takeover-premium explanations. The historical dataset is an example, not a live market feed. |

Inputs should use the existing browser-local tool approach, with clear currency/scale/date conventions, repeatable scenarios, transparent formulas, downloadable schedules and no account requirement. Use charts to explain the calculation rather than reproduce spreadsheet screenshots. Existing advertising/consent safeguards remain applicable.

## Interactive planners and exercises

1. **M&A due-diligence planner:** preserve all supplied requests and consolidate overlapping DOCX/XLSX requests with source mappings. Organize by legal/corporate, finance, commercial, people, tax, operations, IP, IT/security, property and environment. Include owners, dates, evidence/finding status, unresolved issues, completion and a timeline. Task completion does not establish that diligence has passed.
2. **Post-merger integration planner and scorecard:** connect the nine-section plan outline with workstreams, accountable owners, milestones, risks and the source's 100-day/year-one view. Give each metric its own unit, baseline, target, direction and status tolerance; distinguish missing future actuals from zero. Keep recurring savings, one-off cash release, FTE and percentages separate.
3. **Culture comparison exercise:** retain all **46 characteristics across 11 groups**, let users record the two organizations' 1–5 perceptions, show per-item absolute gaps and grouped visual comparisons. Preserve missing ratings and observation context. Do not turn raw ratings into a culture-quality grade or an assumed financial synergy value.

These should appear as **planning tools**, with numerical outputs where meaningful. The original integration DOCX is a heading/template outline, not a completed plan. The culture workbook contains no financial synergy calculation and no existing formulas.

## Knowledge placement and reorganization

| Source material | Reader destination |
| --- | --- |
| M&A lifecycle, deal structures, acquisition motives, funding, diligence, integration, transaction glossary and 31 supplied deal examples | A focused **Mergers, Acquisitions & Integration** collection under Finance & Accounting, connected to Valuation & Transactions. Split long material by reader task and preserve all substantive checklist items and examples. Verify announced versus completed status, dates and source context for historical cases before presenting them as established facts. |
| DCF, multiples, cash flows, capital costs, valuation approaches and purchase-price allocation | Extend the existing valuation guides and formula reference. Cross-link the new workbench and retain source provenance, rather than duplicate those guides under M&A. |
| Strategic alliances, restructuring, build/buy/partner choices | Strategy & Growth and related organization/change guides. Distinguish strategic relationship types from the legal form of a particular transaction. |
| IPO basics, participants and listing pathway | A focused IPO learning guide with jurisdiction/date-specific official sources. The file's Series A term-sheet section belongs with existing Founder Investment Terms, not solely under IPO. |
| Funding stages, SAFE description and startup growth example | Existing funding-readiness/private-capital/ARR guides and the SaaS scenario planner. Correct differences between ownership participation, anti-dilution, option rights and vesting; preserve the supplied wording separately. |
| Four family-office models and the mixed investor/provider list | Investing & Portfolio Management / capital-provider reference. Separate investors, intermediaries and support providers; do not imply everyone listed is an LP. Supplied asset thresholds/costs are not universal eligibility rules. |
| Integration delivery, timelines, governance and culture | M&A as the primary context, with links to Project Management, organizational culture and change management. Do not place the entire upload under Project Management. |

Add tool-to-guide and guide-to-tool links, hub/category entries, canonicals, the combined sitemap, content sitemap and human-readable index in the same implementation change.

## Specific workbook findings that affect implementation

| Source location | Observed issue | Proposed handling |
| --- | --- | --- |
| Accretion model `SGX pl!K8` | Explicit unfinished net-income reconciliation note. | Keep historical financial inputs as source evidence; reconcile or flag the case rather than label the supplied output validated. |
| Accretion model `Tables!D9:H10`, other sensitivity grids | Many sensitivity cells are numeric constants rather than calculations. The “SYNERGY FOR NIL DILUTION” table repeats figures from the pro forma EPS table; its units and links need reconstruction. Labels also retain stale/cross-case wording. | Recompute sensitivity cases from the calculation function. Check funding, EPS, currency and synergy units independently. |
| Accretion model `Assump!G22`, currency inputs | A pounds-million label is mixed with USD-converted SGD/AUD case inputs. | Explicit currency and scale fields; preserve the historical label as a source inconsistency, not the public unit. |
| Debt model `DebtCap!I14`, `D10`, `F43` | I14 is a hardcoded value labelled “VBA Output”; no macro is present. Variable-growth headline mode selects it, and the opening schedule debt uses it even when the headline selects the closed-form constant mode. | Rebuild the capacity calculation/solver and connect the debt schedule to the chosen scenario. Verify assumptions and any constraints before returning a capacity result. |
| Debt model `DebtCap!G26` | “Average” senior-interest label uses beginning debt `F41`, not an explicit average of opening/closing debt. | State the interest basis and apply it consistently; handle zero-rate/equal-growth limits of the closed-form model. |
| LBO model across sheets | Formulas reference `name`, `Company`, `lastyear`, `daterange`, `circbreak` and `amortgoodill`, but the supplied workbook has no defined names. | Recover intended inputs from explicit cells where defensible and document the mapping; flag unresolved names instead of guessing hidden configuration. |
| LBO `Income Statement!H34:L34` | All projected interest rows refer to `$E$67` in the cash/debt schedule, despite the schedule having year-specific interest columns. | Check/fix period alignment. Treat beginning/average/ending-debt interest and circularity deliberately, with convergence/error handling where needed. |
| LBO assumptions and statements | Millions/thousands/per-share scaling and legacy goodwill-amortization choices appear together. | Explicit units and chosen accounting/model conventions. No automatic assertion of IFRS/local accounting compliance. |
| VWAP workbook, both sheets and 12 charts | Main outputs are volume within price buckets, percentage of share capital and percentage of volume by period. The 29 reviewed formula families contain no complete price × volume / total volume VWAP calculation; DAVERAGE supplies arithmetic price averages in support tables. | Preserve the volume-profile analysis and add a separately defined weighted-price calculation. Do not relabel an arithmetic mean or bucket chart as exact market VWAP. |
| VWAP `Dataset!A278` onward | Many annual-group formulas look at the following row's date. | Rebuild row/date-window classification and check inclusive/exclusive boundaries. |
| VWAP `Dataset!F2012:F2013` | Volume cleaning changes from division by `F23=1000` to no division. Some populated older rows therefore have a different scale. | Keep raw volume units; normalize consistently before any aggregation. |
| VWAP `Dataset!F2496:F2497` | `#REF!` appears inside formulas masked by ISERROR; these tail rows have no source price/date observations. | Distinguish blank scaffolding from data and report invalid references rather than silently mask them. |
| VWAP raw input | **2,022 dated price/volume observations**, 1 January 2003–5 November 2010; 43 zero-volume rows. | Preserve source data and units in a clearly historical example. Confirm price adjustment conventions/data provenance before comparative or deal use. |
| Integration scorecard | Literal statuses do not follow a documented calculation; money/FTE/percentages and 1–5 ratings are mixed. | Define metrics and statuses before computing totals or traffic lights. See the detailed methods/template review. |
| Startup example, table 0 | Year 7 shows revenue $144m and EBITDA −$86.4m (−60%) but displays a −42% margin; later margin cells are also misaligned and the final margin is blank. | Retain original values plus separately labelled arithmetic corrections; do not turn the example into a benchmark/default forecast. |

These are inspection findings, not a completed numeric audit or execution/recalculation of Excel models. Empty formula caches are not treated as usable expected outputs. Implementation should include hand-worked cases, accounting identities, scale/currency checks, cash/debt roll-forward checks, and independent scenario comparisons. This is appropriate verification for calculators, separate from adding a content-only test suite.

## Source gaps and corrections for the knowledge content

- The IPO document's Nasdaq section consists of a pointer to a Lark wiki. Its linked listing content is **not included in the archive**; no private-wiki contents or Nasdaq qualification tests have been inferred.
- Startup valuation multiples, typical funding timelines, family-office asset/cost ranges, acquisition timelines and several commercial-software descriptions have insufficient date/population/source context. Preserve as supplied references and mark uncertainty; do not present as current norms.
- Several M&A/legal definitions are overbroad, including stock acquisition as synonymous with hostile takeover, automatic dissolution after an asset/share purchase, and automatic binding effects of term sheets. Correct and qualify these with jurisdiction/context rather than turn them into automated recommendations.
- The supplied Apple/Beats example says $3.2bn and categorizes it as vertical. Apple's own announcement gives a **$3bn** total for Beats Music and Beats Electronics; the strategic classification needs a reasoned explanation rather than automatic inheritance. [Apple announcement](https://www.apple.com/newsroom/2014/05/28Apple-to-Acquire-Beats-Music-Beats-Electronics/).
- The growth/profitability rule needs an explicit definition: Bessemer's own teaching paper uses ARR growth plus FCF margin. That does not establish the source's EBITDA-margin forecast or a universal startup trajectory. [Bessemer source](https://www.bvp.com/assets/uploads/2022/07/bessemer_whitepaper_ten_lessons_vertical_software_investing_v2.pdf).
- The SAFE and preferred-stock terms should be compared with their actual instrument/context. Useful primary model-document context: [Y Combinator SAFE documents](https://www.ycombinator.com/safe), [NVCA model legal documents](https://nvca.org/model-legal-documents/).
- Preserve the Smartsheet attribution clues on the supplied planning templates and the debt model's Alexander D. Jarvis credit. Separate adapted source material from newly authored explanations and calculation methods; do not claim the templates are original site content.

The complete original archive, each source file, workbook cells/formulas, repeated-formula ranges, document paragraph locations, example inputs, images and chart references should remain traceable. Reader-facing pages should use meaningful titles and organize repeated material without deleting unique information. Historical data belongs in an inspectable example/data view rather than thousands of cells pasted into an article.

## Delivery order

1. Preserve/inventory the sources and curate the knowledge destinations and calculator specifications together.
2. Build acquisition impact, debt-capacity and VWAP/volume-profile tools with independently checked outputs and visuals.
3. Complete the linked LBO/recapitalization model and valuation workbench; use shared cash-flow/valuation methods to avoid duplicated inconsistent logic.
4. Finish the SaaS scale planner and diligence/integration/culture tools, with the complete prompts, source links and metric definitions.
5. Verify all source coverage, calculator behavior, scenarios, navigation, responsive presentation, privacy/consent behavior and sitemap discovery. Commit locally; push only on explicit instruction.

All groups above are part of the proposed integration; the delivery order does not omit the larger models or non-calculator content. No code, source publication, deployment or push has been performed for this review.

Primary methods and detailed template findings: [research report](upload-calculator-methods-research.md). Temporary extraction and inspection tooling are on `/mnt/sdb`, outside the repository.
