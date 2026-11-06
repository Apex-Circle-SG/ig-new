# Finance & Accounting library

Implemented locally: a separate **Finance & Accounting hub**, eight focused collections, **47 new guides/reference pages**, and additions to five existing business readings. The new structure adds 56 discoverable knowledge URLs and preserves all 367 earlier catalogue URLs. Nothing has been pushed or deployed for this change.

## Reader structure

| Collection | Direct guides/reference pages | Reader purpose |
| --- | ---: | --- |
| Statements & Accounting Policies | 5 | Accounting terms, balance sheet, P&L, sector layouts and intangible-asset policies |
| Ratios & Financial Performance | 12 | Formula reference, ratio interpretation, returns, earnings, debt coverage and commercial/subscription measures |
| Cash Flow & Working Capital | 7 | Cash classifications, free cash flow, operating cycle, liquidity, burn/runway and business drivers |
| FP&A, Budgets & Forecasts | 7 | Budget methods, finance partnering, reporting, data quality, forecasting and practice |
| Valuation & Transactions | 5 | Project cash flows, DCF, cost of capital, market measures and purchase-price allocation |
| Controls, Audit & Tax | 5 | AP controls, red flags, transfer-pricing comparability, methods and profiles |
| Integrated & Sustainability Reporting | 3 | Integrated thinking, six capitals, value creation and dated reporting context |
| Finance Careers & Skills | 3 | Finance functions/roles, credential terminology and development |

The finance gateway shows eight subject cards before optional reading paths. The library provides collection-first browsing, scoped subtopics and an explicit all-finance view. Full-text search remains available. The existing seven-card Business gateway remains intact and links to Finance.

