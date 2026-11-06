# Accounting upload: review and proposed classification

This is the original review and approved proposal. Its implementation is documented in [Finance & Accounting library](accounting-library.md), with source coverage and formula-review evidence. The historical proposal below is retained for context.

## Inventory

Archive SHA-256: `21bfbe2ba7db3cfd302363f2326b94e27c7f5db928980dc01d447c05e67448e9`.

| Document | Nonempty paragraphs | Approximate words | Tables | Images |
| --- | ---: | ---: | ---: | ---: |
| Management Accounting.docx | 2,057 | 16,330 | 50 | 5 |
| Integrated Reporting.docx | 78 | 624 | 1 | 2 |
| Total | 2,135 | 16,954 | 51 | 7 |

Management Accounting contains 135 paragraphs with an equals sign. This is a review workload, not a count of unique or verified formulas: some entries repeat or contain several expressions. No native Word equation objects, external document links, other embedded charts/files, or substantive header/footer/comment/footnote text were found. Formula content is ordinary document text and image content, so it must still be checked carefully.

The material covers much more than its source filenames suggest: financial accounting, corporate finance, business and SaaS metrics, FP&A, reporting, controls, transfer pricing, integrated reporting and professional development. Some cost-accounting subjects, including break-even and CVP, are named without substantive methods or solved examples. The collection should not be presented as a complete cost-accounting textbook.

## Recommended home

Create **Finance & Accounting as a separate knowledge hub**, linked from Business & Management, its Operations/Strategy collections and relevant finance tools. Keep the existing business gateway focused. Use a compact subject directory and progressive browsing rather than adding another long list to Business.

| Area | Material and reader purpose |
| --- | --- |
| Statements & Accounting Policies | Accounting equation, accrual/cash distinctions, balance sheet, P&L, account terminology, recognition/measurement, intangible assets and development expenditure |
| Ratios & Financial Performance | Liquidity, leverage, solvency, efficiency and profitability; EBIT/EBITDA, returns, coverage and clearly separated commercial/subscription metrics |
| Cash Flow & Working Capital | Operating/investing/financing cash flow, FCFF/FCFE, cash conversion cycle, receivables, payables, inventory, liquidity, burn and runway |
| FP&A, Budgets & Forecasts | Finance-function roles, operating/master/financial budgets, forecast approaches, driver analysis, reporting cycles, presentations, data controls and forecast exercises |
| Valuation & Transactions | PV/FV, DCF, terminal value, discount rates, WACC, capital allocation, purchase-price allocation, goodwill and acquired intangibles |
| Controls, Audit & Tax | AP control matrix, segregation of duties, preparer/checker, reconciliation, red flags and a distinct transfer-pricing section for methods, documentation, profiles and profit-level indicators |
| Integrated & Sustainability Reporting | Six capitals, value creation, business-model interaction, reporting benefits/costs and historical regulatory context |
| Finance Careers & Skills | Finance organization chart, accounting/treasury/FP&A/M&A roles, skills, certification terminology and audit-to-FP&A development |

These are subject entrances, not eight giant articles. Individual readings should follow actual questions—for example “Read a balance sheet”, “DSO, DPO and inventory days”, “Reconcile EBIT, EBITDA and cash flow”, “Build an operating budget”, “Understand transfer-pricing methods”, or “Follow the six capitals through a business model”. Final article count should follow the editorial mapping rather than an arbitrary quota.

The conceptual pages and formula reference should complement each other. A searchable formula index can group definitions and link to the explanation, assumptions and examples; it should not become a second disconnected copy of the material.

## Classification map

Paragraph indices below are zero-based and end-exclusive in the extracted nonempty paragraph sequence. This is a review map; the implementation needs item-by-item destinations rather than treating each broad range as a single page.

