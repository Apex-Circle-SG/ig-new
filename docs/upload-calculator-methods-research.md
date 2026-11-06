# Uploaded finance tools: methods research

Reviewed 6 November 2026. Primary-source conceptual review for the D.zip integration proposal. This report does **not** validate the uploaded workbook formulas, cached results, provenance, or redistribution rights. Recommendations below are editorial/method choices for review, not implemented features.

## Suitable calculator concepts

### EPS accretion and dilution

Compare the buyer's standalone EPS with post-deal EPS for the same period and earnings basis. A percentage comparison is `(post-deal EPS / standalone EPS) - 1`; zero standalone EPS makes that ratio undefined, and negative EPS makes its sign difficult to interpret. Keep the absolute EPS change visible. A NYU original research paper defines an accretive acquisition as combined EPS exceeding the buyer's pre-deal EPS, but explicitly uses a simplified stock-only method that excludes several transaction effects; it is not a full merger-model specification. [NYU original EPS research, methodology pp. 3–4](https://www.stern.nyu.edu/sites/default/files/assets/documents/con_047220.pdf).

Required explicit assumptions: purchase consideration and funding mix, buyer share issue price and dilution, earnings forecast period, closing timing, financing interest, foregone cash interest, taxes, synergies and their timing, transaction/integration costs, and acquisition-related depreciation/amortisation. Identify excluded adjustments. IFRS 3 requires acquisition accounting for identifiable assets/liabilities and goodwill; a shortcut EPS worksheet does not establish accounting compliance. [IFRS Foundation standard overview](https://www.ifrs.org/issued-standards/list-of-standards/ifrs-3-business-combinations/).

EPS improvement does not establish value creation: in a simplified all-stock purchase, buying a lower-P/E target can mechanically increase EPS. Avoid a “good acquisition” verdict based on this result. [Damodaran's own acquisition lecture, slide 106](https://pages.stern.nyu.edu/~adamodar/podcasts/valUGspr19/session26slides.pdf).

### Debt capacity

A leverage ceiling, an interest-coverage ceiling, and cash available for scheduled debt service answer different questions. A single EBITDA multiple does not demonstrate repayment capacity. The Federal Reserve's published leveraged-lending guidance separately discusses cash-flow repayment, leverage, coverage covenants, collateral, and realistic downside scenarios. Use it here as analytical context, not a claim about a universally applicable borrowing limit or current rules in every jurisdiction. [Federal Reserve primary guidance](https://www.federalreserve.gov/frrs/guidance/interagency-guidance-on-leveraged-lending.htm).

Required explicit assumptions: EBITDA/EBIT definitions, existing debt and required payments, interest rate and rate stress, taxes, maintenance capex, working capital, minimum cash, amortisation and maturity, cash-sweep rules, and user-specified leverage/coverage limits. A coverage-derived debt amount is a screening estimate; distinguish total capacity from additional borrowing after existing obligations. Damodaran's rating spreadsheet estimates ratings/cost of debt from interest coverage, illustrating that this is a separate estimate rather than lender approval. [NYU corporate-finance spreadsheet catalogue](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/cfspread.htm).

### Simple leveraged buyout

Separate sponsor equity return from enterprise valuation. Model equity paid in, subsequent equity distributions/contributions, debt balances, and exit equity proceeds. For a single initial investment and one exit receipt, annualised return is `(exit equity / initial equity)^(1 / years) - 1`; interim flows require a cash-flow IRR with stated timing. The proceeds multiple does not itself annualise returns. These are model-design identities, not validation of the supplied workbook.

Required explicit assumptions: entry price/multiple, purchase funding and fees, operating forecast, taxes, capex, working capital, interest basis, mandatory repayment/cash sweep, holding period, exit multiple and sale costs, and cash/debt treatment in the enterprise-to-equity bridge. Debt repayment must be supported by cash generation. Higher leverage increases equity risk; changing leverage also changes discount rates in valuation models. An exit-multiple return illustration should be labelled as such. [Damodaran's original acquisition chapter, leveraged-buyout section pp. 47–53](https://pages.stern.nyu.edu/~adamodar/pdfiles/valn2ed/ch25.pdf); [NYU original LBO spreadsheet catalogue](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/eqspread.htm).

### VWAP

Market VWAP for one security over a stated window is `sum(trade price × trade volume) / sum(trade volume)`. IBKR describes a daily market execution benchmark; the JSE specification distinguishes eligible on-book trades from all eligible trades. Specify instrument, window/session, eligible trades, units and data source; require positive total volume. [IBKR primary glossary](https://www.interactivebrokers.com/campus/glossary-terms/volume-weighted-average-price-vwap/); [JSE market-data specification, sections 4.6–4.7](https://www.jse.co.za/sites/default/files/jse_document_manager/RW/Internal/ITaC/Trading%20and%20Market%20Data%20Documentation/Volume%20A%20JSE%20Market%20Data%20Statistics%20-%20Equity%20Market.pdf).

Consequences of that definition: user purchase prices weighted by quantities yield that user's weighted average purchase price, not market VWAP without market trade data. Averaging prices across different securities is not portfolio performance. A year-long volume-weighted price needs that explicit window; a simple average of annual prices, or an unweighted average of daily VWAPs, is a different statistic. Candle typical-price approximations should be labelled approximations.

## Decision templates and knowledge content

**Due diligence, integration scorecards, and synergy/culture exercises are primarily decision templates**, even if they contain totals, weighted ratings or charts. Their outputs depend on evidence, rubrics and judgment. Do not present a numeric score as an independently validated deal recommendation. Preserve question prompts, evidence references, unresolved issues, owners and scoring definitions. This is an editorial recommendation rather than an assertion about these uninspected workbooks.

Synergy valuation should identify incremental cash flows relative to the separate businesses and their timing; operational and financial synergies differ. Delayed benefits are worth less today. For integration measurement, distinguish a recurring run-rate saving from cumulative realised savings, revenue from contribution/cash benefit, and gross benefits from implementation costs. Record baseline, period, accountable owner and evidence; avoid counting the same benefit twice. Culture ratings can guide discussion but do not by themselves become cash-flow synergy. These measurement recommendations apply Damodaran's cash-flow-and-timing framework. [Damodaran, *The Value of Synergy*, original 2005 paper, pp. 3–7](https://people.stern.nyu.edu/adamodar/pdfiles/papers/synergy.pdf).

**IPO material belongs in explanatory/comparison content unless it has a defined numerical method.** The SEC explains that offering prices combine market conditions, analysis and negotiation, can differ materially from subsequent trading prices, and that selling-shareholder proceeds differ from money raised by the issuer. No universal “healthy” IPO return, valuation multiple or readiness score follows from that guidance. [SEC investor bulletin](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-17).

Any proposed IPO benchmark needs an identified cohort, geography/exchange, dates, sector, offer versus aftermarket starting price, measurement horizon, price versus total return, treatment of delistings/missing observations, and source. Listing eligibility must cite the intended exchange's applicable requirements; distinguish eligibility from investment attractiveness. These are comparison-design requirements, not verified facts about the supplied DOCX content or a request to add an IPO calculator.

## Actual template-content review

The following findings supersede the earlier “uninspected workbooks” qualification **for these three templates only**. Primary evidence is the extracted source material in `/mnt/sdb/ig-new-review/deal-models/`: each workbook's `.xlsx.json` and per-sheet `.txt`, plus `Post-Merger Integration Plan.docx.txt`. Formula cells with empty formula text but shared-formula attributes are spreadsheet storage scaffolding, not evidence that the original workbook lacks those formulas. No files were implemented or published.

| Supplied item | Actual contents | Suggested reader-facing form |
| --- | --- | --- |
| Due Diligence Template.xlsx | Two versions of the same checklist, examples and blank, with owners, notes, completion, dates and Gantt calendar | M&A due diligence checklist and schedule planner |
| M&A Integration Scorecard Template.xlsx | Example and blank scorecards with 100-day/year-one plan versus actual measures; eight simple SUM formulas per sheet | Integration performance tracker with separately defined metrics |
| Synergy and Culture Mapping Exercise.xlsx | One culture-mapping sheet; no financial synergy model and no formulas | Culture comparison exercise with a small gap calculation |
| Post-Merger Integration Plan.docx | Document-control fields, contents list, and empty numbered planning headings | Guided integration-plan outline/download, pending substantive guidance |

### Due diligence: useful checklist, not a deal-quality calculator

Both sheets contain **18 top-level headings and 103 numbered non-heading rows** in D5:D125. Of those 103 rows, D9 (“Capital structure”) is a grouping label for D10:D14, and D41 (“Copies of”) is an incomplete introductory fragment. Excluding those leaves **101 substantive request/task rows** per version, not 202 separate prompts. D116 and D120 both request insurance policies, leaving approximately **100 distinct requests** after that explicit duplicate is consolidated. This is a counting convention based on the actual text, not a claim of comprehensive diligence coverage.

Content spans organisation, financials, physical assets, property, IP, employees, permits, environment, tax, contracts, products, customers, litigation, insurance and advisers. “Documentation” (D54) and “Listing of Claims or Grievances” (D59) are really IP subsections by the meaning of D55:D60; grouping them under IP would improve navigation. The checklist has jurisdiction-specific references such as UCC filings (D36), EPA/Superfund (D78:D79), and state sales tax (D83), so identify its US-oriented starting point rather than imply universal completeness. Source spelling and fragment issues need editorial review, including D79's “litigation of investigations.”

Specific scheduling/completion limitations:

- B29 repeats `2.1` already used at B20, and B49 repeats `4.1` from B40; preserve source row traceability while assigning unique planner references.
- I5 is `AVERAGE(I6:I18)`, treating all included rows equally, including the capital-structure parent alongside its children. E5 simply reflects I5; C5 marks completion only when I5 equals 100%. These are progress mechanics, not risk-weighted diligence conclusions. Define “received,” “reviewed,” “resolved,” “not applicable,” and missing inputs before claiming completion.
- Row 4 includes predecessors, but the inspected formulas calculate date display, business-day duration/finish variance and completion; they do not establish an automatic dependency scheduler. O5 uses `NETWORKDAYS(L5,M5)` with no holiday list. N5 uses `NETWORKDAYS(K5,M5)-1` when scheduled and actual finish differ. Define weekend/holiday and early/late conventions and test blanks/reversed dates before reproducing them.
- The blank sheet's 10,750 formula cells mostly repeat a calendar across P:CU; the example has 7,334 across the shorter calendar. These counts should not be described as thousands of substantive checks. G2 is a prefilled start-date serial even in the blank version; dates and example owner names are sample data.

Recommendation: preserve the meaningful requests and source references, consolidate duplicates and IP subsections, and treat findings/evidence review separately from percentage task completion. Missing modern subjects such as cybersecurity/data privacy are not explicitly developed into dedicated sections in this source; any additions would be new editorial material requiring sources.

### Integration scorecard: unit and status definitions need correction

There are **10 populated objective rows** per sheet (B10:B11, B15:B16, B20:B21, B25:B28), plus three “Other” slots; totals and headers are not extra objectives. The eight formulas only sum D:G in rows 12 and 17. Status labels are literal text, with no formula connecting them to performance.

The example `MA Integration Scorecard -EX` illustrates why copying it directly would mislead:

- D3 states dollar thousands. B16 says “Reduce Headcount by 250 FTE,” but D16/E16/G16 contain 9,000/10,000/16,000, and D17 sums D15:D16 with inventory reductions. Whether those headcount-row numbers mean money or people is unresolved; summing dollars and FTE would be invalid. The blank version retains the same mixed-unit total structure.
- B11's $500K goal has D11=300 against E11=380 while C11 says “ON PLAN.” B25 requires at least 93% employee retention, but D25=92% against E25=96% and C25 still says “ON PLAN.” These statuses have no documented tolerance or rationale, so do not infer an automatic scoring rule from them.
- B28 asks for a communications score of 4/5, whereas D28=0.9 and E28=1. There is no definition converting a 1–5 score into these proportions. B21's “increase market share by 5%” also needs percentage-versus-percentage-point clarification.
- F10:F16 use zeros for year-one actuals at a 100-day reporting point, while other future actuals use dashes. A future/unreported observation must remain distinct from a measured zero. The “blank” sheet still contains example targets, including $30m cost reduction and 95% employee retention.

Recommendation: offer a configurable tracker only after assigning each metric a unit, definition, baseline, direction, reporting period and status tolerance. Keep inventory cash release, recurring savings and headcount separate; aggregate only compatible monetary benefits on a clearly stated basis. The uploaded targets are examples, not benchmarks.

### Culture mapping: 46 perceptions across 11 groups

The `Culture Mapping Exercise` sheet has **46 bipolar characteristics** in 11 groups: strategic orientation 7, communication 3, training/development 3, rewards 6, decision making 4, risk taking 3, planning 4, teamwork 4, management practices 8, structure 2, technology 2. Counted paired left/right endpoint rows, excluding headers, 1–5 column labels and “ABSOLUTE DIFFERENCE” rows.

B2 directs users to mark the acquirer with A and acquired company with B across C:G (1–5), then calculate absolute differences. There are **zero formulas** and no actual ratings. The difference rows (for example B11 and B17) do not supply per-characteristic calculations or an aggregation method. A numeric A/B selection per characteristic could support `abs(A-B)` in a proposed interactive exercise, but category totals/averages, weights, multi-rater aggregation and missing-rating rules would be new, explicit design decisions.

Higher values are not consistently desirable: B35/H35 maps slow to fast decisions, while B38/H38 maps clear authority to confusion. Do not sum raw 1–5 values into a culture-quality or synergy score. A gap is a perception difference rather than proof of integration difficulty. Ask for respondent/date/evidence and preserve unknown ratings. B9's “product instruction” appears questionable and needs source clarification, not silent reinterpretation. The filename's “Synergy” overstates this workbook's actual contents; use “Culture comparison” as the meaningful title.

### Integration-plan DOCX: outline rather than finished guidance

Paragraphs 39–63 contain **nine major sections** and subordinate headings for strategy, objectives, timeline, review, resourcing, culture, communication and execution. They contain no worked integration activities, instructions, populated responsibilities, timeline, resource estimates or measurement definitions. Paragraphs 14–38 repeat these topics as a contents list with page-number text; they are not additional knowledge. The supplied file can anchor a guided planning outline connected to the culture exercise and scorecard, but should not be presented as a detailed integration guide without authored material.

### Attribution and reuse evidence

The diligence example B127 and scorecard example B32 identify Smartsheet through a create-in-Smartsheet call to action. The integration-plan DOCX paragraphs 64–65 explicitly carry a Smartsheet disclaimer. The inspected workbook core metadata provides no named author; the culture sheet's visible text does not identify an author. These are provenance clues, **not a redistribution or adaptation licence**. Retain original supplied files and cell/paragraph references; distinguish attributed source content from new explanations, and resolve original-source attribution and reuse terms before publishing adaptations. Do not replace that uncertainty with a claim that the materials are original site content.