The [formula reference](https://insightginie.com/library/knowledge/accounting-formula-directory/) has name/expression/input/scope search, review-state filtering, incremental display and links directly to the relevant formula in its full reading. This link becomes available on the live site after an authorised push and deployment.

## Source preservation

Archive SHA-256: `21bfbe2ba7db3cfd302363f2326b94e27c7f5db928980dc01d447c05e67448e9`.

| Supplied document | Nonempty paragraphs | Approximate words | Tables | Images |
| --- | ---: | ---: | ---: | ---: |
| Management Accounting.docx | 2,057 | 16,330 | 50 | 5 |
| Integrated Reporting.docx | 78 | 624 | 1 | 2 |
| Total | 2,135 | 16,954 | 51 | 7 |

Every nonempty paragraph and image has a destination in the [coverage ledger](accounting-content-coverage.csv). The original archive and [inventory](../content/sources/finance/accounting/editorial/inventory.json) retain original text, document/media hashes and table/cell positions. Page-layout tables are reflowed by meaning; all source cell text remains covered. The nine AP controls are presented as a four-column comparison rather than a flattened list.

Formula originals, including their associated explanations and the formula split across two source paragraphs, are retained in accessible “Original supplied wording” disclosures. Those disclosures use Google's `data-nosnippet` boundary so known original transcription/definition problems are not offered as the intended search-result summary. Original text remains accessible; this does not guarantee any Google indexing outcome.

Limited, documented copy edits normalize obvious transcription errors in ordinary finance prose, such as “cosh” → “cash”, “soles” → “sales” and “IRFS” → “IFRS”. Formula originals remain unchanged apart from the existing whitespace normalization. The [formatter](../scripts/content-business/accounting.py) records these edits. No numeric source value is silently replaced.

All 262 earlier generated guides/indexes remain present. Their earlier sections and figures are unchanged. Five existing readings receive finance material in its appropriate home: customer-feedback (NPS), marketing-logistics (inventory/fulfilment measures), market-sizing (contract-value TAM), sales-revenue-planning (quota attainment) and sales-forecasting (weighted pipeline). The old editorial statement that the NPS formula was absent is updated to explain what the new source supplies and what is still missing.

## Formula review

The upload contains **135 explicit equals-sign entries**, not 135 unique, universally valid financial identities. Some repeat, some contain several expressions, and some are narrative checks or incomplete forecast models.

| Review state | Entries | Meaning |
| --- | ---: | --- |
| Reviewed with scope | 40 | The expression is accompanied by defined inputs, units and applicability limits |
| Corrected or clarified | 34 | A source error, mismatch, omitted convention or incomplete expression has a visible editorial correction/clarification |
| Convention-dependent | 57 | The measure needs its stated accounting, operating, cohort, agreement or model assumptions |
| Needs clarification | 4 | The supplied definition is insufficient for a usable expression |

The [formula review ledger](accounting-formula-review.csv) records each source paragraph, name, state, review detail, expression, units, destination and original wording. The [reviewed definitions](../scripts/content-business/accounting-formulas.json) hold the inputs and scope; the generated directory maps all 135 entries to exactly one displayed formula anchor.

Corrections include asset-turnover division, the payable-days expression mislabeled as DSO, period-day scaling, working-capital cash signs, investing-flow scope, FCFF/FCFE bridges, the DuPont identity, the EBITDA double-add-back sequence, recurring-revenue cohort/movement definitions, budget variance versus attainment, and cost of equity versus a generic discount rate. Inputs and definitions distinguish book versus market bases, average versus closing balances, currency versus days/multiples/percentages, positive burn versus signed cash flow, and actual capital expenditure versus changes in asset balances.

Four expressions remain explicitly unresolved:

1. **Cash flow to investors:** the source does not establish whether FCF means FCFF, FCFE or another measure, and the cash-flow audience/financing signs are unclear.
2. **Fixed-charge coverage:** the loan agreement, test period and definitions are missing; a generic covenant calculation cannot be certified.
3. **Sales-rep/ramp forecast:** quota, capacity, ramp/attainment and timing units are incomplete.
4. **Ad-spend/conversion forecast:** spend-to-lead/customer economics and revenue inputs are missing.

The partner-referral expression is labeled a partial referral-count model, not a completed sales/revenue forecast. Other conditional measures retain their explicit limitations. Review states are editorial classifications, not professional assurance or approval of a company's accounting, valuation or tax treatment.

Four independent arithmetic examples check the declared FCFF, FCFE, DuPont and cash-cycle sign/unit conventions. No source string is evaluated as executable code and no new calculator is introduced. Existing cash-runway and break-even tools are linked where useful.

## Seven visual reconstructions

The original wide raster images are retained in the repository source archive and reconstructed using the site's existing themed comparisons and flows:

- Purchase-price-allocation stages and valuation-method labels.
- Operating/master/financial budget relationships, preserving the ambiguous source “Financial budget” box label with a note.
- Profitability/efficiency/liquidity/solvency analysis map, with horizontal, vertical and sensitivity/scenario context.
- Transfer-pricing lifecycle and its review loop.
- Finance organization roles, reporting relationships, responsibilities and skills.
- Six capitals, the business model, governance, environment, strategy, performance and outlook.
- Inputs, activities, outputs and outcomes, distinguishing organization-added value from customer value.

No new source raster is shipped to public assets. Visual comparisons scroll within their panels on small screens and retain text equivalents. Captions and limitations distinguish conceptual relationships from numerical evidence.

## Missing and dated material

Seven identical unavailable-download placeholders under Auditing Software are recorded at all seven original positions and disclosed on the finance-red-flags reading. The underlying material is not embedded in the upload, so no software names, descriptions or links are invented. Exact repeated placeholders may share one displayed notice.

Company names in the ARR “successful strategies” list have no supplied outcomes. Sector/company illustrations are undated notes. Tools and credential names remain source lists with explicit scope; current fees, availability, rankings and eligibility are not invented. CFA terminology is clarified using its issuer.

The source's 2013 IIRC and 2014 EU directive material remains dated historical context. Current entity-specific reporting scope, deadlines and tax rules are not inferred. Intangible recognition, goodwill, revaluation and transfer-pricing statements have framework/transaction qualifications. Break-even/CVP and some cost-accounting topics are named without full methods or completed cases; missing worked examples and datasets are not fabricated.

Primary references on the affected readings include OpenStax, ACCA, NYU Stern/Damodaran, SEC, IFRS Foundation, OECD, BIS, Stripe, CFA Institute and the European Commission. References support the associated definitions or context; they do not authenticate every claim in the supplied notes. [Initial review and classification map](accounting-content-review.md) retains the proposal and identified issues.

## Verification and limits

Source-preservation assertions pass for all 2,135 paragraphs, 51 source tables, seven images and 135 reviewed-expression destinations. Earlier content and URLs are preserved. Typecheck and production build pass. Functional checks cover finance/business browsing, scoped filters, formula pagination, state filtering, search, corrected expressions, formula deep links and opening the original source wording.

[Preservation and review evidence](verification/accounting-library.json) and [mobile/desktop browser evidence](verification/accounting-browser.json) record final checks, including source disclosures, visual sizing, accessibility, canonicals, links and sitemap/content-index coverage. The final review passes 138 mobile/desktop renders, 30 accessibility audits, 270 original-formula disclosure comparisons, 14 visual checks (seven reconstructions at two widths), and 423 route checks. All 423 knowledge URLs appear in the combined sitemap, content sitemap and human-readable index. The formula directory links to all 135 displayed entries.

Graphify's bounded architecture graph is refreshed. Preview processes are stopped after review, scratch/build output is stored on the mounted volume, and unrelated user changes are preserved. No dependency, new calculator or content unit-test suite is added. Nothing is pushed; live deployment and actual Google indexing are not verified.