| Management Accounting range | Meaning / destination |
| --- | --- |
| 0–8 | Accounting scope and professional context |
| 8–171 | Balance-sheet, cash-flow, profitability, return and specialist ratio entries; split by meaning, including NPS and transfer-pricing indicators |
| 171–192 | Inventory and fulfilment metrics; finance interpretation with links to operational logistics |
| 192–235 | SaaS/customer, sales and recurring-revenue metrics; distinguish financial measures from commercial operating KPIs |
| 235–291 | Accounting terminology and recognition distinctions |
| 291–403 | Working-capital methods, analysis prompts and sector examples |
| 403–528 | Balance-sheet preparation, forecasting, analysis prompts and industry layouts |
| 528–568 | AP controls, responsibilities and risks |
| 568–585 | Purchase-price allocation, definitions and process figure |
| 585–680 | P&L preparation, forecasting, analysis prompts and sector examples |
| 680–811 | Cash-flow management, drivers, classifications and capital-project cash flows |
| 811–865 | Finance responsibilities, planning functions, master-budget and analysis figures |
| 865–1167 | FP&A, reports, budgeting approaches, data quality, disclosures and reporting improvement |
| 1167–1296 | Forecast methods, reliability, exercises and industry applications |
| 1296–1317 | Red flags and control weaknesses |
| 1317–1402 | EBIT improvement, interpretation and source exercises |
| 1402–1566 | EBITDA variants, coverage, returns, limitations, adjustments, exercises and applications |
| 1566–1615 | DCF workflow, assumptions, forecasting and limitations |
| 1615–1712 | ARR/MRR, subscription economics, growth, tracking and named tools/examples |
| 1712–1793 | Intangibles, recognition, costs, revaluation, development and disclosures |
| 1793–1907 | Transfer pricing, documentation, methods, adjustments and functional profiles |
| 1907–1915 | Auditing-software heading and seven unavailable-content placeholders |
| 1915–2057 | Careers, certifications, roles, skills and audit-to-FP&A development |

Integrated Reporting paragraphs 0–78 belong in the reporting collection, with its two diagrams mapped separately and related links to strategy, brand value and stakeholder responsibility.

## Presentation and formula review

Every formula needs a meaningful name, readable expression, definitions of inputs, period/units, interpretation and assumptions. Separate revenue, operating profit, net profit, accounting balances and cash; show which quantities use average versus closing balances. Distinguish percentages, multiples, money and days. Explain denominator and sign conventions, including zero/negative values where meaningful. Interpretive statements such as “higher is better” need context rather than automatic approval.

Rebuild the seven diagrams in the established theme: purchase-price allocation steps, operating/financial budget relationships, ratio-analysis matrix, transfer-pricing lifecycle, finance organization chart, integrated-reporting value-creation model and six-capital input/output/outcome flow. Retain the original images in the source archive. Include every meaningful label and relationship in readable visual or accompanying text.

Sector layouts, company names, discussion prompts and exercises should remain accessible in their relevant readings. Exercises without data or answers must be identified as prompts; they are not completed case studies. Exact duplicate passages can share a treatment with all source locations mapped. Distinct wording, qualifications and examples must remain available.

### Problems already identified

