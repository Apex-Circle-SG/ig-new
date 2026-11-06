# Economics and Singapore property: integration review

This is the approved pre-implementation review. See [the implementation report](economics-property-implementation.md) for the completed organization, verification and remaining uncertainties. The recommendations considered the earlier local finance/investment work in `c820a56` as well as the published library.

Archive SHA-256: `83f9f109c5d8e9484cf8e75d004fe62719d18b66933902b20b8504c559ef1e77`.

## Recommendation

Create two distinct library entrances: **Economics & Society** and **Property & Housing**, with the property material explicitly identified as **Singapore**. Do not add everything to Business Management or Finance & Accounting. Finance already has ten focused collections locally; economic institutions and housing law serve different reader needs from company accounts or portfolio management.

The economics document also contains computing principles, workplace frameworks, psychological effects, philosophical ideas and spiritual assertions. Distribute those by meaning into the existing library. Avoid turning its “Laws” heading into a page that treats all entries as equally established laws.

## Material examined

| Internal source reference | Nonempty paragraphs | Approximate words | Tables | Images |
| --- | ---: | ---: | ---: | ---: |
| Economics.docx | 443 | 3,526 | 14 | 0 |
| Real Estate.docx | 264 | 2,401 | 14 | 0 |
| Total | 707 | 5,927 | 28 | 0 |

All body text was read. No native equations, symbol fields, substantive auxiliary text, external document hyperlinks, embedded spreadsheets/charts or unavailable-download placeholders were found. Expressions are ordinary text. Several entries are only names, incomplete explanations or uncertain attributions. Temporary extraction files are outside Git under `/mnt/sdb/ig-new-review/economics-property/`.

## New reading structure

### Economics & Society

Organize around questions rather than the document's headings:

| Reading area | Material |
| --- | --- |
| Economic foundations and indicators | Scarcity, inflation, growth, employment/underemployment, discounting, GDP-related measures, inequality/Gini, purchasing-power comparisons and alternative progress indicators |
| Money, banking and public policy | Money/credit, seigniorage, QE, negative rates, bank runs, shadow banking, public interventions and monetary-system dilemmas |
| Trade, development and inequality | Gravity, Heckscher–Ohlin, Linder, Leontief, globalization/localization, development, Kuznets and the supplied r-versus-g hypothesis |
| Economic thought and institutions | Economic schools, political economy, ownership systems and historical references; distinguish government forms, economic arrangements, ideologies and philosophies |
| Business cycles and competing explanations | The historical cycle models, competing boom/bust explanations and debt-deflation notes, with evidence limits and no deterministic forecast |
| Methods and evidence | The supplied measurement references, regressions and model assumptions, cross-linked to existing statistics, investing and critical-thinking guides |

The section called “Microeconomy” mostly describes economy-wide business-cycle explanations and belongs with macroeconomics/cycles. “Government” mixes government forms, economic systems, political movements, favoritism and moral/philosophical theories; those need separate comparison groups. The four bare mathematics labels should remain an identified short reference, not four empty articles.

### Property & Housing → Singapore

Replace the ministry-by-ministry reading order with reader tasks. Retain a secondary, dated agency directory so the original institutional references remain discoverable.

| Reader task | Content to organize |
| --- | --- |
| Understand land, ownership and planning | Property types, tenure, title/registration, interests, easements, planning/GFA, conservation and development permissions |
| Buy, sell or redevelop | Contract formation, OTP/conveyancing, developer-sale versus resale processes, due diligence and collective sales |
| Understand public housing | Eligibility, flat schemes, grants, occupation requirements, resale and letting rules, with date and flat-type distinctions |
| Budget for tax and financing | Property tax, BSD/ABSD/SSD, CPF, loan limits, debt-service measures, lease-related restrictions and the supplied financial expressions |
| Rent, manage and resolve disputes | Tenancy types, covenants, clauses, rental tax/GST, MCST/share values, building management and dispute routes |
| Understand professional and commercial obligations | CEA practice, advertising, client care, AML reporting, PDPA/marketing, industrial/JTC references and relevant agency responsibilities |

Use checklists, process comparisons, ownership/agency maps and scoped formula panels. There are no supplied images requiring reproduction; lightweight diagrams would be editorial additions.