1. **Asset turnover:** the source uses subtraction in `Net Sales - Average Total Assets`; the standard ratio divides net sales by average total assets. Preserve the original in provenance and show a cited correction in the reading. [OpenStax](https://openstax.org/books/principles-financial-accounting/pages/a-financial-statement-analysis).
2. **DSO/DPO:** one “DSO” entry uses accounts payable and describes supplier payments, conflicting with the receivables-based DSO entry elsewhere. Distinguish receivable days and payable days, including any cost-of-sales proxy used for purchases. [ACCA](https://www.accaglobal.com/sg/en/student/exam-support-resources/fundamentals-exams-study-resources/f7/technical-articles/appraisal-questions.html).
3. **Cash-flow definitions:** the source changes the sign of working-capital adjustments, gives inconsistent FCFE/LFCF expressions, mixes balances with changes in balances and uses potentially ambiguous CAPEX/net-debt signs. Reconcile assumptions before presenting any expression as a usable model.
4. **Mismatched labels/explanations:** operating-cash-flow/current-liability coverage is described as a revenue ratio in one place; cash-conversion efficiency is paired with a working-capital-turnover expression and a days interpretation. Resolve labels, dimensions and definitions explicitly.
5. **EBITDA procedure:** one sequence excludes depreciation/amortisation before instructing the reader to add them back again. The DuPont outline also lists a family of measures rather than a usable algebraic identity. Both need reviewed explanations rather than literal calculator conversion.
6. **Subscription metrics:** “net MRR” versus “new MRR”, net dollar retention, expansion/contraction revenue and CAC payback require agreed cohorts, periods and input definitions. ARR, bookings, recognized revenue and cash receipts must not be conflated. Broad SaaS-margin and churn claims are unsupported generalizations.
7. **Budgeting/reporting labels:** the zero-based-budgeting description repeats an annual-operating-plan description, and the balanced-scorecard description repeats relationship-building wording. These are misplaced definitions, not complete treatments.
8. **Accounting policies:** goodwill amortisation, development recognition, revaluation, purchase-price allocation and workforce-related value require framework-specific qualification. The source’s wording around research expenditure is contradictory. IAS 38 distinguishes research expense from development that meets recognition conditions. [IFRS Foundation](https://www.ifrs.org/issued-standards/list-of-standards/ias-38-intangible-assets/).
9. **Reporting age:** 2013 IIRC and 2014 EU directive references should retain their dates. The Integrated Reporting Framework was revised in 2021; current applicability of EU reporting requirements needs checking rather than recycling the historical threshold. [IFRS framework](https://www.ifrs.org/issued-standards/integrated-reporting/framework/), [European Commission](https://finance.ec.europa.eu/financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en).
10. **Unavailable material:** seven auditing-software placeholders contain no recoverable underlying material in the supplied archive. Keep them in the source inventory and disclose the gap. Named ARR success examples supply company names without results; tool and certification names require verification before creating current directories or recommendations.

This is an initial issue list, not a completed formula-by-formula technical validation. Unresolved expressions should be explicitly marked for clarification, retaining the original text rather than silently substituting an invented formula.

## Existing material and calculators

Use existing canonical destinations where they fit: the NPS formula can enrich customer-feedback, sales attainment and weighted pipeline connect to Sales, inventory/fulfilment metrics connect to Operations/logistics, brand valuation links to intangibles/PPA, and project budgets connect to FP&A. Keep topic-specific meanings distinct—for example financial quick ratio versus SaaS quick ratio.

Link existing cash-runway, break-even and finance tools where useful. Do not create a parallel calculator for every formula. Potential later tools include a grouped ratio calculator, cash-conversion-cycle explorer, earnings-to-cash bridge and DCF sensitivity view, but only after definitions and assumptions are reviewed and the calculator work is authorised.

## Preservation and delivery plan

1. Preserve the exact archive and document/media hashes. Inventory every paragraph, table cell, formula-bearing entry, image label and missing-content placeholder.
2. Create an item-level coverage ledger mapping each original item to its meaningful page/section/figure or to an explicit unresolved/missing-content disclosure. The archive alone does not count as reader-accessible coverage.
3. Keep original source wording recoverable; distinguish editorial corrections, normalized notation, contextual updates and deliberate exact-duplicate consolidation.
4. Publish the curated readings only after classification and formula review. Verify no unique source detail disappears during splitting or combining.
5. Check formula formatting, visual size, links and navigation on mobile/desktop, and update the combined sitemap and content index with the new published routes. Retain consent/privacy safeguards for advertising.

No site implementation, calculators, commit, push or deployment was performed for this proposal. Scratch extraction is on the mounted storage volume. Missing source content and unresolved formulas cannot be certified as correct or reconstructed from the upload alone.