## Existing resources to rearrange or enrich

| Material | Integration decision |
| --- | --- |
| Fama–French, Carhart, CAPE, duration/convexity, momentum, market-cap weighting and CLA | Enrich existing investing/model/risk/portfolio readings. Do not move investing out of Finance simply because these entries arrived inside Economics. |
| SUR, GLS, distributions and the law of large numbers | Connect methods/statistics readings and existing AI statistics where helpful. They are general methods, not intrinsically AI-only concepts. Consolidate Gaussian/bell-curve repetition. |
| Web business-model labels | Extend the existing business-model material, linking subscriptions, freemium, advertising, affiliate, brokerage and utility pricing. |
| Cynefin, Occam, Barnum/Forer, Texas sharpshooter and decision-choice effects | Place in Problem Solving and evidence/decision-making readings. Connect spurious market patterns to the existing investment-behavior guide. |
| Ouchi Theory Z, Gilbert BEM, Allen curve, Hawthorne, culture onion and Golden Circle | Enrich People/Leadership, organizational culture or communication, preserving the distinction between frameworks and evidence. Gilbert BEM is separate from the unrelated “Gilbert's law” entry. |
| Moore, Amdahl and Conway | Technology and software/systems relationships; cross-link organizational communication where relevant. |
| Wright/learning curves and limiting-resource concepts | Process Improvement or operations, linked to the existing constraints reading; avoid claiming context-free cost reductions. |
| Productivity proverbs and uncertain named “laws” | Personal Development or an explicitly attributed aphorism/reference section. Do not invent authors or scientific status for “Jidelim”, “Walson”, “Octopus” and similar labels. |
| Vibration, three-forces and seven-stage assertions | Beliefs & Mysteries → Metaphysics/spiritual frameworks, separate from physics and economics. The upload does not establish scientific mechanisms or identify complete traditions/sources. |
| Existing `real-world-assets` Web3 article | Keep its tokenization/legal-rights content in Web3. Clarify its title to **Tokenized assets and property records**, preserve its URL, and link to the new property area. Its actual content does not need wholesale relocation. |
| Existing investment-assets/funds guides | Keep their general property/REIT exposure references in Finance; link to Singapore housing for jurisdiction-specific questions. The source's “REITs is not heterogeneity” fragment is unclear and should not become a new financial claim. |
| Existing price-elasticity and global-marketing guides | Cross-link the relevant economics material. Singapore-property market assumptions and marketing compliance belong with property practice; generic pricing/globalization explanations need one primary home. |

Keep existing URLs whenever a title, primary collection or related link changes. Reorganization should improve discovery without breaking earlier bookmarks.

## Source accuracy and evidence distinctions

The “Laws” list combines mathematical statements, conditional economic models, empirical patterns, management frameworks, cultural ideas, aphorisms and speculative associations. Label those distinctions beside the relevant material instead of applying one blanket “law” label.

Important issues include:

- `GDP = MV = PT = CV` uses money, trade and total-credit-debt variables without a defensible common scope. Do not reproduce it as a valid chain of calculator identities. Distinguish transaction-based and output-based formulations and verify the intended definitions.
- QE is too broadly defined as introducing money; the mechanism needs explanation. The ECB identifies asset purchases as the relevant tool. [ECB explainer](https://www.ecb.europa.eu/ecb-and-you/explainers/show-me/html/app_infographic.en.html).
- “PPP” means public-private partnership in one place and purchasing-power parity in another. Expand it in context and do not merge the entries.
- Kuznets business-cycle swings and the Kuznets inequality hypothesis are separate ideas. Time-weighted returns and discounted cash flows are also different concepts despite similar wording in the source.
- The negative-rate, bailout, seigniorage, swap, perfect-market and wage/profit statements are abbreviated or overly general; model assumptions and scope are missing.
- The 18-year property cycle and the other named cycles are not reliable calendars supplied with validated data. The source gives an Anderson attribution but no dataset or predictive test.
- The deflation section mixes a debt-deflation sequence, market commentary and political labels. Nationalization or communism must not appear as inevitable consequences of recession; worker-shortage and higher-labor-cost fragments do not automatically belong to the same causal chain.
- The Super Bowl association and calendar-return patterns need treatment as possible spurious/historical patterns, not actionable trading rules.
- The Losada entry must not become a validated team score or positivity target. A primary critique rejects the mathematical basis of the claimed critical positivity ratio; this does not imply that all research on positive interactions is invalid. [Brown, Sokal and Friedman](https://arxiv.org/abs/1307.7006).
- Several attributions/spellings need checking, including Malthus/Hayek, the prisoner’s-dilemma/Nash association and the unidentified named laws. Bell-curve wording omits clear parameter symbols; there are no hidden native equations to recover.

## Singapore property needs a dated rules audit

The property file is **mixed-vintage study material**, not a coherent current rulebook: it includes explicitly dated 2016 CPF figures alongside a 9% GST reference and many undated limits. Preserve the original notes and put verified current explanations alongside them. Do not silently replace every old number, or mark every number as obsolete merely because other parts are old.

Sample official cross-checks already show material differences:

| Source statement | Review finding |
| --- | --- |
| Foreign-buyer ABSD 15%+ | IRAS's published schedule gives 60% for foreign individuals' residential purchases from 27 April 2023, subject to applicable treatment/remissions. [IRAS](https://www.iras.gov.sg/quick-links/tax-rates/stamp-duty) |
| Owner-occupier zero-rate band starts at $8,000 | IRAS's bands effective January 2025 start with $12,000 at 0%. [IRAS property tax](https://www.iras.gov.sg/taxes/property-tax/property-owners/property-tax-rates) |
| HDB loan up to 90%; bank figures of 80%; TDSR 60% | HDB's financing page gives a 75% limit with conditions; MAS gives a 55% TDSR threshold for loans within that framework. Do not infer every borrower's actual maximum. [HDB](https://www.hdb.gov.sg/buying-a-flat/financial-planning-for-a-flat-purchase/credit-to-finance-a-flat-purchase), [MAS](https://www.mas.gov.sg/regulation/explainers/tdsr-for-property-loans/calculating-tdsr-thresholds) |
| MOP always five years / letting after MOP | HDB distinguishes five-year Standard and ten-year Plus/Prime MOPs; whole-flat letting also depends on flat category. [HDB framework](https://www.hdb.gov.sg/buying-a-flat/bto-sbf-and-open-booking-of-flats/finding-a-new-flat/standard-plus-and-prime-housing-framework), [government letting guide](https://www.gov.sg/explainers/renting-out-your-hdb-flat/) |
| Treaty list includes Ireland | IRAS names Iceland, Liechtenstein, Norway and Switzerland under specified nationality/residency conditions, and US nationals. Ireland is not interchangeable with Iceland; this is a substantive eligibility issue. [IRAS FTA treatment](https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29) |

Other priority checks include BSD/SSD acquisition-date rules, grants/eligibility, CPF lease and withdrawal rules, en-bloc thresholds/processes, planning/land-use figures, succession/trust/bankruptcy statements, agency licensing/CPD, penalties, fees, tenancy law and advertising/privacy rules. Agency names and responsibilities also need checking; they should not determine the reader hierarchy.

The “weighted income” expression mixes age and income inconsistently and may intend income-weighted average age. Confirm the intended measure and loan-rule application before correcting it. The GST expression needs property type, registration status and a consistent time basis: IRAS distinguishes residential rent and movable furniture/fittings; subtracting an annual value from an unspecified gross rent is not a universal rental-tax formula. [IRAS real estate GST](https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/specific-business-sectors/real-estate).

Each practical rules section should identify jurisdiction, transaction/property type, effective date, official source and last verification date. Unresolved material can remain accessible as clearly identified source notes rather than operating instructions. Property calculators should wait for properly scoped, verified rules; no calculator is authorized by this review alone.

## Preservation and implementation scope

Map all 707 paragraphs and 28 source tables to reader destinations, consolidating genuine repetition without losing source associations. Separate corrections, source text and editorial explanation. Short or uncertain entries can share contextual reference sections instead of generating thin pages.

On implementation, update categories, breadcrumbs, related links, canonical discovery, the combined sitemap and human-readable index together. Preserve earlier finance/leadership work and its URLs. A full legal/tax/eligibility audit remains implementation work: the sample checks above do not validate every rule in the property document.
